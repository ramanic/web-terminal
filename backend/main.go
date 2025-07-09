package main

import (
	"embed"
	"web-terminal/backend/pkg/config"
	"web-terminal/backend/server"
)

//go:embed web/*
var content embed.FS
func main() {
	cfg := config.LoadConfig()


	srv := server.NewServer(cfg,content)
	srv.Start()
}
