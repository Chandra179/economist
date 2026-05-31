package config

import "time"

type GdpConfig struct {
	DefaultCountries  string
	DefaultFrom       string
	FxApiGroup        string
	DefaultMultiplier float64
	FxCacheTTL        time.Duration
	WorldBankCacheTTL time.Duration
	ComputedCacheTTL  time.Duration
}

var Gdp = GdpConfig{
	DefaultCountries:  "CNY,IDR",
	DefaultFrom:       "1990-01-01",
	FxApiGroup:        "month",
	DefaultMultiplier: 1_000_000,
	FxCacheTTL:        24 * time.Hour,
	WorldBankCacheTTL: 24 * time.Hour,
	ComputedCacheTTL:  24 * time.Hour,
}

type Country struct {
	Code                string   `json:"code"`
	Name                string   `json:"name"`
	Currency            string   `json:"currency"`
	Flag                string   `json:"flag"`
	FredRateSeries      *string  `json:"fredRateSeries"`
	FredReservesSeries  *string  `json:"fredReservesSeries"`
	FredGdpSeries       *string  `json:"fredGdpSeries"`
	FredDebtSeries      *string  `json:"fredDebtSeries"`
	DebtSource          string   `json:"debtSource,omitempty"`
	GdpSource           string   `json:"gdpSource,omitempty"`
	GdpMultiplier       float64  `json:"gdpMultiplier,omitempty"`
	LocalCurrencySymbol string   `json:"localCurrencySymbol,omitempty"`
}

func strPtr(s string) *string { return &s }

var Countries = []Country{
	{
		Code:           "USD",
		Name:           "United States",
		Currency:       "US Dollar",
		Flag:           "\U0001F1FA\U0001F1F8",
		FredRateSeries: strPtr("DFF"),
		FredGdpSeries:  strPtr("GDP"),
		FredDebtSeries: strPtr("GC.DOD.TOTL.GD.ZS"),
		DebtSource:     "worldbank",
		GdpMultiplier:  1_000_000_000,
	},
	{
		Code:               "CNY",
		Name:               "China",
		Currency:           "Yuan",
		Flag:               "\U0001F1E8\U0001F1F3",
		FredReservesSeries: strPtr("TRESEGCNM052N"),
		FredGdpSeries:      strPtr("NGDPXDCCNA"),
		FredDebtSeries:     strPtr("GGGDTACNA188N"),
		GdpSource:          "worldbank",
		GdpMultiplier:      1,
		LocalCurrencySymbol: "\u00A5",
	},
	{
		Code:               "IDR",
		Name:               "Indonesia",
		Currency:           "Rupiah",
		Flag:               "\U0001F1EE\U0001F1E9",
		FredReservesSeries: strPtr("TRESEGIDM052N"),
		FredGdpSeries:      strPtr("NGDPXDCIDA"),
		FredDebtSeries:     strPtr("GGGDTAIDA188N"),
		GdpSource:          "worldbank",
		GdpMultiplier:      1,
		LocalCurrencySymbol: "Rp",
	},
}
