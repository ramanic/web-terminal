package server

import (
	"fmt"
	"log"
	"net/http"

	"web-terminal/backend/pkg/config"
	"web-terminal/backend/pkg/websocket"
)

// Server holds the application server configuration
type Server struct {
	Config *config.Config
}

// NewServer creates a new Server instance
func NewServer(cfg *config.Config) *Server {
	return &Server{
		Config: cfg,
	}
}

// Start initializes and starts the HTTP server
func (s *Server) Start() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.HandleWebSocket(w, r, s.Config.PassKey)
	})
	http.HandleFunc("/", s.handleHome)

	port := s.Config.Port
	if port == "" {
		port = "8080" // Default port
	}

	fmt.Printf("Server starting on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func (s *Server) handleHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	fmt.Fprintf(w, "WebSocket Terminal Server is running!")
}

