#!/usr/bin/env bash

set -euo pipefail

timestamp() {
  date -u +"%Y%m%dT%H%M%SZ"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_cmd pg_dump
require_cmd gzip
require_cmd find

require_env BACKUP_DATABASE_URL

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
BACKUP_PREFIX="${BACKUP_PREFIX:-hospitality}"
EXTERNAL_COPY_DIR="${EXTERNAL_COPY_DIR:-}"

mkdir -p "$BACKUP_DIR"

stamp="$(timestamp)"
base_name="${BACKUP_PREFIX}-${stamp}"
archive_path="${BACKUP_DIR}/${base_name}.dump"
compressed_path="${archive_path}.gz"
manifest_path="${BACKUP_DIR}/${base_name}.sha256"
latest_link="${BACKUP_DIR}/latest.dump.gz"

echo "Creating PostgreSQL backup at ${compressed_path}"
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --dbname="${BACKUP_DATABASE_URL}" \
  --file="${archive_path}"

gzip -f "${archive_path}"
sha256sum "${compressed_path}" > "${manifest_path}"
ln -sfn "$(basename "${compressed_path}")" "${latest_link}"

if [[ -n "${EXTERNAL_COPY_DIR}" ]]; then
  mkdir -p "${EXTERNAL_COPY_DIR}"
  cp "${compressed_path}" "${EXTERNAL_COPY_DIR}/"
  cp "${manifest_path}" "${EXTERNAL_COPY_DIR}/"
fi

find "${BACKUP_DIR}" -type f \( -name "${BACKUP_PREFIX}-*.dump.gz" -o -name "${BACKUP_PREFIX}-*.sha256" \) -mtime +"${RETENTION_DAYS}" -delete

echo "Backup complete"
echo "Archive: ${compressed_path}"
echo "Checksum: ${manifest_path}"
