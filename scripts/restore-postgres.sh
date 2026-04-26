#!/usr/bin/env bash

set -euo pipefail

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

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.dump.gz|backup-file.dump>" >&2
  exit 1
fi

require_cmd pg_restore
require_cmd gunzip
require_env RESTORE_DATABASE_URL

backup_file="$1"

if [[ ! -f "${backup_file}" ]]; then
  echo "Backup file not found: ${backup_file}" >&2
  exit 1
fi

if [[ "${backup_file}" == *.gz ]]; then
  tmp_file="$(mktemp /tmp/hospitality-restore-XXXXXX.dump)"
  trap 'rm -f "${tmp_file}"' EXIT
  gunzip -c "${backup_file}" > "${tmp_file}"
  restore_source="${tmp_file}"
else
  restore_source="${backup_file}"
fi

echo "Restoring PostgreSQL backup from ${backup_file}"
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="${RESTORE_DATABASE_URL}" \
  "${restore_source}"

echo "Restore complete"
