package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func do(t *testing.T, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	rec := httptest.NewRecorder()
	NewHandler("").ServeHTTP(rec, req)
	return rec
}

func TestCalculate(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantResult float64
		wantErr    string // substring; empty means success expected
	}{
		{"add", `{"operation":"add","a":2,"b":3}`, 200, 5, ""},
		{"subtract", `{"operation":"subtract","a":2,"b":3}`, 200, -1, ""},
		{"multiply", `{"operation":"multiply","a":4,"b":2.5}`, 200, 10, ""},
		{"divide", `{"operation":"divide","a":9,"b":3}`, 200, 3, ""},
		{"power", `{"operation":"power","a":2,"b":8}`, 200, 256, ""},
		{"sqrt without b", `{"operation":"sqrt","a":81}`, 200, 9, ""},
		{"percentage", `{"operation":"percentage","a":10,"b":50}`, 200, 5, ""},
		{"zero is a valid operand", `{"operation":"add","a":0,"b":0}`, 200, 0, ""},

		{"division by zero", `{"operation":"divide","a":1,"b":0}`, 422, 0, "division by zero"},
		{"negative sqrt", `{"operation":"sqrt","a":-1}`, 422, 0, "negative"},
		{"unknown operation", `{"operation":"mod","a":1,"b":2}`, 422, 0, "unknown operation"},
		{"missing b", `{"operation":"add","a":1}`, 422, 0, "missing operand"},
		{"overflow", `{"operation":"multiply","a":1e308,"b":10}`, 422, 0, "not a finite"},

		{"missing a", `{"operation":"add","b":1}`, 400, 0, "\"a\" is required"},
		{"empty body", ``, 400, 0, "empty"},
		{"malformed json", `{"operation":`, 400, 0, "invalid JSON"},
		{"wrong type", `{"operation":"add","a":"x","b":1}`, 400, 0, "wrong type"},
		{"unknown field", `{"operation":"add","a":1,"b":1,"c":2}`, 400, 0, "unknown field"},
		{"trailing data", `{"operation":"add","a":1,"b":1}{}`, 400, 0, "trailing"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := do(t, http.MethodPost, "/api/v1/calculate", tt.body)
			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, tt.wantStatus, rec.Body)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("content-type = %q", ct)
			}
			if tt.wantErr != "" {
				var e ErrorResponse
				if err := json.Unmarshal(rec.Body.Bytes(), &e); err != nil {
					t.Fatal(err)
				}
				if !strings.Contains(e.Error, tt.wantErr) {
					t.Errorf("error = %q, want it to contain %q", e.Error, tt.wantErr)
				}
				return
			}
			var res CalculateResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
				t.Fatal(err)
			}
			if res.Result != tt.wantResult {
				t.Errorf("result = %v, want %v", res.Result, tt.wantResult)
			}
		})
	}
}

func TestBodyTooLarge(t *testing.T) {
	body := `{"operation":"add","a":1,"b":1,"pad":"` + strings.Repeat("x", 2000) + `"}`
	rec := do(t, http.MethodPost, "/api/v1/calculate", body)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func TestMethodNotAllowed(t *testing.T) {
	rec := do(t, http.MethodGet, "/api/v1/calculate", "")
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", rec.Code)
	}
}

func TestHealth(t *testing.T) {
	rec := do(t, http.MethodGet, "/api/v1/health", "")
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "ok") {
		t.Errorf("unexpected response: %d %s", rec.Code, rec.Body)
	}
}

func TestServesStaticFiles(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<h1>hi</h1>"), 0o600); err != nil {
		t.Fatal(err)
	}
	rec := httptest.NewRecorder()
	NewHandler(dir).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "<h1>hi</h1>") {
		t.Errorf("unexpected response: %d %s", rec.Code, rec.Body)
	}
}
