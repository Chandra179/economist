package handler

import (
	"fmt"
	"net/url"
	"time"

	"economist/internal/cache"
	"economist/pkg/client"
	"github.com/gin-gonic/gin"
)

func WorldBankDebt(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		country := ctx.Query("country")
		if country == "" {
			country = "US"
		}
		country = client.WorldBankCountry(country)
		u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/GC.DOD.TOTL.GD.ZS?format=json", url.QueryEscape(country))
		fetchUpstream(c, "worldbank", "debt:"+country, u, 24*time.Hour, ctx)
	}
}

func WorldBankGdp(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		country := ctx.Query("country")
		if country == "" {
			country = "US"
		}
		country = client.WorldBankCountry(country)
		u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/NY.GDP.MKTP.CN?format=json", url.QueryEscape(country))
		fetchUpstream(c, "worldbank", "gdp:"+country, u, 24*time.Hour, ctx)
	}
}

func WorldBankPoverty(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		country := ctx.Query("country")
		if country == "" {
			country = "US"
		}
		country = client.WorldBankCountry(country)
		u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/SI.POV.UMIC?format=json&per_page=10", url.QueryEscape(country))
		fetchUpstream(c, "worldbank", "poverty:"+country, u, 24*time.Hour, ctx)
	}
}

func WorldBankPpp(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		country := ctx.Query("country")
		if country == "" {
			country = "US"
		}
		country = client.WorldBankCountry(country)
		u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/PA.NUS.PPP?format=json", url.QueryEscape(country))
		fetchUpstream(c, "worldbank", "ppp:"+country, u, 24*time.Hour, ctx)
	}
}
