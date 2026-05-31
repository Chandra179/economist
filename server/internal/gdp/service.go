package gdp

import (
	"sort"
	"time"

	"economist/pkg/client"
)

type Record struct {
	Date   string   `json:"date"`
	GdpUsd float64  `json:"gdpUsd"`
	Growth *float64 `json:"growth"`
}

type Input struct {
	Code       string
	Multiplier float64
}

func Convert(in Input, gdpObs map[string]float64, fx client.FxRatesByDate) []Record {
	isUsd := in.Code == "USD"

	var fxSorted []string
	var fxRates map[string]float64
	if !isUsd && fx != nil {
		fxRates = make(map[string]float64, len(fx)*2)
		for date, currencies := range fx {
			if rate, ok := currencies[in.Code]; ok {
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
		usd := (e.raw * in.Multiplier) / fxRate
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

	var records []Record
	for _, y := range years {
		acc := yearMap[y]
		records = append(records, Record{
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
