package simulator

type Node struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

type Edge struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

type SimulationRequest struct {
	Nodes       []Node `json:"nodes"`
	Edges       []Edge `json:"edges"`
	Traffic     int    `json:"traffic"`
	FailureMode string `json:"failureMode"`
}

type NodeResult struct {
	ID         string  `json:"id"`
	Label      string  `json:"label"`
	Latency    float64 `json:"latency"`
	Overloaded bool    `json:"overloaded"`
}

type SimulationResponse struct {
	Bottleneck     string       `json:"bottleneck"`
	AverageLatency float64      `json:"averageLatency"`
	Nodes          []NodeResult `json:"nodes"`
}
