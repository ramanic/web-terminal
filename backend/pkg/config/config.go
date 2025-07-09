package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds application-wide configurations
type Config struct {
	PassKey string
	Port    string
}

// LoadConfig loads environment variables into the Config struct
func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Printf("Error loading .env file, using default environment variables: %v", err)
	}

	return &Config{
		PassKey: os.Getenv("PASS_KEY"),
		Port:    os.Getenv("PORT"),
	}
}
