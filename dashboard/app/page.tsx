"use client";

import { useEffect, useState, useRef } from "react";
import { TelemetryPayload } from "../types/telemetry";
import Header from "../components/Header";
import MetricCards from "../components/MetricCards";
import CpuChart from "../components/CpuChart";
import NetChart from "../components/NetChart";
import ProcessTable from "../components/ProcessTable";
import ContainerTable from "../components/ContainerTable";

export default function Dashboard() {
  const [data, setData] = useState<TelemetryPayload | null>(null);
  const [cpuHistory, setCpuHistory] = useState<any[]>([]);
  const [netHistory, setNetHistory] = useState<any[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const payload: TelemetryPayload = JSON.parse(event.data);
      setData(payload);
      const time = new Date().toLocaleTimeString();

      setCpuHistory(prev => [...prev, { time, cpu: payload.cpu.global_usage_percent }].slice(-60));

      const rx = payload.network.reduce((a, b) => a + b.rx_bytes_sec, 0) / 1024;
      const tx = payload.network.reduce((a, b) => a + b.tx_bytes_sec, 0) / 1024;
      setNetHistory(prev => [...prev, { time, rx, tx }].slice(-60));
      setStatus("Connected (Live)");
    };

    return () => ws.close();
  }, []);

  const handleAction = (cmd: object) => wsRef.current?.send(JSON.stringify(cmd));

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header status={status} />
        {data && (
          <>
            <MetricCards data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CpuChart history={cpuHistory} />
              <NetChart history={netHistory} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProcessTable processes={data.top_processes} onKill={(pid) => handleAction({action: "kill_process", pid})} />
              <ContainerTable containers={data.containers} onAction={(id, action) => handleAction({action: `docker_${action}`, container_id: id})} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
