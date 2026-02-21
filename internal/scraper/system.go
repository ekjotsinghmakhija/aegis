package scraper

import (
	"sort"
	"strings"
	"time"

	"github.com/ekjotsinghmakhija/aegis/internal/models"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

// GetTelemetry collects real-time system metrics and formats them into our Payload schema.
func GetTelemetry() models.Payload {
	// 1. Fetch Metadata
	hostStat, _ := host.Info()

	// 2. Fetch CPU
	cpuGlobal, _ := cpu.Percent(0, false)
	cpuCores, _ := cpu.Percent(0, true)
	var globalUsage float64
	if len(cpuGlobal) > 0 {
		globalUsage = cpuGlobal[0]
	}

	// 3. Fetch Memory
	vmStat, _ := mem.VirtualMemory()
	swapStat, _ := mem.SwapMemory()

	// 4. Fetch Disks
	partitions, _ := disk.Partitions(false)
	var diskStats []models.Disk
	for _, p := range partitions {
		if strings.HasPrefix(p.Mountpoint, "/snap") || strings.HasPrefix(p.Mountpoint, "/boot") {
			continue
		}
		usage, err := disk.Usage(p.Mountpoint)
		if err == nil {
			diskStats = append(diskStats, models.Disk{
				MountPoint:    p.Mountpoint,
				TotalGB:       float64(usage.Total) / 1024 / 1024 / 1024,
				UsedGB:        float64(usage.Used) / 1024 / 1024 / 1024,
			})
		}
	}

	// 5. Fetch Network
	netIO, _ := net.IOCounters(true)
	var netStats []models.Network
	for _, io := range netIO {
		if io.BytesRecv > 0 || io.BytesSent > 0 {
			netStats = append(netStats, models.Network{
				Interface:  io.Name,
				RxBytesSec: int64(io.BytesRecv),
				TxBytesSec: int64(io.BytesSent),
			})
		}
	}

	// 6. Fetch Top Processes
	procs, _ := process.Processes()
	var procList []models.Process
	for _, p := range procs {
		name, _ := p.Name()
		user, _ := p.Username()

		// CPU percent calculates delta since last call.
		// If permission is denied (e.g., root processes), it safely returns 0.
		cpuPct, _ := p.CPUPercent()

		memInfo, _ := p.MemoryInfo()
		var memMB float64
		if memInfo != nil {
			memMB = float64(memInfo.RSS) / 1024 / 1024
		}

		procList = append(procList, models.Process{
			PID:        int(p.Pid),
			Name:       name,
			User:       user,
			CPUPercent: cpuPct,
			MemoryMB:   memMB,
		})
	}

	// Sort processes descending by CPU usage
	sort.Slice(procList, func(i, j int) bool {
		return procList[i].CPUPercent > procList[j].CPUPercent
	})

	// Slice the top 10 processes
	topCount := 10
	if len(procList) < 10 {
		topCount = len(procList)
	}
	topProcesses := procList[:topCount]

	// 7. Construct Payload
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
		},
		Memory: models.Memory{
			TotalMB:     int64(vmStat.Total / 1024 / 1024),
			UsedMB:      int64(vmStat.Used / 1024 / 1024),
			AvailableMB: int64(vmStat.Available / 1024 / 1024),
			SwapUsedMB:  int64(swapStat.Used / 1024 / 1024),
		},
		Disks:        diskStats,
		Networks:     netStats,
		TopProcesses: topProcesses,
		Containers:   []models.Container{}, // We will tackle Docker next
	}
}
