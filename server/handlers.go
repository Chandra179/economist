package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"economist/pkg/client"
	"github.com/gin-gonic/gin"
)

func fetchUpstream(cache *Cache, bucket, cacheKey, upstreamURL string, ttl time.Duration, c *gin.Context) {
	if data, ok := cache.Get(bucket, cacheKey); ok {
		c.Data(http.StatusOK, "application/json", data)
		return
	}
	resp, err := http.Get(upstreamURL)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("upstream request failed: %v", err)})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("upstream %d: %s", resp.StatusCode, string(body))})
		return
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "read upstream response"})
		return
	}
	_ = cache.Set(bucket, cacheKey, body, ttl)
	c.Data(http.StatusOK, "application/json", body)
}

func handleExchangeRates(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		currencies := c.Query("currencies")
		if currencies == "" {
			currencies = "CNY,IDR"
		}
		u := fmt.Sprintf("%s/rates?base=USD&quotes=%s", client.FrankfurterBase, url.QueryEscape(currencies))
		fetchUpstream(cache, "frankfurter", "exchange:"+currencies, u, 6*time.Hour, c)
	}
}

func handleHistoricalRates(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		currencies := c.Query("currencies")
		from := c.Query("from")
		group := c.Query("group")
		if currencies == "" {
			currencies = "CNY,IDR"
		}
		if from == "" {
			from = "1999-01-01"
		}
		u := fmt.Sprintf("%s/rates?from=%s&base=USD&quotes=%s", client.FrankfurterBase, url.QueryEscape(from), url.QueryEscape(currencies))
		if group != "" && group != "day" {
			apiGroup := group
			if apiGroup == "year" {
				apiGroup = "month"
			}
			u += "&group=" + apiGroup
		}
		cacheKey := fmt.Sprintf("history:%s:%s:%s", currencies, from, group)
		fetchUpstream(cache, "frankfurter", cacheKey, u, 24*time.Hour, c)
	}
}

func handleFredLatest(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		series := c.Query("series")
		if series == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "series query param required"})
			return
		}
		cacheKey := "latest:" + series
		if data, ok := cache.Get("fred", cacheKey); ok {
			c.Data(http.StatusOK, "application/json", data)
			return
		}
		path := fmt.Sprintf("/fred/series/observations?series_id=%s&sort_order=desc&limit=1&file_type=json", url.QueryEscape(series))
		body, err := client.FetchFred(path)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		_ = cache.Set("fred", cacheKey, body, 1*time.Hour)
		c.Data(http.StatusOK, "application/json", body)
	}
}

func handleFredBatchLatest(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.Query("series")
		if raw == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "series query param required"})
			return
		}
		seriesList := strings.Split(raw, ",")
		type result struct {
			series string
			value  json.RawMessage
		}
		ch := make(chan result, len(seriesList))
		var wg sync.WaitGroup
		sem := make(chan struct{}, 3)
		for _, s := range seriesList {
			s = strings.TrimSpace(s)
			if s == "" {
				continue
			}
			cacheKey := "batch:" + s
			if data, ok := cache.Get("fred", cacheKey); ok {
				ch <- result{s, data}
				continue
			}
			wg.Add(1)
			go func(series string) {
				defer wg.Done()
				sem <- struct{}{}
				defer func() { <-sem }()
				path := fmt.Sprintf("/fred/series/observations?series_id=%s&sort_order=desc&limit=1&file_type=json", url.QueryEscape(series))
		body, err := client.FetchFred(path)
				if err != nil {
					body, _ = json.Marshal(gin.H{"error": err.Error()})
				} else {
					_ = cache.Set("fred", "batch:"+series, body, 1*time.Hour)
				}
				ch <- result{series, body}
			}(s)
		}
		go func() {
			wg.Wait()
			close(ch)
		}()
		out := make(map[string]json.RawMessage, len(seriesList))
		for r := range ch {
			out[r.series] = r.value
		}
		c.JSON(http.StatusOK, out)
	}
}

var fredHistoryCache = 24 * time.Hour

func handleFredHistory(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		series := c.Query("series")
		from := c.Query("from")
		freq := c.Query("frequency")
		if series == "" || from == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "series and from query params required"})
			return
		}
		cacheKey := fmt.Sprintf("history:%s:%s:%s", series, from, freq)
		if data, ok := cache.Get("fred", cacheKey); ok {
			c.Data(http.StatusOK, "application/json", data)
			return
		}
		path := fmt.Sprintf("/fred/series/observations?series_id=%s&observation_start=%s&sort_order=asc&file_type=json", url.QueryEscape(series), url.QueryEscape(from))
		if freq != "" {
			path += "&frequency=" + url.QueryEscape(freq)
		}
		body, err := client.FetchFred(path)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		_ = cache.Set("fred", cacheKey, body, fredHistoryCache)
		c.Data(http.StatusOK, "application/json", body)
	}
}

var wbDateRe = regexp.MustCompile(`"date":"(\d{4})"`)

func handleWorldBankDebt(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		country := c.Query("country")
		if country == "" {
			country = "US"
		}
		country = client.WorldBankCountry(country)
		u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/GC.DOD.TOTL.GD.ZS?format=json", url.QueryEscape(country))
		fetchUpstream(cache, "worldbank", "debt:"+country, u, 24*time.Hour, c)
	}
}

func handleWorldBankGdp(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		country := c.Query("country")
		if country == "" {
			country = "US"
		}
		country = client.WorldBankCountry(country)
		// NY.GDP.MKTP.CN = GDP in current local currency units (full units, not scaled)
		u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/NY.GDP.MKTP.CN?format=json", url.QueryEscape(country))
		fetchUpstream(cache, "worldbank", "gdp:"+country, u, 24*time.Hour, c)
	}
}

func handleWorldBankPoverty(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		country := c.Query("country")
		if country == "" {
			country = "US"
		}
		country = client.WorldBankCountry(country)
		// SI.POV.UMIC = Poverty headcount ratio at $8.30/day (2021 PPP) (% of population)
		u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/SI.POV.UMIC?format=json&per_page=10", url.QueryEscape(country))
		fetchUpstream(cache, "worldbank", "poverty:"+country, u, 24*time.Hour, c)
	}
}
