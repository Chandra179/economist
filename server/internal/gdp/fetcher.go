package gdp

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"economist/internal/cache"
	"economist/internal/config"
	"economist/pkg/client"
)

type Service struct {
	cache *cache.Cache
}

func NewService(c *cache.Cache) *Service {
	return &Service{cache: c}
}

func (s *Service) GetGdpUsd(codes []string, from string) map[string][]Record {
	configByCode := make(map[string]config.Country, len(config.Countries))
	for _, cc := range config.Countries {
		configByCode[cc.Code] = cc
	}

	var targets []config.Country
	for _, code := range codes {
		code = strings.TrimSpace(code)
		if cc, ok := configByCode[code]; ok && cc.FredGdpSeries != nil {
			targets = append(targets, cc)
		}
	}

	var fxCurrencies []string
	for _, cc := range targets {
		if cc.Code != "USD" {
			fxCurrencies = append(fxCurrencies, cc.Code)
		}
	}

	var fxData client.FxRatesByDate
	if len(fxCurrencies) > 0 {
		var err error
		fxData, err = s.fetchFxHistory(fxCurrencies, from)
		if err != nil {
			fmt.Printf("fx fetch error: %v\n", err)
		}
	}

	type gdpResult struct {
		code string
		obs  map[string]float64
		err  error
	}

	sem := make(chan struct{}, 2)
	ch := make(chan gdpResult, len(targets))
	var wg sync.WaitGroup

	for _, cc := range targets {
		wg.Add(1)
		go func(cc config.Country) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			var obs map[string]float64
			var err error
			if cc.GdpSource == "worldbank" {
				obs, err = s.fetchWorldBankGdpData(cc.Code)
			} else {
				var body []byte
				body, err = client.FetchFredObservations(*cc.FredGdpSeries, from, "a")
				if err == nil {
					obs, err = client.ParseFredObs(body)
				}
			}
			ch <- gdpResult{code: cc.Code, obs: obs, err: err}
		}(cc)
	}

	go func() {
		wg.Wait()
		close(ch)
	}()

	out := make(map[string][]Record, len(targets))
	for r := range ch {
		if r.err != nil {
			fmt.Printf("gdp fetch error for %s: %v\n", r.code, r.err)
			out[r.code] = nil
			continue
		}
		cc := configByCode[r.code]
		multiplier := cc.GdpMultiplier
		if multiplier == 0 {
			multiplier = config.Gdp.DefaultMultiplier
		}
		out[r.code] = Convert(Input{Code: cc.Code, Multiplier: multiplier}, r.obs, fxData)
	}

	return out
}

func (s *Service) fetchFxHistory(currencies []string, from string) (client.FxRatesByDate, error) {
	cacheKey := fmt.Sprintf("fxhist:%s:%s", strings.Join(currencies, ","), from)

	if data, ok := s.cache.Get("frankfurter", cacheKey); ok {
		var rates []client.FrankfurterRate
		if err := json.Unmarshal(data, &rates); err == nil {
			return client.BuildFxMap(rates), nil
		}
	}

	body, err := client.FetchFxHistory(from, currencies, config.Gdp.FxApiGroup)
	if err != nil {
		return nil, err
	}

	rates, err := client.ParseFrankfurterRates(body)
	if err != nil {
		return nil, err
	}
	_ = s.cache.Set("frankfurter", cacheKey, body, config.Gdp.FxCacheTTL)
	return client.BuildFxMap(rates), nil
}

func (s *Service) fetchWorldBankGdpData(code string) (map[string]float64, error) {
	mapped := client.WorldBankCountry(code)
	cacheKey := "gdp:" + mapped
	if data, ok := s.cache.Get("worldbank", cacheKey); ok {
		return client.ParseWorldBankObs(data)
	}
	body, err := client.FetchWorldBankGdpLcu(mapped)
	if err != nil {
		return nil, err
	}
	_ = s.cache.Set("worldbank", cacheKey, body, config.Gdp.WorldBankCacheTTL)
	return client.ParseWorldBankObs(body)
}
