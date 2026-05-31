package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"economist/internal/cache"
	"economist/internal/config"
	"economist/internal/gdp"
	"economist/pkg/client"
	"github.com/gin-gonic/gin"
)

func fetchFxHistory(c *cache.Cache, currencies []string, from string) (client.FxRatesByDate, error) {
	cacheKey := fmt.Sprintf("fxhist:%s:%s", strings.Join(currencies, ","), from)

	if data, ok := c.Get("frankfurter", cacheKey); ok {
		var rates []client.FrankfurterRate
		if err := json.Unmarshal(data, &rates); err == nil {
			return client.BuildFxMap(rates), nil
		}
	}

	body, err := client.FetchFxHistory(from, currencies, config.Gdp.FxApiGroup)
	if err != nil {
		return nil, err
	}

	rates, err := client.ParseFrankfurterRates(body)
	if err != nil {
		return nil, err
	}
	_ = c.Set("frankfurter", cacheKey, body, config.Gdp.FxCacheTTL)
	return client.BuildFxMap(rates), nil
}

func fetchWorldBankGdpData(c *cache.Cache, code string) (map[string]float64, error) {
	mapped := client.WorldBankCountry(code)
	cacheKey := "gdp:" + mapped
	if data, ok := c.Get("worldbank", cacheKey); ok {
		return client.ParseWorldBankObs(data)
	}
	body, err := client.FetchWorldBankGdpLcu(mapped)
	if err != nil {
		return nil, err
	}
	_ = c.Set("worldbank", cacheKey, body, config.Gdp.WorldBankCacheTTL)
	return client.ParseWorldBankObs(body)
}

func Countries(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if data, ok := c.Get("computed", "countries"); ok {
			ctx.Data(http.StatusOK, "application/json", data)
			return
		}
		raw, _ := json.Marshal(config.Countries)
		_ = c.Set("computed", "countries", raw, 1*time.Hour)
		ctx.Data(http.StatusOK, "application/json", raw)
	}
}

func GdpUsd(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		countries := ctx.Query("countries")
		from := ctx.Query("from")
		if countries == "" {
			countries = config.Gdp.DefaultCountries
		}
		if from == "" {
			from = config.Gdp.DefaultFrom
		}
		from = normalizeFrom(from)
		codes := strings.Split(countries, ",")
		cacheKey := fmt.Sprintf("gdp-usd:%s:%s", countries, from)

		if data, ok := c.Get("computed", cacheKey); ok {
			ctx.Data(http.StatusOK, "application/json", data)
			return
		}

		configByCode := make(map[string]config.Country, len(config.Countries))
		for _, cc := range config.Countries {
			configByCode[cc.Code] = cc
		}

		var targets []config.Country
		for _, code := range codes {
			code = strings.TrimSpace(code)
			if cc, ok := configByCode[code]; ok && cc.FredGdpSeries != nil {
				targets = append(targets, cc)
			}
		}

		var fxCurrencies []string
		for _, cc := range targets {
			if cc.Code != "USD" {
				fxCurrencies = append(fxCurrencies, cc.Code)
			}
		}

		var fxData client.FxRatesByDate
		if len(fxCurrencies) > 0 {
			var err error
			fxData, err = fetchFxHistory(c, fxCurrencies, from)
			if err != nil {
				fmt.Printf("fx fetch error: %v\n", err)
			}
		}

		type gdpResult struct {
			code string
			obs  map[string]float64
			err  error
		}

		sem := make(chan struct{}, 2)
		ch := make(chan gdpResult, len(targets))
		var wg sync.WaitGroup

		for _, cc := range targets {
			wg.Add(1)
			go func(cc config.Country) {
				defer wg.Done()
				sem <- struct{}{}
				defer func() { <-sem }()

				var obs map[string]float64
				var err error
				if cc.GdpSource == "worldbank" {
					obs, err = fetchWorldBankGdpData(c, cc.Code)
				} else {
					var body []byte
					body, err = client.FetchFredObservations(*cc.FredGdpSeries, from, "a")
					if err == nil {
						obs, err = client.ParseFredObs(body)
					}
				}
				ch <- gdpResult{code: cc.Code, obs: obs, err: err}
			}(cc)
		}

		go func() {
			wg.Wait()
			close(ch)
		}()

		out := make(map[string][]gdp.Record, len(targets))
		var hasError bool
		for r := range ch {
			if r.err != nil {
				fmt.Printf("gdp fetch error for %s: %v\n", r.code, r.err)
				out[r.code] = nil
				hasError = true
				continue
			}
			cc := configByCode[r.code]
			multiplier := cc.GdpMultiplier
			if multiplier == 0 {
				multiplier = config.Gdp.DefaultMultiplier
			}
			out[r.code] = gdp.Convert(gdp.Input{Code: cc.Code, Multiplier: multiplier}, r.obs, fxData)
		}

		raw, _ := json.Marshal(out)
		if !hasError {
			_ = c.Set("computed", cacheKey, raw, config.Gdp.ComputedCacheTTL)
		}
		ctx.Data(http.StatusOK, "application/json", raw)
	}
}

func normalizeFrom(from string) string {
	if len(from) == 4 && from[0] >= '1' && from[0] <= '9' {
		return from + "-01-01"
	}
	return from
}
