.PHONY: backend frontend test coverage docker

backend:   ## run the API on :8080
	cd backend && go run ./cmd/server

frontend:  ## run the UI on :5173 (proxies /api to :8080)
	cd frontend && npm install && npm run dev

test:      ## run all unit tests
	cd backend && go test ./...
	cd frontend && npm install && npm test

coverage:  ## coverage for both layers
	cd backend && go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out
	cd frontend && npm install && npm run test:coverage

docker:    ## build and run the full stack on :8080
	docker build -t calculator . && docker run --rm -p 8080:8080 calculator
