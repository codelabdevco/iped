#!/bin/bash
# iPED Database Restore Script
# Usage: ./scripts/restore.sh backups/iped_20260320_020000.tar.gz

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE="$1"
TEMP_DIR="/tmp/iped_restore_$$"

mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the backup directory
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "iped" | head -1)
if [ -z "$BACKUP_DIR" ]; then
  BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 2 -type d | tail -1)
fi

# Copy to container and restore
docker compose cp "$TEMP_DIR" "mongo:/tmp/restore"
docker compose exec -T mongo mongorestore --db iped --drop "/tmp/restore/$(basename $TEMP_DIR)/iped" 2>/dev/null

rm -rf "$TEMP_DIR"
echo "Restore complete from: $BACKUP_FILE"
