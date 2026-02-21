import { TelemetryPayload } from "../types/telemetry";

export default function MetricCards({ data }: { data: TelemetryPayload }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Host Identity</h2>
        <div className="text-2xl font-bold">{data.metadata.hostname}</div>
        <div className="text-sm text-neutral-500 mt-2">OS: {data.metadata.os_type.toUpperCase()}</div>
        <div className="text-sm text-neutral-500">Uptime: {Math.floor(data.metadata.uptime_seconds / 3600)}h {Math.floor((data.metadata.uptime_seconds % 3600) / 60)}m</div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">CPU Utilization</h2>
        <div className="text-4xl font-bold text-blue-400">{data.cpu.global_usage_percent.toFixed(1)}%</div>
        <div className="w-full bg-neutral-800 rounded-full h-2 mt-4">
          <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${data.cpu.global_usage_percent}%` }}></div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Memory Usage</h2>
        <div className="text-4xl font-bold text-purple-400">{data.memory.used_mb} <span className="text-lg text-neutral-500">MB</span></div>
        <div className="text-sm text-neutral-500 mt-2">/ {data.memory.total_mb} MB Total</div>
        <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
          <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(data.memory.used_mb / data.memory.total_mb) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
}
