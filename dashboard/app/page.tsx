"use client";

import { useEffect, useState } from "react";

// 1. We mirror the Go Structs as TypeScript Interfaces to maintain the schema contract
interface TelemetryPayload {
  metadata: {
    hostname: string;
    os_type: string;
    uptime_seconds: number;
  };
  cpu: {
    global_usage_percent: number;
    temperature_c: number;
  };
  memory: {
    total_mb: number;
    used_mb: number;
    available_mb: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<TelemetryPayload | null>(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    // 2. Connect to the local Go agent
    const ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = () => setStatus("Connected (Live)");
    ws.onclose = () => setStatus("Disconnected - Retrying...");

    // 3. Parse the JSON payload every second it arrives
    ws.onmessage = (event) => {
      const payload: TelemetryPayload = JSON.parse(event.data);
      setData(payload);
    };

    return () => ws.close();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aegis Control Plane</h1>
            <p className="text-neutral-400 mt-1">Real-time telemetry stream</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.includes('Live') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {status}
          </div>
        </header>

        {/* Dashboard Grid */}
        {data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Host Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Host Identity</h2>
              <div className="text-2xl font-bold">{data.metadata.hostname}</div>
              <div className="text-sm text-neutral-500 mt-2">OS: {data.metadata.os_type.toUpperCase()}</div>
              <div className="text-sm text-neutral-500">Uptime: {Math.floor(data.metadata.uptime_seconds / 3600)}h {Math.floor((data.metadata.uptime_seconds % 3600) / 60)}m</div>
            </div>

            {/* CPU Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">CPU Utilization</h2>
              <div className="text-4xl font-bold text-blue-400">
                {data.cpu.global_usage_percent.toFixed(1)}%
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 mt-4">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${data.cpu.global_usage_percent}%` }}></div>
              </div>
            </div>

            {/* Memory Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Memory Usage</h2>
              <div className="text-4xl font-bold text-purple-400">
                {data.memory.used_mb} <span className="text-lg text-neutral-500">MB</span>
              </div>
              <div className="text-sm text-neutral-500 mt-2">
                / {data.memory.total_mb} MB Total
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(data.memory.used_mb / data.memory.total_mb) * 100}%` }}></div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center text-neutral-500 py-20 animate-pulse">
            Awaiting telemetry payload from Aegis Agent...
          </div>
        )}
      </div>
    </main>
  );
}
