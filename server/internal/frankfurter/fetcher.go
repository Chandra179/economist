package frankfurter

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

func (f *Fetcher) LatestRates(currencies string) ([]byte, error) {
	cacheKey := "exchange:" + currencies
	if data, ok := f.cache.Get("frankfurter", cacheKey); ok {
		return data, nil
	}
	u := fmt.Sprintf("%s/rates?base=USD&quotes=%s", client.FrankfurterBase, url.QueryEscape(currencies))
	body, err := client.FetchFrankfurterRates(u)
	if err != nil {
		return nil, err
	}
	_ = f.cache.Set("frankfurter", cacheKey, body, 6*time.Hour)
	return body, nil
}

func (f *Fetcher) HistoricalRates(currencies, from, group string) ([]byte, error) {
	cacheKey := fmt.Sprintf("history:%s:%s:%s", currencies, from, group)
	if data, ok := f.cache.Get("frankfurter", cacheKey); ok {
		return data, nil
	}
	u := fmt.Sprintf("%s/rates?from=%s&base=USD&quotes=%s", client.FrankfurterBase, url.QueryEscape(from), url.QueryEscape(currencies))
	if group != "" && group != "day" {
		apiGroup := group
		if apiGroup == "year" {
			apiGroup = "month"
		}
		u += "&group=" + apiGroup
	}
	body, err := client.FetchFrankfurterRates(u)
	if err != nil {
		return nil, err
	}
	_ = f.cache.Set("frankfurter", cacheKey, body, 24*time.Hour)
	return body, nil
}
