package websocket

import (
	"log"
	"net/http"

	"web-terminal/backend/pkg/terminal"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin (configure this for production)
		return true
	},
}

func HandleWebSocket(w http.ResponseWriter, r *http.Request, passKey string) {
	// Get the passkey from the query parameter
	clientPassKey := r.URL.Query().Get("passkey")

	if clientPassKey != passKey {
		log.Printf("Unauthorized WebSocket connection attempt from %s", r.RemoteAddr)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	term := terminal.NewTerminal(conn)

	// Start the terminal session
	if err := term.Start(); err != nil {
		log.Printf("Failed to start terminal: %v", err)
		return
	}
	defer term.Close()

	// Handle the WebSocket connection
	term.HandleConnection()
}
