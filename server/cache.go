package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"go.etcd.io/bbolt"
)

type cacheEntry struct {
	Value     json.RawMessage `json:"v"`
	ExpiresAt int64           `json:"e"`
}

type Cache struct {
	db *bbolt.DB
}

func NewCache(path string) (*Cache, error) {
	if dir := filepath.Dir(path); dir != "" {
		_ = os.MkdirAll(dir, 0755)
	}
	db, err := bbolt.Open(path, 0600, &bbolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("open cache db: %w", err)
	}
	err = db.Update(func(tx *bbolt.Tx) error {
		for _, name := range []string{"frankfurter", "fred", "worldbank", "computed"} {
			if _, err := tx.CreateBucketIfNotExists([]byte(name)); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("init buckets: %w", err)
	}
	return &Cache{db: db}, nil
}

func (c *Cache) Close() error { return c.db.Close() }

func (c *Cache) Get(bucket, key string) ([]byte, bool) {
	var raw []byte
	_ = c.db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		if b == nil {
			return nil
		}
		raw = b.Get([]byte(key))
		return nil
	})
	if raw == nil {
		return nil, false
	}
	var entry cacheEntry
	if json.Unmarshal(raw, &entry) != nil {
		return nil, false
	}
	if time.Now().UnixMilli() > entry.ExpiresAt {
		return nil, false
	}
	return entry.Value, true
}

func (c *Cache) Set(bucket, key string, value []byte, ttl time.Duration) error {
	entry := cacheEntry{
		Value:     value,
		ExpiresAt: time.Now().Add(ttl).UnixMilli(),
	}
	raw, err := json.Marshal(entry)
	if err != nil {
		return err
	}
	return c.db.Update(func(tx *bbolt.Tx) error {
		return tx.Bucket([]byte(bucket)).Put([]byte(key), raw)
	})
}
