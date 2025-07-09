package server

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"web-terminal/backend/pkg/config"
	"web-terminal/backend/pkg/websocket"
)

// Server holds the application server configuration
type Server struct {
	Config *config.Config
	Content embed.FS
}

// NewServer creates a new Server instance
func NewServer(cfg *config.Config, content embed.FS) *Server {
	return &Server{
		Config: cfg,
		Content: content,
	}
}

// Start initializes and starts the HTTP server
func (s *Server) Start() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.HandleWebSocket(w, r, s.Config.PassKey)
	})

	// Subdirectory inside embed.FS
	buildFs, err := fs.Sub(s.Content, "web")
	if err != nil {
		panic(err)
	}
	http.Handle("/", http.FileServer(http.FS(buildFs)))

	port := s.Config.Port
	if port == "" {
		port = "8080" // Default port
	}

	fmt.Printf("Server starting on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
