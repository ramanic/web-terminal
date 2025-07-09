package main

import (
	"web-terminal/backend/pkg/config"
	"web-terminal/backend/server"
)

func main() {
	cfg := config.LoadConfig()

	srv := server.NewServer(cfg)
	srv.Start()
}
