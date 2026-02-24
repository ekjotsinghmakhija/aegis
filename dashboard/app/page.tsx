"use client";

import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import MetricCards from "../components/MetricCards";
import CpuChart from "../components/CpuChart";
import NetChart from "../components/NetChart";
import ProcessTable from "../components/ProcessTable";
import ContainerTable from "../components/ContainerTable";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"live" | "history" | "rules">("live");
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [cpuHistory, setCpuHistory] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. WebSocket for Live Data
    const ws = new WebSocket(`ws://localhost:8080/ws?token=mysecret123`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      setData(payload);
      setCpuHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), cpu: payload.cpu.global_usage_percent }].slice(-60));
    };

    // 2. Fetch History on load
    fetch("http://localhost:8080/api/history")
      .then(res => res.json())
      .then(data => setHistory(data));

    return () => ws.close();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header status="Live" />

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-neutral-800 pb-2">
          {["live", "history", "rules"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-t-lg capitalize transition-colors ${activeTab === tab ? "bg-neutral-800 text-blue-400" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "live" && data && (
          <div className="space-y-6">
            <MetricCards data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CpuChart history={cpuHistory} />
              <NetChart history={[]} /> {/* Implement history state similarly */}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProcessTable processes={data.top_processes} onKill={() => {}} />
              <ContainerTable containers={data.containers} onAction={() => {}} />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold mb-4 text-blue-400 underline">System Time-Travel</h2>
            <div className="space-y-2 text-left max-w-md mx-auto">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between border-b border-neutral-800 py-2 font-mono text-sm">
                  <span className="text-neutral-500">{h.time}</span>
                  <span className="text-blue-400">CPU: {h.cpu}%</span>
                  <span className="text-purple-400">MEM: {h.mem}MB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500">
            Alert Rules Management (Coming in v3.1)
          </div>
        )}
      </div>
    </main>
  );
}
