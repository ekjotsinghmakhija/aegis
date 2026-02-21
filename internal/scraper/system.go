package scraper

import (
	"strings"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/models"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

// GetTelemetry collects real-time system metrics and formats them into our Payload schema.
func GetTelemetry() models.Payload {
	// 1. Fetch Metadata
	hostStat, _ := host.Info()

	// 2. Fetch CPU Metrics
	cpuGlobal, _ := cpu.Percent(0, false)
	cpuCores, _ := cpu.Percent(0, true)

	var globalUsage float64
	if len(cpuGlobal) > 0 {
		globalUsage = cpuGlobal[0]
	}

	// 3. Fetch Memory Metrics
	vmStat, _ := mem.VirtualMemory()
	swapStat, _ := mem.SwapMemory()

	// 4. Fetch Disk Metrics
	partitions, _ := disk.Partitions(false)
	var diskStats []models.Disk
	for _, p := range partitions {
		// Ignore obscure pseudo-filesystems (like snap loop devices on Ubuntu)
		if strings.HasPrefix(p.Mountpoint, "/snap") || strings.HasPrefix(p.Mountpoint, "/boot") {
			continue
		}

		usage, err := disk.Usage(p.Mountpoint)
		if err == nil {
			diskStats = append(diskStats, models.Disk{
				MountPoint:    p.Mountpoint,
				TotalGB:       float64(usage.Total) / 1024 / 1024 / 1024,
				UsedGB:        float64(usage.Used) / 1024 / 1024 / 1024,
				ReadBytesSec:  0, // Note: IO/sec requires state tracking. We will add this in the polling loop.
				WriteBytesSec: 0,
			})
		}
	}

	// 5. Fetch Network Metrics
	netIO, _ := net.IOCounters(true)
	var netStats []models.Network
	for _, io := range netIO {
		// Filter out loopback or dead interfaces
		if io.BytesRecv > 0 || io.BytesSent > 0 {
			netStats = append(netStats, models.Network{
				Interface:         io.Name,
				RxBytesSec:        int64(io.BytesRecv), // Temporarily storing raw total bytes
				TxBytesSec:        int64(io.BytesSent),
				ActiveConnections: 0,
			})
		}
	}

	// 6. Construct the Payload
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
			TemperatureC:       0.0,
			PowerDrawW:         0.0,
		},
		Memory: models.Memory{
			TotalMB:     int64(vmStat.Total / 1024 / 1024),
			UsedMB:      int64(vmStat.Used / 1024 / 1024),
			AvailableMB: int64(vmStat.Available / 1024 / 1024),
			SwapUsedMB:  int64(swapStat.Used / 1024 / 1024),
		},
		Disks:        diskStats,
		Networks:     netStats,
		TopProcesses: []models.Process{},
		Containers:   []models.Container{},
	}
}
