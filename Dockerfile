# --- 1. Build the React app -------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- 2. Build the Go server (static binary) ---------------------------------
FROM golang:1.23-alpine AS api
WORKDIR /src
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# --- 3. Tiny runtime image: one binary serves the API and the built UI -------
FROM alpine:3.20
RUN adduser -D -u 10001 app
USER app
COPY --from=api /server /server
COPY --from=web /web/dist /static
ENV PORT=8080 STATIC_DIR=/static
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/api/v1/health || exit 1
ENTRYPOINT ["/server"]
