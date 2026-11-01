# One-shot data loader. Not part of docker-compose: run it by hand.
#
# Build:
#   docker build -t thaqalayn-db-load ./docker/db-load
#
# Run (after `docker compose up -d`):
#   docker run --rm --network thaqalayn_net \
#     -e DATABASE_URL='postgresql://thaqalayn:PASSWORD@postgres:5432/thaqalayn' \
#     -v /root/ThaqalaynAPI/V2:/data:ro \
#     thaqalayn-db-load bash Deploy/load.sh all
#
# `load.sh` runs `\copy ... FROM PROGRAM 'jq ...'`. That program runs on the
# client side, so jq must exist here, not in the Postgres container.
FROM postgres:17-alpine

RUN apk add --no-cache bash jq

WORKDIR /data
