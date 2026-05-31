package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type FrankfurterRate struct {
	Date  string  `json:"date"`
	Base  string  `json:"base"`
	Quote string  `json:"quote"`
	Rate  float64 `json:"rate"`
}

type FxRatesByDate map[string]map[string]float64

func BuildFxMap(rates []FrankfurterRate) FxRatesByDate {
	m := make(FxRatesByDate)
	for _, r := range rates {
		if m[r.Date] == nil {
			m[r.Date] = make(map[string]float64)
		}
		m[r.Date][r.Quote] = r.Rate
	}
	return m
}

const FrankfurterBase = "https://api.frankfurter.dev/v2"

func FetchFxHistory(from string, currencies []string, group string) ([]byte, error) {
	u := fmt.Sprintf("%s/rates?from=%s&base=USD&quotes=%s&group=%s",
		FrankfurterBase,
		url.QueryEscape(from),
		url.QueryEscape(strings.Join(currencies, ",")),
		group,
	)
	return FetchFrankfurterRates(u)
}

func FetchFrankfurterRates(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("frankfurter request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("frankfurter %d: %s", resp.StatusCode, string(body))
	}
	return io.ReadAll(resp.Body)
}

func ParseFrankfurterRates(body []byte) ([]FrankfurterRate, error) {
	var rates []FrankfurterRate
	if err := json.Unmarshal(body, &rates); err != nil {
		return nil, fmt.Errorf("parse frankfurter: %w", err)
	}
	return rates, nil
}
