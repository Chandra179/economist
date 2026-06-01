package server

import (
	"economist/internal/cache"
	"economist/internal/handler"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func New(c *cache.Cache) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:4173"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Accept", "Content-Type"},
		AllowCredentials: false,
	}))

	api := r.Group("/api")
	{
		api.GET("/exchange-rates", handler.ExchangeRates(c))
		api.GET("/historical-rates", handler.HistoricalRates(c))
		api.GET("/countries", handler.Countries(c))

		fred := api.Group("/fred")
		{
			fred.GET("/latest", handler.FredLatest(c))
			fred.GET("/batch-latest", handler.FredBatchLatest(c))
			fred.GET("/history", handler.FredHistory(c))
		}

		gdp := api.Group("/gdp")
		{
			gdp.GET("/usd", handler.GdpUsd(c))
		}

		api.GET("/worldbank/debt", handler.WorldBankDebt(c))
		api.GET("/worldbank/gdp", handler.WorldBankGdp(c))
		api.GET("/worldbank/poverty", handler.WorldBankPoverty(c))
		api.GET("/worldbank/ppp", handler.WorldBankPpp(c))
	}

	return r
}
