package main

import (
	"encoding/json"
	"log"
	"net/http"

	"distributed-systems-design-playground/backend/internal/simulator"
)

func simulateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req simulator.SimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	resp := simulator.Simulate(req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/simulate", simulateHandler)

	log.Println("server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
