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

// 1. Maintain the Schema Contract
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

// Custom type for our chart history
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

      // 2. Build the rolling history (keep the last 60 seconds)
      setHistory((prev) => {
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const newPoint = {
          time: timeString,
          cpu: Number(payload.cpu.global_usage_percent.toFixed(1)),
        };

        // Return previous array + new point, but slice it to max 60 items
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
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.includes("Live")
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {status}
          </div>
        </header>

        {data ? (
          <div className="flex flex-col gap-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Host Card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Host Identity
                </h2>
                <div className="text-2xl font-bold">{data.metadata.hostname}</div>
                <div className="text-sm text-neutral-500 mt-2">
                  OS: {data.metadata.os_type.toUpperCase()}
                </div>
                <div className="text-sm text-neutral-500">
                  Uptime: {Math.floor(data.metadata.uptime_seconds / 3600)}h{" "}
                  {Math.floor((data.metadata.uptime_seconds % 3600) / 60)}m
                </div>
              </div>

              {/* CPU Card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  CPU Utilization
                </h2>
                <div className="text-4xl font-bold text-blue-400">
                  {data.cpu.global_usage_percent.toFixed(1)}%
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-4">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.cpu.global_usage_percent}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory Card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Memory Usage
                </h2>
                <div className="text-4xl font-bold text-purple-400">
                  {data.memory.used_mb}{" "}
                  <span className="text-lg text-neutral-500">MB</span>
                </div>
                <div className="text-sm text-neutral-500 mt-2">
                  / {data.memory.total_mb} MB Total
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(data.memory.used_mb / data.memory.total_mb) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 3. The CPU History Chart */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg mt-4">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-6">
                CPU History (60 Seconds)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis
                      dataKey="time"
                      stroke="#525252"
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis
                      stroke="#525252"
                      fontSize={12}
                      domain={[0, 100]}
                      tickFormatter={(tick) => `${tick}%`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false} // Disabled for raw real-time feel
                    />
                  </LineChart>
                </ResponsiveContainer>
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
