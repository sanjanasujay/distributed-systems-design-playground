'use client';

import { useState } from 'react';
import type { Edge, Node } from 'reactflow';

interface SimulationResult {
  bottleneck: string;
  avgLatencyMs: number;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
}

function runSimulation(nodes: Node[], edges: Edge[], rps: number): SimulationResult {
  if (nodes.length === 0) {
    return { bottleneck: 'N/A', avgLatencyMs: 0 };
  }

  // Count incoming edges per node to find the most-connected (bottleneck) node
  const inDegree: Record<string, number> = Object.fromEntries(nodes.map((n) => [n.id, 0]));
  for (const edge of edges) {
    if (edge.target in inDegree) inDegree[edge.target]++;
  }

  const bottleneckId = Object.entries(inDegree).sort((a, b) => b[1] - a[1])[0][0];
  const bottleneckNode = nodes.find((n) => n.id === bottleneckId);
  const avgLatencyMs = Math.round(10 + (rps / 100) * 5 * (inDegree[bottleneckId] + 1));

  return {
    bottleneck: String(bottleneckNode?.data?.label ?? bottleneckId),
    avgLatencyMs,
  };
}

export default function SimulationSidebar({ nodes, edges }: Props) {
  const [rps, setRps] = useState(1000);
  const [bottleneck, setBottleneck] = useState<string>('—');
  const [avgLatencyMs, setAvgLatencyMs] = useState<number | null>(null);

  return (
    <aside className="w-72 shrink-0 border-l bg-white flex flex-col gap-6 p-5">
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
          const r = runSimulation(nodes, edges, rps);
          setBottleneck(r.bottleneck);
          setAvgLatencyMs(r.avgLatencyMs);
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
    </aside>
  );
}
