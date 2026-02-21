export interface TelemetryPayload {
  metadata: { hostname: string; os_type: string; uptime_seconds: number; };
  cpu: { global_usage_percent: number; temperature_c: number; };
  memory: { total_mb: number; used_mb: number; available_mb: number; };
  top_processes: { pid: number; name: string; user: string; cpu_percent: number; memory_mb: number; }[];
  containers: { id: string; name: string; status: string; cpu_percent: number; memory_mb: number; }[];
}

export interface ChartData {
  time: string;
  cpu: number;
}
