package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"economist/internal/cache"
	"economist/internal/config"
	"economist/internal/gdp"
	"github.com/gin-gonic/gin"
)

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
	svc := gdp.NewService(c)
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

		result := svc.GetGdpUsd(codes, from)

		raw, _ := json.Marshal(result)
		_ = c.Set("computed", cacheKey, raw, config.Gdp.ComputedCacheTTL)
		ctx.Data(http.StatusOK, "application/json", raw)
	}
}

func normalizeFrom(from string) string {
	if len(from) == 4 && from[0] >= '1' && from[0] <= '9' {
		return from + "-01-01"
	}
	return from
}
