'use client';

import { useState } from 'react';
import type { Node } from 'reactflow';

interface SimulationResult {
  bottleneck: string;
  avgLatencyMs: number;
}

interface Props {
  nodes: Node[];
  onSimulate: (latencyById: Record<string, number>) => void;
}

export const BASE_LATENCY: Record<string, number> = {
  'API Gateway': 50,
  'Service': 120,
  'Queue': 180,
  'Database': 300,
  'Cache': 80,
};

export function nodeLatency(label: string): number {
  const type = label.replace(/\s+\d+$/, '');
  return BASE_LATENCY[type] ?? 100;
}

function runSimulation(nodes: Node[], rps: number): SimulationResult {
  if (nodes.length === 0) return { bottleneck: 'N/A', avgLatencyMs: 0 };

  const latencies = nodes.map((n) => ({
    label: String(n.data?.label ?? n.id),
    latency: nodeLatency(String(n.data?.label ?? '')),
  }));

  const bottleneckEntry = latencies.reduce((max, cur) => cur.latency > max.latency ? cur : max);

  // Scale average latency with rps: every 1000 req/s adds 10% overhead
  const baseAvg = latencies.reduce((sum, n) => sum + n.latency, 0) / latencies.length;
  const avgLatencyMs = Math.round(baseAvg * (1 + (rps / 1000) * 0.1));

  return { bottleneck: bottleneckEntry.label, avgLatencyMs };
}

interface NodeRow {
  label: string;
  latency: number;
}

export default function SimulationSidebar({ nodes, onSimulate }: Props) {
  const [rps, setRps] = useState(1000);
  const [bottleneck, setBottleneck] = useState<string>('—');
  const [avgLatencyMs, setAvgLatencyMs] = useState<number | null>(null);
  const [nodeRows, setNodeRows] = useState<NodeRow[]>([]);

  return (
    <aside className="w-72 shrink-0 border-l bg-white flex flex-col gap-6 p-5 overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Simulation</h2>
        <label className="block text-xs text-gray-500 mb-1">Traffic (req/s)</label>
        <input
          type="number"
          min={1}
          value={rps}
          onChange={(e) => setRps(Math.max(1, Number(e.target.value)))}
          className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={() => {
          const latencyById = Object.fromEntries(
            nodes.map((n) => [n.id, nodeLatency(String(n.data?.label ?? ''))])
          );
          onSimulate(latencyById);
          const r = runSimulation(nodes, rps);
          setBottleneck(r.bottleneck);
          setAvgLatencyMs(r.avgLatencyMs);
          setNodeRows(
            nodes.map((n) => ({
              label: String(n.data?.label ?? n.id),
              latency: nodeLatency(String(n.data?.label ?? '')),
            }))
          );
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors"
      >
        Simulate
      </button>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Results</h3>
        <div>
          <p className="text-xs text-gray-500">Bottleneck Node</p>
          <p className="text-sm font-semibold text-red-600 mt-0.5">{bottleneck}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Latency</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {avgLatencyMs !== null ? `${avgLatencyMs} ms` : '—'}
          </p>
        </div>
      </div>

      {nodeRows.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Node Breakdown</h3>
          {nodeRows.map((row) => {
            const overloaded = row.latency > 200;
            return (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                      row.latency < 100
                        ? 'bg-green-500'
                        : row.latency <= 200
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-gray-700 truncate">{row.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-xs font-medium text-gray-800">{row.latency} ms</span>
                  {overloaded && (
                    <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded px-1">overloaded</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
