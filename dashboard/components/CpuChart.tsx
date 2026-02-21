import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartData } from "../types/telemetry";

export default function CpuChart({ history }: { history: ChartData[] }) {
  return (
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
  );
}
