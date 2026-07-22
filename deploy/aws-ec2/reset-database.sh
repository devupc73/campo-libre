#!/usr/bin/env sh
set -eu

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "No se encontró $ENV_FILE en $(pwd)" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "No se encontró $COMPOSE_FILE en $(pwd)" >&2
  exit 1
fi

echo "Deteniendo servicios y eliminando el volumen de PostgreSQL..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v --remove-orphans

echo "Levantando PostgreSQL y backend con una base vacía..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build postgres backend

echo "Esperando la inicialización de la base de datos..."
sleep 8

echo "Estado de servicios:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

echo "Base de datos reiniciada. Las tablas se recrean automáticamente al iniciar el backend."
