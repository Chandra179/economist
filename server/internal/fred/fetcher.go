package fred

import (
	"encoding/json"
	"fmt"
	"net/url"
	"sync"
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

func (f *Fetcher) Latest(series string) ([]byte, error) {
	cacheKey := "latest:" + series
	if data, ok := f.cache.Get("fred", cacheKey); ok {
		return data, nil
	}
	path := fmt.Sprintf("/fred/series/observations?series_id=%s&sort_order=desc&limit=1&file_type=json", url.QueryEscape(series))
	body, err := client.FetchFred(path)
	if err != nil {
		return nil, err
	}
	_ = f.cache.Set("fred", cacheKey, body, 1*time.Hour)
	return body, nil
}

func (f *Fetcher) BatchLatest(series []string) map[string]json.RawMessage {
	type result struct {
		series string
		value  json.RawMessage
	}
	ch := make(chan result, len(series))
	var wg sync.WaitGroup
	sem := make(chan struct{}, 3)

	for _, s := range series {
		if s == "" {
			continue
		}
		cacheKey := "batch:" + s
		if data, ok := f.cache.Get("fred", cacheKey); ok {
			ch <- result{s, data}
			continue
		}
		wg.Add(1)
		go func(series string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			path := fmt.Sprintf("/fred/series/observations?series_id=%s&sort_order=desc&limit=1&file_type=json", url.QueryEscape(series))
			body, err := client.FetchFred(path)
			if err != nil {
				body, _ = json.Marshal(map[string]string{"error": err.Error()})
			} else {
				_ = f.cache.Set("fred", "batch:"+series, body, 1*time.Hour)
			}
			ch <- result{series, body}
		}(s)
	}

	go func() {
		wg.Wait()
		close(ch)
	}()

	out := make(map[string]json.RawMessage, len(series))
	for r := range ch {
		out[r.series] = r.value
	}
	return out
}

func (f *Fetcher) History(series, from, freq string) ([]byte, error) {
	cacheKey := fmt.Sprintf("history:%s:%s:%s", series, from, freq)
	if data, ok := f.cache.Get("fred", cacheKey); ok {
		return data, nil
	}
	path := fmt.Sprintf("/fred/series/observations?series_id=%s&observation_start=%s&sort_order=asc&file_type=json",
		url.QueryEscape(series), url.QueryEscape(from))
	if freq != "" {
		path += "&frequency=" + url.QueryEscape(freq)
	}
	body, err := client.FetchFred(path)
	if err != nil {
		return nil, err
	}
	_ = f.cache.Set("fred", cacheKey, body, 24*time.Hour)
	return body, nil
}
