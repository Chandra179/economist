package worldbank

import (
	"fmt"
	"net/url"
	"time"

	"economist/internal/cache"
	"economist/pkg/client"
)

type Fetcher struct {
	cache *cache.Cache
}

func NewFetcher(c *cache.Cache) *Fetcher {
	return &Fetcher{cache: c}
}

func (f *Fetcher) Debt(country string) ([]byte, error) {
	country = client.WorldBankCountry(country)
	cacheKey := "debt:" + country
	if data, ok := f.cache.Get("worldbank", cacheKey); ok {
		return data, nil
	}
	u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/GC.DOD.TOTL.GD.ZS?format=json", url.QueryEscape(country))
	body, err := client.FetchWorldBank(u)
	if err != nil {
		return nil, err
	}
	_ = f.cache.Set("worldbank", cacheKey, body, 24*time.Hour)
	return body, nil
}

func (f *Fetcher) Gdp(country string) ([]byte, error) {
	country = client.WorldBankCountry(country)
	cacheKey := "gdp:" + country
	if data, ok := f.cache.Get("worldbank", cacheKey); ok {
		return data, nil
	}
	u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/NY.GDP.MKTP.CN?format=json", url.QueryEscape(country))
	body, err := client.FetchWorldBank(u)
	if err != nil {
		return nil, err
	}
	_ = f.cache.Set("worldbank", cacheKey, body, 24*time.Hour)
	return body, nil
}
