"use client";

import { useEffect, useState, useRef } from "react";
import { TelemetryPayload, ChartData } from "../types/telemetry";
import Header from "../components/Header";
import MetricCards from "../components/MetricCards";
import CpuChart from "../components/CpuChart";
import ProcessTable from "../components/ProcessTable";
import ContainerTable from "../components/ContainerTable";

export default function Dashboard() {
  const [data, setData] = useState<TelemetryPayload | null>(null);
  const [history, setHistory] = useState<ChartData[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");
    wsRef.current = ws;

    ws.onopen = () => setStatus("Connected (Live)");
    ws.onclose = () => setStatus("Disconnected - Retrying...");

    ws.onmessage = (event) => {
      const payload: TelemetryPayload = JSON.parse(event.data);
      setData(payload);

      setHistory((prev) => {
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        const newPoint = { time: timeString, cpu: Number(payload.cpu.global_usage_percent.toFixed(1)) };
        return [...prev, newPoint].slice(-60);
      });
    };

    return () => ws.close();
  }, []);

  const handleKillProcess = (pid: number, name: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (window.confirm(`WARNING: Are you sure you want to kill ${name} (PID: ${pid})?`)) {
        wsRef.current.send(JSON.stringify({ action: "kill_process", pid: pid }));
      }
    } else {
      alert("Cannot send command: WebSocket is not connected.");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Header status={status} />

        {data ? (
          <div className="flex flex-col gap-6">
            <MetricCards data={data} />
            <CpuChart history={history} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProcessTable processes={data.top_processes} onKill={handleKillProcess} />
              <ContainerTable containers={data.containers} />
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
