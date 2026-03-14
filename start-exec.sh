#!/bin/bash
if ! pgrep -f exec-server.py > /dev/null; then
  ufw allow 8889/tcp
  nohup python3 /var/www/iped/exec-server.py > /var/www/iped/exec.log 2>&1 &
  rm -f /etc/cron.d/iped-exec
fi
