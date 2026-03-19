#!/bin/bash
# iPED Database Backup Script
# Usage: ./scripts/backup.sh
# Cron: 0 2 * * * /var/www/iped/scripts/backup.sh

BACKUP_DIR="/var/www/iped/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/iped_$DATE"

mkdir -p "$BACKUP_DIR"

# Dump from Docker container
docker compose exec -T mongo mongodump --db iped --out "/tmp/backup_$DATE" 2>/dev/null

# Copy from container to host
docker compose cp "mongo:/tmp/backup_$DATE" "$BACKUP_FILE"

# Compress
tar -czf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "iped_$DATE"
rm -rf "$BACKUP_FILE"

# Keep only last 7 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup complete: $BACKUP_FILE.tar.gz"
