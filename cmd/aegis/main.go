package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/scraper"
)

func main() {
	fmt.Println("Initializing Aegis Agent v1.0.0...")
	fmt.Println("Warming up hardware scrapers...")

	// 1. Create a ticker that fires exactly every 1 second
	ticker := time.NewTicker(1 * time.Second)

	// Ensure the ticker is cleaned up when the program exits
	defer ticker.Stop()

	// 2. Create an infinite polling loop
	for {
		select {
		case <-ticker.C:
			// Fetch live telemetry from all hardware
			telemetryData := scraper.GetTelemetry()

			// Marshal the struct into a pretty-printed JSON string
			jsonData, err := json.MarshalIndent(telemetryData, "", "  ")
			if err != nil {
				log.Printf("Error: Failed to marshal telemetry payload: %v", err)
				continue
			}

			// Clear the terminal screen (ANSI escape codes)
			// \033[H moves the cursor to the top left
			// \033[2J clears the entire screen
			fmt.Print("\033[H\033[2J")

			// Output the live JSON dashboard
			fmt.Println("=== Aegis Agent Live Telemetry (Press Ctrl+C to stop) ===")
			fmt.Println(string(jsonData))
		}
	}
}
