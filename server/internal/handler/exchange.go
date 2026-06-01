package handler

import (
	"economist/internal/cache"
	"economist/internal/frankfurter"
	"github.com/gin-gonic/gin"
)

func ExchangeRates(c *cache.Cache) gin.HandlerFunc {
	f := frankfurter.NewFetcher(c)
	return func(ctx *gin.Context) {
		currencies := ctx.Query("currencies")
		if currencies == "" {
			currencies = "CNY,IDR"
		}
		body, err := f.LatestRates(currencies)
		if err != nil {
			ctx.JSON(502, gin.H{"error": err.Error()})
			return
		}
		ctx.Data(200, "application/json", body)
	}
}

func HistoricalRates(c *cache.Cache) gin.HandlerFunc {
	f := frankfurter.NewFetcher(c)
	return func(ctx *gin.Context) {
		currencies := ctx.Query("currencies")
		from := ctx.Query("from")
		group := ctx.Query("group")
		if currencies == "" {
			currencies = "CNY,IDR"
		}
		if from == "" {
			from = "1999-01-01"
		}
		body, err := f.HistoricalRates(currencies, from, group)
		if err != nil {
			ctx.JSON(502, gin.H{"error": err.Error()})
			return
		}
		ctx.Data(200, "application/json", body)
	}
}
