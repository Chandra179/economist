package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type GdpRecord struct {
	Date   string   `json:"date"`
	GdpUsd float64  `json:"gdpUsd"`
	Growth *float64 `json:"growth"`
}

type frankfurterRate struct {
	Date  string  `json:"date"`
	Base  string  `json:"base"`
	Quote string  `json:"quote"`
	Rate  float64 `json:"rate"`
}

type fxRatesByDate map[string]map[string]float64

func fetchFxHistory(cache *Cache, currencies []string, from string) (fxRatesByDate, error) {
	u := fmt.Sprintf("%s/rates?from=%s&base=USD&quotes=%s&group=month",
		frankfurterBase,
		url.QueryEscape(from),
		url.QueryEscape(strings.Join(currencies, ",")),
	)
	cacheKey := fmt.Sprintf("fxhist:%s:%s", strings.Join(currencies, ","), from)

	if data, ok := cache.Get("frankfurter", cacheKey); ok {
		var rates []frankfurterRate
		if err := json.Unmarshal(data, &rates); err == nil {
			return buildFxMap(rates), nil
		}
	}

	resp, err := http.Get(u)
	if err != nil {
		return nil, fmt.Errorf("frankfurter request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("frankfurter %d: %s", resp.StatusCode, string(body))
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read frankfurter: %w", err)
	}

	var rates []frankfurterRate
	if err := json.Unmarshal(body, &rates); err != nil {
		return nil, fmt.Errorf("parse frankfurter: %w", err)
	}
	_ = cache.Set("frankfurter", cacheKey, body, 24*time.Hour)
	return buildFxMap(rates), nil
}

func buildFxMap(rates []frankfurterRate) fxRatesByDate {
	m := make(fxRatesByDate)
	for _, r := range rates {
		if m[r.Date] == nil {
			m[r.Date] = make(map[string]float64)
		}
		m[r.Date][r.Quote] = r.Rate
	}
	return m
}

func parseFredObs(raw []byte) (map[string]float64, error) {
	var resp struct {
		Observations []struct {
			Date  string `json:"date"`
			Value string `json:"value"`
		} `json:"observations"`
	}
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}
	out := make(map[string]float64, len(resp.Observations))
	for _, o := range resp.Observations {
		if o.Value == "" || o.Value == "." {
			continue
		}
		var v float64
		if _, err := fmt.Sscanf(o.Value, "%f", &v); err == nil {
			out[o.Date] = v
		}
	}
	return out, nil
}

func closestRate(fxSorted []string, fxRates map[string]float64, targetDate string) (float64, bool) {
	if len(fxSorted) == 0 {
		return 0, false
	}
	target, err := parseFlexDate(targetDate)
	if err != nil {
		return 0, false
	}
	idx := sort.Search(len(fxSorted), func(i int) bool {
		return fxSorted[i] >= targetDate
	})
	if idx == 0 {
		return fxRates[fxSorted[0]], true
	}
	if idx == len(fxSorted) {
		return fxRates[fxSorted[len(fxSorted)-1]], true
	}
	prev, _ := time.Parse("2006-01-02", fxSorted[idx-1])
	curr, _ := time.Parse("2006-01-02", fxSorted[idx])
	if target.Sub(prev) <= curr.Sub(target) {
		return fxRates[fxSorted[idx-1]], true
	}
	return fxRates[fxSorted[idx]], true
}

func parseFlexDate(s string) (time.Time, error) {
	if len(s) == 4 {
		return time.Parse("2006-01-02", s+"-07-01")
	}
	return time.Parse("2006-01-02", s)
}

func convertGdp(cc CountryConfig, gdpObs map[string]float64, fx fxRatesByDate) []GdpRecord {
	multiplier := cc.GdpMultiplier
	if multiplier == 0 {
		multiplier = 1_000_000
	}
	isUsd := cc.Code == "USD"

	var fxSorted []string
	var fxRates map[string]float64
	if !isUsd && fx != nil {
		fxRates = make(map[string]float64, len(fx)*2)
		for date, currencies := range fx {
			if rate, ok := currencies[cc.Code]; ok {
				fxRates[date] = rate
			}
		}
		fxSorted = make([]string, 0, len(fxRates))
		for d := range fxRates {
			fxSorted = append(fxSorted, d)
		}
		sort.Strings(fxSorted)
	}

	type gdpEntry struct {
		date string
		raw  float64
	}
	var entries []gdpEntry
	for date, raw := range gdpObs {
		entries = append(entries, gdpEntry{date, raw})
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].date < entries[j].date
	})

	type yearAcc struct {
		sum   float64
		count int
	}
	yearMap := make(map[string]*yearAcc)

	for _, e := range entries {
		var fxRate float64
		if isUsd {
			fxRate = 1
		} else {
			var ok bool
			fxRate, ok = closestRate(fxSorted, fxRates, e.date)
			if !ok {
				continue
			}
		}
		year := e.date[:4]
		if year == "" {
			continue
		}
		usd := (e.raw * multiplier) / fxRate
		acc := yearMap[year]
		if acc == nil {
			acc = &yearAcc{}
			yearMap[year] = acc
		}
		acc.sum += usd
		acc.count++
	}

	var years []string
	for y := range yearMap {
		years = append(years, y)
	}
	sort.Strings(years)

	var records []GdpRecord
	for _, y := range years {
		acc := yearMap[y]
		records = append(records, GdpRecord{
			Date:   y + "-01-01",
			GdpUsd: acc.sum / float64(acc.count),
		})
	}

	for i := 1; i < len(records); i++ {
		if records[i-1].GdpUsd != 0 {
			g := (records[i].GdpUsd - records[i-1].GdpUsd) / records[i-1].GdpUsd
			records[i].Growth = &g
		}
	}

	return records
}

