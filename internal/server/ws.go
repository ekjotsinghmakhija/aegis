package server

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/scraper"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow our Next.js dashboard to connect
	},
}

// ClientCommand represents incoming instructions from the UI
type ClientCommand struct {
	Action      string `json:"action"`
	PID         int    `json:"pid,omitempty"`
	ContainerID string `json:"container_id,omitempty"` // Added for Docker
}

func HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket Upgrade Error: %v", err)
		return
	}
	defer ws.Close()

	log.Printf("New client connected from %s", r.RemoteAddr)

	// --- THE UPGRADED READ PUMP (Listens for UI commands) ---
	go func() {
		for {
			_, message, err := ws.ReadMessage()
			if err != nil {
				break // Exit if client disconnects
			}

			var cmd ClientCommand
			if err := json.Unmarshal(message, &cmd); err == nil {
				// Handle OS Processes
				if cmd.Action == "kill_process" && cmd.PID > 0 {
					log.Printf("Command Received: Kill PID %d", cmd.PID)
					killProcess(cmd.PID)
				}
				// Handle Docker Containers
				if (cmd.Action == "docker_start" || cmd.Action == "docker_stop" || cmd.Action == "docker_restart") && cmd.ContainerID != "" {
					log.Printf("Command Received: %s on Container %s", cmd.Action, cmd.ContainerID)
					// Strip the "docker_" prefix to pass just "start", "stop", or "restart"
					scraper.PerformDockerAction(cmd.ContainerID, cmd.Action[7:])
				}
			}
		}
	}()

	// --- THE EXISTING WRITE PUMP (Streams telemetry) ---
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			telemetry := scraper.GetTelemetry()
			err := ws.WriteJSON(telemetry)
			if err != nil {
				log.Printf("Client disconnected: %s", r.RemoteAddr)
				return
			}
		}
	}
}

// killProcess interfaces with the OS to terminate a task
func killProcess(pid int) {
	proc, err := os.FindProcess(pid)
	if err != nil {
		log.Printf("Failed to find process %d: %v", pid, err)
		return
	}

	// Issue the kill signal to the OS
	err = proc.Kill()
	if err != nil {
		log.Printf("Failed to kill process %d (Check Permissions): %v", pid, err)
	} else {
		log.Printf("Successfully terminated process %d", pid)
	}
}

func StartServer() {
	http.HandleFunc("/ws", HandleConnections)
	log.Println("Aegis WebSocket Daemon running on ws://localhost:8080/ws")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Fatal Error: WebSocket Server failed to start: %v", err)
	}
}
