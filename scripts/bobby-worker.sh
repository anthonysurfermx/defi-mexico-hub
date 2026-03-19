#!/bin/bash
# ============================================================
# Bobby Autonomous Worker — runs on droplet every 8h
# Triggers: market cycle → debate → digest
# Alternates: English morning, Spanish afternoon, English night
# ============================================================

set -euo pipefail

LOG="/var/log/bobby-worker.log"
ENDPOINT="https://defimexico.org/api/bobby-cycle"
FALLBACK="https://defi-mexico-hub.vercel.app/api/bobby-cycle"

# Determine language based on UTC hour
HOUR=$(date -u +%H)
if [ "$HOUR" -lt 12 ]; then
  LANG_CODE="en"
  KIND="morning"
elif [ "$HOUR" -lt 20 ]; then
  LANG_CODE="es"
  KIND="scheduled"
else
  LANG_CODE="en"
  KIND="scheduled"
fi

echo "[$(date -u)] Starting Bobby cycle: lang=$LANG_CODE kind=$KIND" >> "$LOG"

# Try primary endpoint, fallback if needed
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 120 \
  -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"language\": \"$LANG_CODE\", \"kind\": \"$KIND\"}" 2>&1) || true

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "[$(date -u)] Primary failed ($HTTP_CODE), trying fallback..." >> "$LOG"
  RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 120 \
    -X POST "$FALLBACK" \
    -H "Content-Type: application/json" \
    -d "{\"language\": \"$LANG_CODE\", \"kind\": \"$KIND\"}" 2>&1) || true
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)
fi

if [ "$HTTP_CODE" = "200" ]; then
  echo "[$(date -u)] Cycle OK: $BODY" >> "$LOG"
else
  echo "[$(date -u)] Cycle FAILED ($HTTP_CODE): $BODY" >> "$LOG"
fi
