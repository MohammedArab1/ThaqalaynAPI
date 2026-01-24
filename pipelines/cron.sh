#!/bin/bash
set -e

cd /app/V2

make scrape_all datapath=./ThaqalaynData

# cd /app/V2/ThaqalaynData

# git add -A

# # Only commit if there are changes
# if ! git diff --cached --quiet; then
#   git commit -m "Automated data update"
#   git push
# fi
EOF