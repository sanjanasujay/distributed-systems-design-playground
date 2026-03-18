'use client';

import { useState } from 'react';
import type { Edge, Node } from 'reactflow';

// ── Backend contract ──────────────────────────────────────────────────────────

interface SimReqNode  { id: string; label: string; type: string; }
interface SimReqEdge  { source: string; target: string; }
interface SimRequest  { nodes: SimReqNode[]; edges: SimReqEdge[]; traffic: number; failureMode: string; }

interface NodeResult  { id: string; label: string; latency: number; overloaded: boolean; }
interface SimResponse { bottleneck: string; averageLatency: number; nodes: NodeResult[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function latencyColor(latency: number): string {
  return latency < 100 ? 'bg-green-500' : latency <= 200 ? 'bg-yellow-400' : 'bg-red-500';
}

type FailureMode = 'none' | 'databaseFailure' | 'serviceCrash' | 'networkDelay';

const FAILURE_MODES: { value: FailureMode; label: string }[] = [
  { value: 'none',            label: 'None'            },
  { value: 'databaseFailure', label: 'Database Failure' },
  { value: 'serviceCrash',    label: 'Service Crash'   },
  { value: 'networkDelay',    label: 'Network Delay'   },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  nodes: Node[];
  edges: Edge[];
  onSimulate: (resultsById: Record<string, { latency: number; overloaded: boolean }>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SimulationSidebar({ nodes, edges, onSimulate }: Props) {
  const [rps, setRps]               = useState(1000);
  const [failureMode, setFailureMode] = useState<FailureMode>('none');
  const [result, setResult]           = useState<SimResponse | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSimulate() {
    if (nodes.length === 0) return;

    const body: SimRequest = {
      traffic: rps,
      failureMode,
      nodes: nodes.map((n) => ({
        id:    n.id,
        label: String(n.data?.label ?? n.id),
        type:  String(n.data?.type ?? 'service'),
      })),
      edges: edges.map((e) => ({ source: e.source, target: e.target })),
    };

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:8080/simulate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data: SimResponse = await res.json();
      setResult(data);
      onSimulate(Object.fromEntries(data.nodes.map((n) => [n.id, { latency: n.latency, overloaded: n.overloaded }])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="w-72 shrink-0 border-l bg-white flex flex-col gap-6 p-5 overflow-y-auto">

      {/* Traffic input */}
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

        <label className="block text-xs text-gray-500 mt-3 mb-1">Failure Mode</label>
        <select
          value={failureMode}
          onChange={(e) => setFailureMode(e.target.value as FailureMode)}
          className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {FAILURE_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Simulate button */}
      <button
        onClick={handleSimulate}
        disabled={loading || nodes.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors"
      >
        {loading ? 'Simulating…' : 'Simulate'}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Results</h3>
        <div>
          <p className="text-xs text-gray-500">Bottleneck Node</p>
          <p className="text-sm font-semibold text-red-600 mt-0.5">{result?.bottleneck ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Latency</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {result ? `${Math.round(result.averageLatency)} ms` : '—'}
          </p>
        </div>
      </div>

      {/* Node breakdown */}
      {result && result.nodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Node Breakdown</h3>
          {result.nodes.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${latencyColor(row.latency)}`} />
                <span className="text-xs text-gray-700 truncate">{row.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="text-xs font-medium text-gray-800">{Math.round(row.latency)} ms</span>
                {row.overloaded && (
                  <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded px-1">
                    overloaded
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
