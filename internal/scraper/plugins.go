package scraper

import (
	"context"
	"sort"
	"strings"

	"github.com/ekjotsinghmakhija/aegis/internal/models"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

// Host Plugin
type HostPlugin struct{}
func (p *HostPlugin) Name() string { return "host" }
func (p *HostPlugin) Collect(ctx context.Context, _ *Registry) (interface{}, error) {
	h, _ := host.InfoWithContext(ctx)
	return models.Metadata{Hostname: h.Hostname, OSType: h.OS, AgentVersion: "2.0.0", UptimeSeconds: int64(h.Uptime)}, nil
}

// CPU Plugin
type CPUScraper struct{}
func (p *CPUScraper) Name() string { return "cpu" }
func (p *CPUScraper) Collect(ctx context.Context, _ *Registry) (interface{}, error) {
	global, _ := cpu.PercentWithContext(ctx, 0, false)
	cores, _ := cpu.PercentWithContext(ctx, 0, true)
	usage := 0.0
	if len(global) > 0 { usage = global[0] }
	return models.CPU{GlobalUsagePercent: usage, CoreUsage: cores}, nil
}

// Memory Plugin
type MemPlugin struct{}
func (p *MemPlugin) Name() string { return "memory" }
func (p *MemPlugin) Collect(ctx context.Context, _ *Registry) (interface{}, error) {
	v, _ := mem.VirtualMemoryWithContext(ctx)
	s, _ := mem.SwapMemoryWithContext(ctx)
	return models.Memory{
		TotalMB:     int64(v.Total / 1024 / 1024),
		UsedMB:      int64(v.Used / 1024 / 1024),
		AvailableMB: int64(v.Available / 1024 / 1024),
		SwapUsedMB:  int64(s.Used / 1024 / 1024),
	}, nil
}

// Disk Plugin
type DiskPlugin struct{}
func (p *DiskPlugin) Name() string { return "disk" }
func (p *DiskPlugin) Collect(ctx context.Context, _ *Registry) (interface{}, error) {
	partitions, _ := disk.PartitionsWithContext(ctx, false)
	stats := []models.Disk{}
	for _, part := range partitions {
		if strings.HasPrefix(part.Mountpoint, "/snap") || strings.HasPrefix(part.Mountpoint, "/boot") { continue }
		u, err := disk.UsageWithContext(ctx, part.Mountpoint)
		if err == nil {
			stats = append(stats, models.Disk{
				MountPoint: part.Mountpoint,
				TotalGB:    float64(u.Total) / 1024 / 1024 / 1024,
				UsedGB:     float64(u.Used) / 1024 / 1024 / 1024,
			})
		}
	}
	return stats, nil
}

// Network Plugin (Calculates speed using Registry state)
type NetPlugin struct{}
func (p *NetPlugin) Name() string { return "network" }
func (p *NetPlugin) Collect(ctx context.Context, reg *Registry) (interface{}, error) {
	ios, _ := net.IOCountersWithContext(ctx, true)
	stats := []models.Network{}
	for _, io := range ios {
		rx, tx := int64(0), int64(0)
		if prev, ok := reg.Get("net_"+io.Name); ok {
			pIO := prev.(net.IOCountersStat)
			rx, tx = int64(io.BytesRecv-pIO.BytesRecv), int64(io.BytesSent-pIO.BytesSent)
		}
		reg.Set("net_"+io.Name, io)
		stats = append(stats, models.Network{Interface: io.Name, RxBytesSec: rx, TxBytesSec: tx})
	}
	return stats, nil
}

// Process Plugin
type ProcessPlugin struct{}
func (p *ProcessPlugin) Name() string { return "processes" }
func (p *ProcessPlugin) Collect(ctx context.Context, _ *Registry) (interface{}, error) {
	procs, _ := process.ProcessesWithContext(ctx)
	list := []models.Process{}
	for _, pr := range procs {
		n, _ := pr.Name(); u, _ := pr.Username(); c, _ := pr.CPUPercent(); m, _ := pr.MemoryInfo()
		memMB := 0.0
		if m != nil { memMB = float64(m.RSS) / 1024 / 1024 }
		list = append(list, models.Process{PID: int(pr.Pid), Name: n, User: u, CPUPercent: c, MemoryMB: memMB})
	}
	sort.Slice(list, func(i, j int) bool { return list[i].CPUPercent > list[j].CPUPercent })
	if len(list) > 10 { list = list[:10] }
	return list, nil
}
