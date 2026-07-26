#!/usr/bin/env bash

set -Eeuo pipefail

readonly compose_file="compose.prod.yaml"
readonly env_file=".env"
readonly frontend_health_url="http://localhost/healthz"
readonly backend_health_url="http://localhost/api/health/live"
readonly -a compose_command=(
  docker compose
  --env-file "$env_file"
  -f "$compose_file"
)

info() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf '\nError: %s\n' "$1" >&2
  exit 1
}

check_health() {
  local service_name=$1
  local health_url=$2
  local attempt

  for attempt in {1..12}; do
    if curl --fail --silent --max-time 5 "$health_url" >/dev/null; then
      printf '%s health check passed: %s\n' "$service_name" "$health_url"
      return 0
    fi
    sleep 5
  done

  fail "$service_name health check failed: $health_url"
}

[[ -f "$compose_file" ]] \
  || fail "$compose_file was not found. Run this script from the repository root."
[[ -f "$env_file" ]] \
  || fail "$env_file was not found. Create the production environment file first."
command -v docker >/dev/null 2>&1 || fail "Docker is not installed or not on PATH."
docker compose version >/dev/null 2>&1 || fail "Docker Compose is not available."
command -v curl >/dev/null 2>&1 || fail "curl is not installed or not on PATH."

info "Pulling the latest production images"
"${compose_command[@]}" pull

info "Updating the production services"
"${compose_command[@]}" up -d --remove-orphans

info "Waiting briefly for services to initialize"
sleep 5

info "Production service status"
"${compose_command[@]}" ps

info "Checking production health endpoints"
check_health "Frontend" "$frontend_health_url"
check_health "Backend" "$backend_health_url"

info "Production deployment completed successfully"
