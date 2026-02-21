import { TelemetryPayload } from "../types/telemetry";

interface Props {
  containers: TelemetryPayload["containers"];
  onAction: (id: string, action: string) => void;
}

export default function ContainerTable({ containers, onAction }: Props) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Active Containers</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-950/50 text-neutral-400 text-sm border-b border-neutral-800">
              <th className="p-4 font-medium">Container ID</th>
              <th className="p-4 font-medium">Image Name</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-neutral-800/50">
            {containers?.length > 0 ? (
              containers.map((container) => (
                <tr key={container.id} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="p-4 text-neutral-500 font-mono">{container.id}</td>
                  <td className="p-4 font-medium text-neutral-200 truncate max-w-[150px]">{container.name}</td>
                  <td className="p-4 font-mono capitalize">
                    <span className={container.status === "running" ? "text-emerald-400" : "text-neutral-500"}>
                      {container.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {container.status === "running" ? (
                      <>
                        <button onClick={() => onAction(container.id, "restart")} className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition-colors text-xs font-semibold">RESTART</button>
                        <button onClick={() => onAction(container.id, "stop")} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-colors text-xs font-semibold">STOP</button>
                      </>
                    ) : (
                      <button onClick={() => onAction(container.id, "start")} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white px-2 py-1 rounded transition-colors text-xs font-semibold">START</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">No active Docker containers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
