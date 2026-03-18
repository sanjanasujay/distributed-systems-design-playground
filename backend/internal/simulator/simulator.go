package simulator

func Simulate(req SimulationRequest) SimulationResponse {
	var results []NodeResult
	var totalLatency float64
	var bottleneck string
	var maxLatency float64

	for _, node := range req.Nodes {
		baseLatency := 50.0
		capacity := 1000.0

		switch node.Type {
		case "apiGateway":
			baseLatency = 20
			capacity = 1500
		case "service":
			baseLatency = 40
			capacity = 1000
		case "queue":
			baseLatency = 70
			capacity = 800
		case "database":
			baseLatency = 100
			capacity = 600
		case "cache":
			baseLatency = 15
			capacity = 2000
		}

		latency := baseLatency + (float64(req.Traffic)/capacity)*100
		overloaded := float64(req.Traffic) > capacity

		switch req.FailureMode {
		case "databaseFailure":
			if node.Type == "database" {
				latency = 1000 + baseLatency
				overloaded = true
			}
		case "serviceCrash":
			if node.Type == "service" {
				latency *= 3
				overloaded = true
			}
		case "networkDelay":
			latency += 100
		}

		result := NodeResult{
			ID:         node.ID,
			Label:      node.Label,
			Latency:    latency,
			Overloaded: overloaded,
		}

		results = append(results, result)
		totalLatency += latency

		if latency > maxLatency {
			maxLatency = latency
			bottleneck = node.Label
		}
	}

	avgLatency := totalLatency / float64(len(results))

	return SimulationResponse{
		Bottleneck:     bottleneck,
		AverageLatency: avgLatency,
		Nodes:          results,
	}
}
