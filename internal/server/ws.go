package server

import (
	"log"
	"net/http"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/scraper"
	"github.com/gorilla/websocket"
)

// Configure the Upgrader to allow all origins.
// This is required so our Next.js web dashboard can connect to this local port safely.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// HandleConnections manages individual WebSocket clients
func HandleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket Upgrade Error: %v", err)
		return
	}
	defer ws.Close()

	log.Printf("New client connected from %s", r.RemoteAddr)

	// Create a 1-second ticker for this specific client
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Fetch the live payload
			telemetry := scraper.GetTelemetry()

			// Write it directly down the socket as JSON
			err := ws.WriteJSON(telemetry)
			if err != nil {
				log.Printf("Client disconnected: %s", r.RemoteAddr)
				return // Break the loop and close the socket if the client drops
			}
		}
	}
}

// StartServer initializes the background WebSocket daemon
func StartServer() {
	http.HandleFunc("/ws", HandleConnections)

	log.Println("Aegis WebSocket Daemon running on ws://localhost:8080/ws")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Fatal Error: WebSocket Server failed to start: %v", err)
	}
}
