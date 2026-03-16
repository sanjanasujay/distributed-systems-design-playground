'use client';

import { useCallback, useState } from 'react';
import SimulationSidebar from './SimulationSidebar';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SERVICE_TYPES: { label: string; type: string }[] = [
  { label: 'API Gateway', type: 'apiGateway' },
  { label: 'Service',     type: 'service'    },
  { label: 'Database',    type: 'database'   },
  { label: 'Queue',       type: 'queue'      },
  { label: 'Cache',       type: 'cache'      },
];

let nodeId = 1;

export default function DesignCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedType, setSelectedType] = useState(SERVICE_TYPES[0].label);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const id = `node-${nodeId++}`;
    const entry = SERVICE_TYPES.find((s) => s.label === selectedType) ?? SERVICE_TYPES[0];
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: { label: `${entry.label} ${nodeId - 1}`, type: entry.type },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [selectedType, setNodes]);

  const applyLatencyStyles = useCallback((latencyById: Record<string, number>) => {
    setNodes((nds) =>
      nds.map((n) => {
        const latency = latencyById[n.id];
        if (latency === undefined) return n;
        const color = latency < 100 ? '#22c55e' : latency <= 200 ? '#eab308' : '#ef4444';
        return { ...n, style: { ...n.style, border: `2px solid ${color}` } };
      })
    );
  }, [setNodes]);

  return (
    <div className="flex h-screen">
      {/* Canvas area */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-3 p-3 border-b bg-white">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t.label} value={t.label}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={addNode}
            className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
          >
            + Add Node
          </button>
          <span className="text-xs text-gray-500">
            Drag between node handles to connect services
          </span>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Right sidebar */}
      <SimulationSidebar nodes={nodes} edges={edges} onSimulate={applyLatencyStyles} />
    </div>
  );
}
