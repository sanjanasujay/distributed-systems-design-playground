---

**Distributed Systems Design Playground  Project Overview**

---

**What is this project?**

This is an interactive distributed systems design tool that lets you visually design a system architecture by placing service nodes on a canvas, connecting them with edges, and then running a simulation to see how the system behaves under different traffic loads and failure conditions.

---

**Project Structure**

The project has two parts:

- `frontend/` — a Next.js + React application
- `backend/` — a Go HTTP server

---

**Frontend**

Built with Next.js 16, React 19, TypeScript, Tailwind CSS, and React Flow.

*Key files:*

`app/page.tsx`
The entry point. Just renders the `DesignCanvas` component.

`app/components/DesignCanvas.tsx`
The main component. It owns all React Flow state — nodes, edges, and the selected service type. Responsibilities:
- Renders the top toolbar with a service type dropdown and Add Node button
- Creates new nodes with a `serviceNode` type and stores `data.label` and `data.type` on each
- Defines `applyLatencyStyles` — called after simulation to write `latency`, `overloaded`, and `impacted` into each node's data
- Runs a BFS from every overloaded node along edges to find downstream impacted nodes
- Passes nodes and edges to `SimulationSidebar`

`app/components/ServiceNode.tsx`
The custom React Flow node component. Renders:
- The node label
- A colour-coded latency badge (green under 100ms, yellow 100–200ms, red over 200ms)
- A stronger red treatment (thicker border, red-tinted background) for overloaded nodes
- An orange treatment for downstream impacted nodes
- Smooth CSS transitions on border and background colour changes
- An animated number counter for the latency value using `requestAnimationFrame`

`app/components/SimulationSidebar.tsx`
The right sidebar. Contains:
- Traffic input (defaults to 1000 req/s)
- Failure mode dropdown (None, Database Failure, Service Crash, Network Delay)
- Simulate button — POSTs to the Go backend at `http://localhost:8080/simulate`
- Results panel — bottleneck node and average latency from the backend response
- System Metrics panel — total nodes, overloaded count, and system health status (Healthy / Degraded / Critical)
- Node Breakdown list — per-node latency, colour dot, and overloaded badge
- Export Architecture button — downloads the current nodes and edges as `architecture.json`

---

**Backend**

Built with Go, using only the standard library.

*Key files:*

`cmd/server/main.go`
Starts an HTTP server on port 8080. Defines a CORS middleware that allows requests from `localhost:3000`. Registers the `/simulate` POST endpoint.

`internal/simulator/types.go`
Defines the request and response types:
- `SimulationRequest` — nodes, edges, traffic (int), failureMode (string)
- `SimulationResponse` — bottleneck (string), averageLatency (float64), nodes (array of NodeResult)
- `NodeResult` — id, label, latency, overloaded

`internal/simulator/simulator.go`
The simulation engine. For each node it:
1. Looks up the node type to get a base latency and capacity
2. Computes latency as `baseLatency + (traffic / capacity) * 100`
3. Marks the node as overloaded if `traffic > capacity`
4. Applies failure mode overrides:
   - `databaseFailure` — database nodes get latency set to 1000+ ms and marked overloaded
   - `serviceCrash` — service nodes get latency tripled and marked overloaded
   - `networkDelay` — all nodes get 100ms added
5. Tracks the highest latency node as the bottleneck
6. Returns the average latency across all nodes

*Node profiles:*

| Type | Base Latency | Capacity |
|---|---|---|
| API Gateway | 20ms | 1500 |
| Service | 40ms | 1000 |
| Queue | 70ms | 800 |
| Database | 100ms | 600 |
| Cache | 15ms | 2000 |

---

**How it works end to end**

1. User opens `http://localhost:3000`
2. User selects a service type and clicks Add Node — a node appears on the canvas
3. User drags from one node's handle to another to create a connection (edge)
4. User sets traffic (req/s) and optionally selects a failure mode
5. User clicks Simulate — the frontend POSTs the current graph to `http://localhost:8080/simulate`
6. The Go backend computes latency per node, applies failure modes, and returns results
7. The frontend updates each node's colour and latency badge based on the response
8. Overloaded nodes turn red; downstream nodes turn orange; the sidebar shows the bottleneck, average latency, and system health
9. User can click Export Architecture to download the graph as JSON

---

**How to run it**

```
# Terminal 1 — backend
cd backend
go run cmd/server/main.go

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.
---