func fetchWorldBankGdpData(cache *Cache, code string) (map[string]float64, error) {
	mapped, ok := worldbankCountry[code]
	if !ok {
		mapped = code
	}
	cacheKey := "gdp:" + mapped
	if data, ok := cache.Get("worldbank", cacheKey); ok {
		return parseWorldBankGdpObs(data)
	}
	u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/NY.GDP.MKTP.CN?format=json",
		url.QueryEscape(mapped))
	resp, err := http.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("world bank %d: %s", resp.StatusCode, string(body))
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	_ = cache.Set("worldbank", cacheKey, body, 24*time.Hour)
	return parseWorldBankGdpObs(body)
}

// parseWorldBankGdpObs parses World Bank JSON format:
// [{page:...}, [{date: "2000", value: 12345.0}, ...]]
func parseWorldBankGdpObs(raw []byte) (map[string]float64, error) {
	var data []json.RawMessage
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, err
	}
	if len(data) < 2 {
		return nil, fmt.Errorf("unexpected world bank response format")
	}
	var records []struct {
		Date  string   `json:"date"`
		Value *float64 `json:"value"`
	}
	if err := json.Unmarshal(data[1], &records); err != nil {
		return nil, err
	}
	obs := make(map[string]float64, len(records))
	for _, r := range records {
		if r.Value != nil {
			obs[r.Date] = *r.Value
		}
	}
	return obs, nil
}

func handleCountries(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		if data, ok := cache.Get("computed", "countries"); ok {
			c.Data(http.StatusOK, "application/json", data)
			return
		}
		raw, _ := json.Marshal(countriesConfig)
		_ = cache.Set("computed", "countries", raw, 1*time.Hour)
		c.Data(http.StatusOK, "application/json", raw)
	}
}

func handleGdpUsd(cache *Cache) gin.HandlerFunc {
	return func(c *gin.Context) {
		countries := c.Query("countries")
		from := c.Query("from")
		if countries == "" {
			countries = "CNY,IDR"
		}
		if from == "" {
			from = "1990-01-01"
		}
		from = normalizeFrom(from)
		codes := strings.Split(countries, ",")
		cacheKey := fmt.Sprintf("gdp-usd:%s:%s", countries, from)

		if data, ok := cache.Get("computed", cacheKey); ok {
			c.Data(http.StatusOK, "application/json", data)
			return
		}

		configByCode := make(map[string]CountryConfig, len(countriesConfig))
		for _, cc := range countriesConfig {
			configByCode[cc.Code] = cc
		}

		var targets []CountryConfig
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

		var fxData fxRatesByDate
		if len(fxCurrencies) > 0 {
			var err error
			fxData, err = fetchFxHistory(cache, fxCurrencies, from)
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
			go func(cc CountryConfig) {
				defer wg.Done()
				sem <- struct{}{}
				defer func() { <-sem }()

				var obs map[string]float64
				var err error
				if cc.GdpSource == "worldbank" {
					// World Bank NY.GDP.MKTP.CN goes back to 1990; FRED series may start later
					obs, err = fetchWorldBankGdpData(cache, cc.Code)
				} else {
					path := fmt.Sprintf("/fred/series/observations?series_id=%s&observation_start=%s&sort_order=asc&file_type=json&frequency=a",
						url.QueryEscape(*cc.FredGdpSeries), url.QueryEscape(from))
					var body []byte
					body, err = fetchFred(path)
					if err == nil {
						obs, err = parseFredObs(body)
					}
			}
			ch <- gdpResult{code: cc.Code, obs: obs, err: err}
			}(cc)
		}

		go func() {
			wg.Wait()
			close(ch)
		}()

		out := make(map[string][]GdpRecord, len(targets))
		var hasError bool
		for r := range ch {
			if r.err != nil {
				fmt.Printf("gdp fetch error for %s: %v\n", r.code, r.err)
				out[r.code] = nil
				hasError = true
				continue
			}
			cc := configByCode[r.code]
			out[r.code] = convertGdp(cc, r.obs, fxData)
		}

		raw, _ := json.Marshal(out)
		if !hasError {
			_ = cache.Set("computed", cacheKey, raw, 24*time.Hour)
		}
		c.Data(http.StatusOK, "application/json", raw)
	}
}

func normalizeFrom(from string) string {
	if len(from) == 4 && from[0] >= '1' && from[0] <= '9' {
		return from + "-01-01"
	}
	return from
}
