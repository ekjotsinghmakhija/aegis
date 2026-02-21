package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/ekjotsinghmakhija/aegis/internal/scraper"
)

func main() {
	fmt.Println("Initializing Aegis Agent v1.0.0...")

	// 1. Call our new scraper to get real hardware data
	telemetryData := scraper.GetTelemetry()

	// 2. Marshal the struct into a pretty-printed JSON string
	jsonData, err := json.MarshalIndent(telemetryData, "", "  ")
	if err != nil {
		log.Fatalf("Fatal Error: Failed to marshal telemetry payload: %v", err)
	}

	// 3. Output the live JSON payload to the terminal
	fmt.Println("Live Telemetry Acquired. Payload Preview:")
	fmt.Println(string(jsonData))
}
