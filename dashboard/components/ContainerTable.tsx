import { TelemetryPayload } from "../types/telemetry";

export default function ContainerTable({ containers }: { containers: TelemetryPayload["containers"] }) {
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
              <th className="p-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-neutral-800/50">
            {containers?.length > 0 ? (
              containers.map((container) => (
                <tr key={container.id} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="p-4 text-neutral-500 font-mono">{container.id}</td>
                  <td className="p-4 font-medium text-neutral-200 truncate max-w-[150px]">{container.name}</td>
                  <td className="p-4 text-right font-mono text-emerald-400 capitalize">{container.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-8 text-center text-neutral-500">No active Docker containers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
