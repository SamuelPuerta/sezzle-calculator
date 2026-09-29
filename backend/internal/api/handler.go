// Package api exposes the calculator over HTTP/JSON.
package api

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"

	"github.com/samuelpuerta/sezzle-calculator/backend/internal/calculator"
)

const maxBodyBytes = 1 << 10 // 1 KiB is plenty for {operation, a, b}

// CalculateRequest is the JSON body accepted by POST /api/v1/calculate.
// Operands are pointers so a missing field can be told apart from 0.
type CalculateRequest struct {
	Operation calculator.Operation `json:"operation"`
	A         *float64             `json:"a"`
	B         *float64             `json:"b,omitempty"`
}

// CalculateResponse is returned on success.
type CalculateResponse struct {
	Result float64 `json:"result"`
}

// ErrorResponse is returned on every failure.
type ErrorResponse struct {
	Error string `json:"error"`
}

// NewHandler wires the API routes. If staticDir is non-empty the built
// frontend is served from it, so one process serves the whole app.
func NewHandler(staticDir string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/calculate", calculate)
	mux.HandleFunc("GET /api/v1/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	if staticDir != "" {
		mux.Handle("/", http.FileServer(http.Dir(staticDir)))
	}
	return mux
}

func calculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	var req CalculateRequest
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+describeDecodeError(err))
		return
	}
	if dec.More() {
		writeError(w, http.StatusBadRequest, "invalid JSON body: unexpected trailing data")
		return
	}
	if req.A == nil {
		writeError(w, http.StatusBadRequest, "operand \"a\" is required")
		return
	}

	result, err := calculator.Calculate(req.Operation, *req.A, req.B)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, CalculateResponse{Result: result})
}

// describeDecodeError keeps client-facing messages short and stable.
func describeDecodeError(err error) string {
	var typeErr *json.UnmarshalTypeError
	switch {
	case errors.Is(err, io.EOF):
		return "body is empty"
	case errors.As(err, &typeErr):
		return "field \"" + typeErr.Field + "\" has the wrong type"
	default:
		return err.Error()
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, ErrorResponse{Error: msg})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write response: %v", err)
	}
}
