package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
)

func FetchFredObservations(seriesID string, from string, frequency string) ([]byte, error) {
	path := fmt.Sprintf("/fred/series/observations?series_id=%s&observation_start=%s&sort_order=asc&file_type=json",
		url.QueryEscape(seriesID), url.QueryEscape(from))
	if frequency != "" {
		path += "&frequency=" + url.QueryEscape(frequency)
	}
	return FetchFred(path)
}

func FetchFred(path string) ([]byte, error) {
	fredKey := os.Getenv("FRED_API_KEY")
	if fredKey == "" {
		return nil, fmt.Errorf("FRED_API_KEY not set")
	}
	prefix := "https://api.stlouisfed.org"
	fullURL := prefix + path + "&api_key=" + fredKey
	resp, err := http.Get(fullURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("FRED %d: %s", resp.StatusCode, string(body))
	}
	return io.ReadAll(resp.Body)
}

func ParseFredObs(raw []byte) (map[string]float64, error) {
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
