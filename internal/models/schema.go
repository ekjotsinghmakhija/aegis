package models

import "time"

// Payload represents the root v1.0 JSON telemetry schema
type Payload struct {
	Metadata     Metadata    `json:"metadata"`
	CPU          CPU         `json:"cpu"`
	Memory       Memory      `json:"memory"`
	GPUs         []GPU       `json:"gpus"` // Added GPU array
	Disks        []Disk      `json:"disk"`
	Networks     []Network   `json:"network"`
	TopProcesses []Process   `json:"top_processes"`
	Containers   []Container `json:"containers"`
}

type Metadata struct {
	Hostname      string    `json:"hostname"`
	OSType        string    `json:"os_type"`
	AgentVersion  string    `json:"agent_version"`
	Timestamp     time.Time `json:"timestamp"`
	UptimeSeconds int64     `json:"uptime_seconds"`
}

type CPU struct {
	GlobalUsagePercent float64   `json:"global_usage_percent"`
	CoreUsage          []float64 `json:"core_usage"`
	TemperatureC       float64   `json:"temperature_c"`
	PowerDrawW         float64   `json:"power_draw_w"`
}

type Memory struct {
	TotalMB     int64 `json:"total_mb"`
	UsedMB      int64 `json:"used_mb"`
	AvailableMB int64 `json:"available_mb"`
	SwapUsedMB  int64 `json:"swap_used_mb"`
}

type Disk struct {
	MountPoint    string  `json:"mount_point"`
	TotalGB       float64 `json:"total_gb"`
	UsedGB        float64 `json:"used_gb"`
	ReadBytesSec  int64   `json:"read_bytes_sec"`
	WriteBytesSec int64   `json:"write_bytes_sec"`
}

type Network struct {
	Interface         string `json:"interface"`
	RxBytesSec        int64  `json:"rx_bytes_sec"`
	TxBytesSec        int64  `json:"tx_bytes_sec"`
	ActiveConnections int    `json:"active_connections"`
}

type Process struct {
	PID        int     `json:"pid"`
	Name       string  `json:"name"`
	User       string  `json:"user"`
	CPUPercent float64 `json:"cpu_percent"`
	MemoryMB   float64 `json:"memory_mb"`
}

type Container struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Status     string  `json:"status"`
	CPUPercent float64 `json:"cpu_percent"`
	MemoryMB   float64 `json:"memory_mb"`
}

type GPU struct {
	Vendor        string  `json:"vendor"`
	Model         string  `json:"model"`
	MemoryTotalMB int64   `json:"memory_total_mb"`
	Utilization   float64 `json:"utilization"`
}
