# Calculator — React + Go

A small full-stack calculator for the Sezzle Team. The React (TypeScript) frontend sends every calculation to a Go REST API, which validates input and does the math.

**Operations:** add, subtract, multiply, divide, plus the optional power, square root and percentage.

```
.
├── backend/    Go 1.22, standard library only
│   ├── cmd/server/             entrypoint (config, graceful shutdown)
│   └── internal/
│       ├── calculator/         pure arithmetic + edge cases (no HTTP)
│       └── api/                HTTP handlers, JSON in/out
├── frontend/   React 18+, TypeScript, Vite, Vitest
├── docs/coverage.md            coverage report
├── Dockerfile                  full stack in one image
.
used
```

## Quick start

### Option A — Docker (full stack)

```bash
docker build -t calculator .
docker run --rm -p 8080:8080 calculator
# open http://localhost:8080
```

### Option B — local development

Requires Go ≥ 1.22 and Node ≥ 20. Use two terminals:

```bash
# terminal 1 — API on :8080
cd backend && go run ./cmd/server

# terminal 2 — UI on :5173 (Vite proxies /api to :8080)
cd frontend && npm install && npm run dev
# open http://localhost:5173
```

`make backend`, `make frontend`, `make test`, `make coverage` and `make docker` are shortcuts for the above.

### Configuration

| Env var      | Default   | Purpose                                                                       |
| ------------ | --------- | ----------------------------------------------------------------------------- |
| `PORT`       | `8080`    | HTTP port                                                                     |
| `STATIC_DIR` | _(unset)_ | If set, serves the built frontend from this folder (the Docker image sets it) |

## Tests and coverage

```bash
cd backend  && go test ./... -cover          # Go
cd frontend && npm test                      # Vitest
cd frontend && npm run test:coverage         # with coverage (HTML in frontend/coverage)
```

Latest numbers are in [`docs/coverage.md`](docs/coverage.md): calculator package 100%, API package 97%, frontend 100% of statements / ~99% branches. The backend's overall `go test` total is lower only because `cmd/server/main.go` (process wiring and signal handling) is intentionally not unit tested.

## API

### `POST /api/v1/calculate`

| Field       | Type   | Notes                                                                                                                |
| ----------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `operation` | string | `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, `percentage`                                               |
| `a`         | number | Required. First operand (for `percentage`: the percent)                                                              |
| `b`         | number | Required, except for `sqrt` (ignored there). Second operand (for `power`: the exponent; for `percentage`: the value) |

`percentage` means _"a percent of b"_: `{a: 15, b: 200}` → `30`.

**Success — `200`**

```bash
curl -s -X POST localhost:8080/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"power","a":2,"b":10}'
# {"result":1024}

curl -s -X POST localhost:8080/api/v1/calculate -d '{"operation":"sqrt","a":144}'
# {"result":12}

curl -s -X POST localhost:8080/api/v1/calculate -d '{"operation":"percentage","a":15,"b":200}'
# {"result":30}
```

**Errors — always `{"error": "<message>"}`**

| Status | When                                                                                              | Example message                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Body is not usable: empty, malformed JSON, wrong types, unknown fields, missing `a`, body > 1 KiB | `operand "a" is required`                                                                                                                                        |
| `422`  | Well-formed request that cannot be computed                                                       | `division by zero`, `square root of a negative number`, `unknown operation: "mod"`, `missing operand: "add" needs two operands`, `result is not a finite number` |
| `405`  | Wrong HTTP method                                                                                 | —                                                                                                                                                                |

```bash
curl -s -w ' [%{http_code}]\n' -X POST localhost:8080/api/v1/calculate \
  -d '{"operation":"divide","a":1,"b":0}'
# {"error":"division by zero"} [422]
```

### `GET /api/v1/health`

Returns `{"status":"ok"}`. Used by the Docker `HEALTHCHECK`.

## Design decisions and assumptions

**One generic endpoint instead of one per operation.** `POST /api/v1/calculate` with an `operation` field keeps the surface small, and adding an operation is a constant, one-place change (a `case` in the calculator plus a row in the frontend's operation list). Trade-off: less "RESTful" than `/add`, `/divide`, but a calculator is an RPC-style action, not a resource.

**Business logic is separated from HTTP.** `calculator.Calculate` is a pure function returning sentinel errors (`errors.Is`-friendly). The `api` package only translates: bad request → `400`, calculation that can't be performed → `422`. This makes the math trivially table-testable and keeps the handler thin.

**Standard library only in Go.** Go 1.22's `ServeMux` supports method-and-path patterns, so no router dependency is needed. Fewer dependencies means less to maintain and audit.

**Edge cases are handled by the backend, not just the UI.** Division by zero, negative square roots, missing operands, `NaN`/`Inf` inputs, and _results_ that overflow or are undefined (`1e308 × 10`, `0^-1`, `(-8)^0.5`) are all rejected, because JSON cannot represent `Inf`/`NaN`. Requests are size-limited, reject unknown fields and trailing data, and use `*float64` so a missing operand is distinguishable from `0`.

**The frontend validates too, but the backend is the authority.** The UI gives instant field-level feedback (empty, non-numeric, ÷0, √ of negative) and never sends obviously invalid requests, while any error the server returns is shown as-is. Numeric input uses a strict regex on a text field with `inputMode="decimal"` rather than `type="number"`, whose browser behaviour (silent empty values, locale quirks) makes validation unreliable.

**Floating point.** The API returns plain IEEE-754 doubles (`0.1 + 0.2` → `0.30000000000000004`). The UI rounds the _display_ to 12 significant digits (`0.3`). Arbitrary-precision arithmetic was considered out of scope for this exercise.

**Form-style UI over a keypad.** Choosing an operation and filling two labelled fields is simpler, more accessible (real labels, `aria-invalid`, `role="alert"`, live result region) and easier to test than emulating a pocket calculator with expression parsing. The second field disappears for square root. Layout is mobile-first (2-column operation grid on narrow screens, 16px+ inputs to avoid iOS zoom) and respects the system dark mode.

**Single deployable.** In Docker, the Go binary also serves the built React files, so there is no nginx, no CORS configuration, and one port. In development, Vite proxies `/api` to Go for the same effect. The final image is Alpine-based and runs as a non-root user.

**Assumptions:** percentage is "a percent of b"; there is no expression chaining or calculation history; no authentication or rate limiting (out of scope for a stateless calculator, would be added at a gateway).

## What I would do next

Add an API integration test in CI (GitHub Actions running `go test`, `npm test`, and a Docker build), decimal-precision arithmetic, and a small e2e test with Playwright.
