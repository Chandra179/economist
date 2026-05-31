package handler

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"economist/internal/cache"
	"github.com/gin-gonic/gin"
)

func fetchUpstream(c *cache.Cache, bucket, cacheKey, upstreamURL string, ttl time.Duration, ctx *gin.Context) {
	if data, ok := c.Get(bucket, cacheKey); ok {
		ctx.Data(http.StatusOK, "application/json", data)
		return
	}
	resp, err := http.Get(upstreamURL)
	if err != nil {
		ctx.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("upstream request failed: %v", err)})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		ctx.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("upstream %d: %s", resp.StatusCode, string(body))})
		return
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "read upstream response"})
		return
	}
	_ = c.Set(bucket, cacheKey, body, ttl)
	ctx.Data(http.StatusOK, "application/json", body)
}
