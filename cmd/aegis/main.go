package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/scraper"
	"github.com/ekjotsinghmakhija/aegis/internal/server"
)

func main() {
	fmt.Println("Initializing Aegis Agent v1.0.0...")

	// 1. Start the WebSocket server in a background Goroutine
	go server.StartServer()

	// Give the server a millisecond to bind to the port before printing
	time.Sleep(100 * time.Millisecond)

	// 2. Start the Terminal UI ticker
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			telemetryData := scraper.GetTelemetry()
			jsonData, err := json.MarshalIndent(telemetryData, "", "  ")
			if err != nil {
				log.Printf("Error: Failed to marshal telemetry payload: %v", err)
				continue
			}

			// Clear terminal and print
			fmt.Print("\033[H\033[2J")
			fmt.Println("=== Aegis Agent Live Telemetry ===")
			fmt.Println("-> Local WebSocket Stream: ws://localhost:8080/ws")
			fmt.Println("-> Press Ctrl+C to stop")
			fmt.Println("==================================")
			fmt.Println(string(jsonData))
		}
	}
}
