"use client";

import { useEffect, useState, useRef } from "react";
import { TelemetryPayload, ChartData } from "../types/telemetry";
import Header from "../components/Header";
import MetricCards from "../components/MetricCards";
import CpuChart from "../components/CpuChart";
import NetChart from "../components/NetChart";
import ProcessTable from "../components/ProcessTable";
import ContainerTable from "../components/ContainerTable";

export default function Dashboard() {
  const [data, setData] = useState<TelemetryPayload | null>(null);
  const [cpuHistory, setCpuHistory] = useState<ChartData[]>([]);
  const [netHistory, setNetHistory] = useState<any[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const wsRef = useRef<WebSocket | null>(null);

  // This must match the AEGIS_TOKEN set in your Go environment
  const AEGIS_TOKEN = "mysecret123";

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws?token=${AEGIS_TOKEN}`);
    wsRef.current = ws;

    ws.onopen = () => setStatus("Connected (Live)");
    ws.onclose = () => setStatus("Disconnected - Retrying...");

    ws.onmessage = (event) => {
      const payload: TelemetryPayload = JSON.parse(event.data);
      setData(payload);

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Update CPU History
      setCpuHistory(prev => [...prev, { time, cpu: payload.cpu.global_usage_percent }].slice(-60));

      // Calculate Network Speeds (KB/s)
      const rx = (payload.network?.reduce((a, b) => a + b.rx_bytes_sec, 0) || 0) / 1024;
      const tx = (payload.network?.reduce((a, b) => a + b.tx_bytes_sec, 0) || 0) / 1024;
      setNetHistory(prev => [...prev, { time, rx, tx }].slice(-60));
    };

    return () => ws.close();
  }, []);

  const handleAction = (cmd: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header status={status} />

        {data ? (
          <>
            <MetricCards data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CpuChart history={cpuHistory} />
              <NetChart history={netHistory} />
            </div>

            {/* Multi-Vendor GPU Section */}
            {data.gpus?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.gpus.map((gpu, idx) => (
                  <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
                    <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">GPU: {gpu.vendor}</h2>
                    <div className="text-xl font-bold text-emerald-400 mb-4">{gpu.model}</div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Utilization</span>
                      <span>{gpu.utilization}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-2">
                       <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${gpu.utilization}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProcessTable
                processes={data.top_processes}
                onKill={(pid) => handleAction({action: "kill_process", pid})}
              />
              <ContainerTable
                containers={data.containers}
                onAction={(id, action) => handleAction({action: `docker_${action}`, container_id: id})}
              />
            </div>
          </>
        ) : (
          <div className="text-center text-neutral-500 py-20 animate-pulse font-mono">
            ESTABLISHING SECURE HANDSHAKE...
          </div>
        )}
      </div>
    </main>
  );
}
