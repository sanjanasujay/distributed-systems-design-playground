'use client';

import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface ServiceNodeData {
  label: string;
  latency?: number;
}

function borderColor(latency: number): string {
  if (latency < 100)  return '#22c55e';
  if (latency <= 200) return '#eab308';
  return '#ef4444';
}

function badgeClass(latency: number): string {
  if (latency < 100)  return 'bg-green-100 text-green-700';
  if (latency <= 200) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export default function ServiceNode({ data }: NodeProps<ServiceNodeData>) {
  const hasLatency = data.latency !== undefined;
  const border = hasLatency ? `2px solid ${borderColor(data.latency!)}` : '1px solid #d1d5db';

  return (
    <div
      style={{ border }}
      className="bg-white rounded-md px-3 py-2 shadow-sm min-w-[120px] text-center"
    >
      <Handle type="target" position={Position.Top} />

      <p className="text-xs font-medium text-gray-800 leading-tight">{data.label}</p>

      {hasLatency && (
        <span className={`mt-1 inline-block text-[10px] font-semibold rounded px-1.5 py-0.5 ${badgeClass(data.latency!)}`}>
          {Math.round(data.latency!)} ms
        </span>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
