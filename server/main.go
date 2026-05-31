package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	cachePath := os.Getenv("CACHE_PATH")
	if cachePath == "" {
		cachePath = "data/cache.db"
	}
	cache, err := NewCache(cachePath)
	if err != nil {
		log.Fatalf("cache init: %v", err)
	}
	defer cache.Close()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:4173"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Accept", "Content-Type"},
		AllowCredentials: false,
	}))

	api := r.Group("/api")
	{
		api.GET("/exchange-rates", handleExchangeRates(cache))
		api.GET("/historical-rates", handleHistoricalRates(cache))
		api.GET("/countries", handleCountries(cache))

		fred := api.Group("/fred")
		{
			fred.GET("/latest", handleFredLatest(cache))
			fred.GET("/batch-latest", handleFredBatchLatest(cache))
			fred.GET("/history", handleFredHistory(cache))
		}

		gdp := api.Group("/gdp")
		{
			gdp.GET("/usd", handleGdpUsd(cache))
		}

		api.GET("/worldbank/debt", handleWorldBankDebt(cache))
		api.GET("/worldbank/gdp", handleWorldBankGdp(cache))
	}

	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = ":8080"
	}
	log.Printf("listening on %s", addr)
	log.Fatal(r.Run(addr))
}
