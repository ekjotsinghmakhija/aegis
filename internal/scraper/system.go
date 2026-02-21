package scraper

import (
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/models"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

// GetTelemetry collects real-time system metrics and formats them into our Payload schema.
func GetTelemetry() models.Payload {
	// 1. Fetch Metadata
	hostStat, _ := host.Info()

	// 2. Fetch CPU Metrics
	// We pass 'false' to get global usage, and 'true' to get per-core usage.
	// The '0' duration means it calculates based on the last call (non-blocking).
	cpuGlobal, _ := cpu.Percent(0, false)
	cpuCores, _ := cpu.Percent(0, true)

	var globalUsage float64
	if len(cpuGlobal) > 0 {
		globalUsage = cpuGlobal[0]
	}

	// 3. Fetch Memory Metrics
	vmStat, _ := mem.VirtualMemory()
	swapStat, _ := mem.SwapMemory()

	// 4. Construct the Payload
	return models.Payload{
		Metadata: models.Metadata{
			Hostname:      hostStat.Hostname,
			OSType:        hostStat.OS,
			AgentVersion:  "1.0.0",
			Timestamp:     time.Now().UTC(),
			UptimeSeconds: int64(hostStat.Uptime),
		},
		CPU: models.CPU{
			GlobalUsagePercent: globalUsage,
			CoreUsage:          cpuCores,
			// Note: Temperature and Power are highly hardware-dependent.
			// We'll leave them at 0.0 for this iteration until we add sensor plugins.
			TemperatureC:       0.0,
			PowerDrawW:         0.0,
		},
		Memory: models.Memory{
			// Convert bytes to Megabytes (MB)
			TotalMB:     int64(vmStat.Total / 1024 / 1024),
			UsedMB:      int64(vmStat.Used / 1024 / 1024),
			AvailableMB: int64(vmStat.Available / 1024 / 1024),
			SwapUsedMB:  int64(swapStat.Used / 1024 / 1024),
		},
		// Initialize empty arrays for the rest for now
		Disks:        []models.Disk{},
		Networks:     []models.Network{},
		TopProcesses: []models.Process{},
		Containers:   []models.Container{},
	}
}
