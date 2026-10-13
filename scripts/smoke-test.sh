#!/bin/sh
# Calls /api/health THROUGH Nginx, from inside the client container, so it works
# even when Jenkins itself runs in a container. Retries for about 90 seconds.
COMPOSE="${COMPOSE:-docker-compose -f docker-compose.prod.yml}"

i=1
while [ "$i" -le 18 ]; do
  if $COMPOSE exec -T client wget -q -O- http://localhost/api/health | grep -q '"status":"ok"'; then
    echo "Smoke test passed: API and database are healthy."
    exit 0
  fi
  echo "Attempt $i/18: not ready yet..."
  i=$((i + 1))
  sleep 5
done

echo "Smoke test FAILED. Last container logs:"
$COMPOSE logs --tail=40
exit 1
