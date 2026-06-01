package handler

import (
	"net/http"
	"strings"

	"economist/internal/cache"
	"economist/internal/fred"
	"github.com/gin-gonic/gin"
)

func FredLatest(c *cache.Cache) gin.HandlerFunc {
	f := fred.NewFetcher(c)
	return func(ctx *gin.Context) {
		series := ctx.Query("series")
		if series == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "series query param required"})
			return
		}
		body, err := f.Latest(series)
		if err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
		ctx.Data(200, "application/json", body)
	}
}

func FredBatchLatest(c *cache.Cache) gin.HandlerFunc {
	f := fred.NewFetcher(c)
	return func(ctx *gin.Context) {
		raw := ctx.Query("series")
		if raw == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "series query param required"})
			return
		}
		out := f.BatchLatest(splitAndTrim(raw))
		ctx.JSON(http.StatusOK, out)
	}
}

func FredHistory(c *cache.Cache) gin.HandlerFunc {
	f := fred.NewFetcher(c)
	return func(ctx *gin.Context) {
		series := ctx.Query("series")
		from := ctx.Query("from")
		freq := ctx.Query("frequency")
		if series == "" || from == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "series and from query params required"})
			return
		}
		body, err := f.History(series, from, freq)
		if err != nil {
			ctx.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}
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
