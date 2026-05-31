package handler

import (
	"fmt"
	"net/url"
	"time"

	"economist/internal/cache"
	"economist/pkg/client"
	"github.com/gin-gonic/gin"
)

func ExchangeRates(c *cache.Cache) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		currencies := ctx.Query("currencies")
		if currencies == "" {
			currencies = "CNY,IDR"
		}
		u := fmt.Sprintf("%s/rates?base=USD&quotes=%s", client.FrankfurterBase, url.QueryEscape(currencies))
		fetchUpstream(c, "frankfurter", "exchange:"+currencies, u, 6*time.Hour, ctx)
	}
}

func HistoricalRates(c *cache.Cache) gin.HandlerFunc {
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
		u := fmt.Sprintf("%s/rates?from=%s&base=USD&quotes=%s", client.FrankfurterBase, url.QueryEscape(from), url.QueryEscape(currencies))
		if group != "" && group != "day" {
			apiGroup := group
			if apiGroup == "year" {
				apiGroup = "month"
			}
			u += "&group=" + apiGroup
		}
		cacheKey := fmt.Sprintf("history:%s:%s:%s", currencies, from, group)
		fetchUpstream(c, "frankfurter", cacheKey, u, 24*time.Hour, ctx)
	}
}
