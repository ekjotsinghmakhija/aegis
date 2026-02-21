import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  history: { time: string; rx: number; tx: number }[];
}

export default function NetChart({ history }: Props) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-6">Network Traffic (KB/s)</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="time" stroke="#525252" fontSize={12} />
            <YAxis stroke="#525252" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626' }} />
            <Area type="monotone" dataKey="rx" stroke="#10b981" fill="#10b98120" name="Download" isAnimationActive={false} />
            <Area type="monotone" dataKey="tx" stroke="#f59e0b" fill="#f59e0b20" name="Upload" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
