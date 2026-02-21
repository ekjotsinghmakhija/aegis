import { TelemetryPayload } from "../types/telemetry";

interface Props {
  processes: TelemetryPayload["top_processes"];
  onKill: (pid: number, name: string) => void;
}

export default function ProcessTable({ processes, onKill }: Props) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Top Processes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-950/50 text-neutral-400 text-sm border-b border-neutral-800">
              <th className="p-4 font-medium">PID</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium text-right">CPU %</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-neutral-800/50">
            {processes.map((proc) => (
              <tr key={proc.pid} className="hover:bg-neutral-800/20 transition-colors">
                <td className="p-4 text-neutral-500">{proc.pid}</td>
                <td className="p-4 font-medium text-neutral-200 truncate max-w-[150px]">{proc.name}</td>
                <td className="p-4 text-right font-mono text-blue-400">{proc.cpu_percent.toFixed(1)}%</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => onKill(proc.pid, proc.name)}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded transition-colors text-xs font-semibold"
                  >
                    KILL
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
