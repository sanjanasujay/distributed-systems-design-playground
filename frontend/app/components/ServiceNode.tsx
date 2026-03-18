'use client';

import { useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface ServiceNodeData {
  label: string;
  latency?: number;
  overloaded?: boolean;
  impacted?: boolean;
}

function borderColor(latency: number, overloaded: boolean, impacted: boolean): string {
  if (overloaded)     return '#dc2626';
  if (impacted)       return '#f97316';
  if (latency < 100)  return '#22c55e';
  if (latency <= 200) return '#eab308';
  return '#ef4444';
}

function badgeClass(latency: number, overloaded: boolean, impacted: boolean): string {
  if (overloaded)     return 'bg-red-100 text-red-700';
  if (impacted)       return 'bg-orange-100 text-orange-700';
  if (latency < 100)  return 'bg-green-100 text-green-700';
  if (latency <= 200) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

const DURATION = 600; // ms

function useAnimatedValue(target: number | undefined): number | undefined {
  const [display, setDisplay] = useState<number | undefined>(target);
  const rafRef  = useRef<number | null>(null);
  const fromRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (target === undefined) { setDisplay(undefined); return; }

    fromRef.current  = display ?? target;
    startRef.current = performance.now();

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const progress = Math.min((now - startRef.current) / DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(fromRef.current + (target! - fromRef.current) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

export default function ServiceNode({ data }: NodeProps<ServiceNodeData>) {
  const hasLatency  = data.latency !== undefined;
  const overloaded  = !!data.overloaded;
  const impacted    = !!data.impacted && !overloaded;
  const displayed   = useAnimatedValue(data.latency);

  const border = hasLatency
    ? `${overloaded ? '3px' : '2px'} solid ${borderColor(data.latency!, overloaded, impacted)}`
    : '1px solid #d1d5db';
  const bg = overloaded ? '#fef2f2' : impacted ? '#fff7ed' : 'white';

  return (
    <div
      style={{
        border,
        background: bg,
        transition: 'border 0.6s ease, background-color 0.6s ease',
      }}
      className="rounded-md px-3 py-2 shadow-sm min-w-[120px] text-center"
    >
      <Handle type="target" position={Position.Top} />

      <p className="text-xs font-medium text-gray-800 leading-tight">{data.label}</p>

      {hasLatency && displayed !== undefined && (
        <span className={`mt-1 inline-block text-[10px] font-semibold rounded px-1.5 py-0.5 transition-colors duration-500 ${badgeClass(data.latency!, overloaded, impacted)}`}>
          {displayed} ms{overloaded ? ' ⚠' : impacted ? ' ↗' : ''}
        </span>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
