package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/models"
)

func main() {
	fmt.Println("Initializing Aegis Agent v1.0.0...")

	// 1. Generate dummy telemetry data to test our schema contract
	dummyData := models.Payload{
		Metadata: models.Metadata{
			Hostname:      "dev-workstation-01",
			OSType:        "linux",
			AgentVersion:  "1.0.0",
			Timestamp:     time.Now().UTC(),
			UptimeSeconds: 14400,
		},
		CPU: models.CPU{
			GlobalUsagePercent: 18.5,
			CoreUsage:          []float64{15.2, 22.1, 10.0, 26.7},
			TemperatureC:       54.2,
			PowerDrawW:         45.5,
		},
		Memory: models.Memory{
			TotalMB:     32768,
			UsedMB:      14336,
			AvailableMB: 18432,
			SwapUsedMB:  0,
		},
		// Empty slices for Disk, Network, Process, and Containers
		// to verify they serialize as empty arrays "[]" in JSON
		Disks:        []models.Disk{},
		Networks:     []models.Network{},
		TopProcesses: []models.Process{},
		Containers:   []models.Container{},
	}

	// 2. Marshal the struct into a pretty-printed JSON string
	jsonData, err := json.MarshalIndent(dummyData, "", "  ")
	if err != nil {
		log.Fatalf("Fatal Error: Failed to marshal telemetry payload: %v", err)
	}

	// 3. Output the JSON payload to the terminal
	fmt.Println("Schema Verification Successful. Payload Preview:")
	fmt.Println(string(jsonData))
}
