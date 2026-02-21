"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 1. Upgraded Schema Contract to include Top Processes
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
  top_processes: {
    pid: number;
    name: string;
    user: string;
    cpu_percent: number;
    memory_mb: number;
  }[];
}

interface ChartData {
  time: string;
  cpu: number;
}

export default function Dashboard() {
  const [data, setData] = useState<TelemetryPayload | null>(null);
  const [history, setHistory] = useState<ChartData[]>([]);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");

    ws.onopen = () => setStatus("Connected (Live)");
    ws.onclose = () => setStatus("Disconnected - Retrying...");

    ws.onmessage = (event) => {
      const payload: TelemetryPayload = JSON.parse(event.data);
      setData(payload);

      setHistory((prev) => {
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const newPoint = {
          time: timeString,
          cpu: Number(payload.cpu.global_usage_percent.toFixed(1)),
        };

        return [...prev, newPoint].slice(-60);
      });
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
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.includes("Live") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {status}
          </div>
        </header>

        {data ? (
          <div className="flex flex-col gap-6">
            {/* Top Cards Grid */}
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

            {/* The CPU History Chart */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-6">CPU History (60 Seconds)</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="time" stroke="#525252" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#525252" fontSize={12} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5' }} itemStyle={{ color: '#60a5fa' }} />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. The Top Processes Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-neutral-800">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Top Processes (By CPU)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-950/50 text-neutral-400 text-sm border-b border-neutral-800">
                      <th className="p-4 font-medium">PID</th>
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium text-right">CPU %</th>
                      <th className="p-4 font-medium text-right">Memory (MB)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-neutral-800/50">
                    {data.top_processes.map((proc) => (
                      <tr key={proc.pid} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="p-4 text-neutral-500">{proc.pid}</td>
                        <td className="p-4 font-medium text-neutral-200">{proc.name}</td>
                        <td className="p-4 text-neutral-500">{proc.user || "-"}</td>
                        <td className="p-4 text-right font-mono text-blue-400">{proc.cpu_percent.toFixed(1)}%</td>
                        <td className="p-4 text-right font-mono text-purple-400">{proc.memory_mb.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center text-neutral-500 py-20 animate-pulse">Awaiting telemetry payload from Aegis Agent...</div>
        )}
      </div>
    </main>
  );
}
