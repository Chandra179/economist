package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

var worldbankCountry = map[string]string{
	"USD": "US",
	"IDR": "ID",
	"CNY": "CN",
}

func WorldBankCountry(code string) string {
	if mapped, ok := worldbankCountry[code]; ok {
		return mapped
	}
	return code
}

func FetchWorldBankGdpLcu(code string) ([]byte, error) {
	u := fmt.Sprintf("https://api.worldbank.org/v2/country/%s/indicator/NY.GDP.MKTP.CN?format=json",
		url.QueryEscape(code))
	return FetchWorldBank(u)
}

func FetchWorldBank(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("world bank %d: %s", resp.StatusCode, string(body))
	}
	return io.ReadAll(resp.Body)
}

func ParseWorldBankObs(raw []byte) (map[string]float64, error) {
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
