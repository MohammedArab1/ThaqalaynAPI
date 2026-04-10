#!/bin/bash
set -e

# Cron runs with a minimal environment. Pull runtime env injected by Docker
# from PID 1 (cron daemon), then export only what this pipeline needs.
if [ -r /proc/1/environ ]; then
	eval "$(tr '\0' '\n' < /proc/1/environ | grep -E '^(WEBAPP_URL|MONGODB_URI|GEMINI_API_KEY)=' | sed 's/^/export /')"
fi

cd /app/V2

make scrape_all datapath=./ThaqalaynData

# cd /app/V2/ThaqalaynData

# git add -A

# # Only commit if there are changes
# if ! git diff --cached --quiet; then
#   git commit -m "Automated data update"
#   git push
# fi