package main

import (
	"log"
	"os"

	"economist/internal/cache"
	"economist/internal/server"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cachePath := os.Getenv("CACHE_PATH")
	if cachePath == "" {
		cachePath = "data/cache.db"
	}

	c, err := cache.New(cachePath)
	if err != nil {
		log.Fatalf("cache init: %v", err)
	}
	defer c.Close()

	r := server.New(c)

	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = ":8080"
	}
	log.Printf("listening on %s", addr)
	log.Fatal(r.Run(addr))
}
