'use client';

import { useCallback, useState } from 'react';
import SimulationSidebar from './SimulationSidebar';
import ServiceNode from './ServiceNode';
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

const nodeTypes = { serviceNode: ServiceNode };

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
      type: 'serviceNode',
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: { label: `${entry.label} ${nodeId - 1}`, type: entry.type },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [selectedType, setNodes]);

  const applyLatencyStyles = useCallback((resultsById: Record<string, { latency: number; overloaded: boolean }>) => {
    setNodes((nds) => {
      // Step 1: apply latency + overloaded from backend results
      const updated = nds.map((n) => {
        const result = resultsById[n.id];
        if (!result) return { ...n, data: { ...n.data, latency: undefined, overloaded: false, impacted: false } };
        return { ...n, data: { ...n.data, latency: result.latency, overloaded: result.overloaded, impacted: false } };
      });

      // Step 2: BFS from every overloaded node to find downstream impacted nodes
      const overloadedIds = new Set(updated.filter((n) => n.data.overloaded).map((n) => n.id));
      const impactedIds   = new Set<string>();

      const queue = [...overloadedIds];
      while (queue.length > 0) {
        const current = queue.shift()!;
        edges.forEach((e) => {
          if (e.source === current && !overloadedIds.has(e.target) && !impactedIds.has(e.target)) {
            impactedIds.add(e.target);
            queue.push(e.target);
          }
        });
      }

      return updated.map((n) =>
        impactedIds.has(n.id) ? { ...n, data: { ...n.data, impacted: true } } : n
      );
    });
  }, [setNodes, edges]);

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
            nodeTypes={nodeTypes}
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
