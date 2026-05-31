package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"economist/internal/cache"
	"economist/pkg/client"
	"github.com/gin-gonic/gin"
)

func FredLatest(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		series := ctx.Query("series")
		if series == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "series query param required"})
			return
		}
		cacheKey := "latest:" + series
		if data, ok := c.Get("fred", cacheKey); ok {
			ctx.Data(http.StatusOK, "application/json", data)
			return
		}
		path := fmt.Sprintf("/fred/series/observations?series_id=%s&sort_order=desc&limit=1&file_type=json", url.QueryEscape(series))
		body, err := client.FetchFred(path)
		if err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		_ = c.Set("fred", cacheKey, body, 1*time.Hour)
		ctx.Data(200, "application/json", body)
	}
}

func FredBatchLatest(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		raw := ctx.Query("series")
		if raw == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "series query param required"})
			return
		}
		seriesList := splitAndTrim(raw)

		type result struct {
			series string
			value  json.RawMessage
		}
		ch := make(chan result, len(seriesList))
		var wg sync.WaitGroup
		sem := make(chan struct{}, 3)

		for _, s := range seriesList {
			if s == "" {
				continue
			}
			cacheKey := "batch:" + s
			if data, ok := c.Get("fred", cacheKey); ok {
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
					_ = c.Set("fred", "batch:"+series, body, 1*time.Hour)
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
		ctx.JSON(http.StatusOK, out)
	}
}

var fredHistoryCache = 24 * time.Hour

func FredHistory(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		series := ctx.Query("series")
		from := ctx.Query("from")
		freq := ctx.Query("frequency")
		if series == "" || from == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "series and from query params required"})
			return
		}
		cacheKey := fmt.Sprintf("history:%s:%s:%s", series, from, freq)
		if data, ok := c.Get("fred", cacheKey); ok {
			ctx.Data(http.StatusOK, "application/json", data)
			return
		}
		path := fmt.Sprintf("/fred/series/observations?series_id=%s&observation_start=%s&sort_order=asc&file_type=json", url.QueryEscape(series), url.QueryEscape(from))
		if freq != "" {
			path += "&frequency=" + url.QueryEscape(freq)
		}
		body, err := client.FetchFred(path)
		if err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		_ = c.Set("fred", cacheKey, body, fredHistoryCache)
		ctx.Data(200, "application/json", body)
	}
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}
