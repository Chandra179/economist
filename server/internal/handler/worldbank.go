package handler

import (
	"economist/internal/cache"
	"economist/internal/worldbank"
	"github.com/gin-gonic/gin"
)

func WorldBankDebt(c *cache.Cache) gin.HandlerFunc {
	f := worldbank.NewFetcher(c)
	return func(ctx *gin.Context) {
		country := ctx.Query("country")
		if country == "" {
			country = "US"
		}
		body, err := f.Debt(country)
		if err != nil {
			ctx.JSON(502, gin.H{"error": err.Error()})
			return
		}
		ctx.Data(200, "application/json", body)
	}
}

func WorldBankGdp(c *cache.Cache) gin.HandlerFunc {
	f := worldbank.NewFetcher(c)
	return func(ctx *gin.Context) {
		country := ctx.Query("country")
		if country == "" {
			country = "US"
		}
		body, err := f.Gdp(country)
		if err != nil {
			ctx.JSON(502, gin.H{"error": err.Error()})
			return
		}
		ctx.Data(200, "application/json", body)
	}
}
