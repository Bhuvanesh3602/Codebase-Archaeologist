#!/bin/bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
: "${GCP_REGION:=europe-west1}"
: "${GCS_DOCS_BUCKET:?GCS_DOCS_BUCKET is required}"
: "${VERTEX_DECISION_INDEX_ID:?VERTEX_DECISION_INDEX_ID is required}"
: "${VERTEX_INTERNAL_INDEX_ID:?VERTEX_INTERNAL_INDEX_ID is required}"
: "${VERTEX_SEARCH_ENDPOINT:?VERTEX_SEARCH_ENDPOINT is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Deploying Red Team Agent ==="

echo "--- Deploying backend ---"
gcloud run deploy redteam-backend \
  --source "$ROOT_DIR/backend" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "GCP_PROJECT_ID=$GCP_PROJECT_ID,GCP_REGION=$GCP_REGION,GCS_DOCS_BUCKET=$GCS_DOCS_BUCKET,VERTEX_DECISION_INDEX_ID=$VERTEX_DECISION_INDEX_ID,VERTEX_INTERNAL_INDEX_ID=$VERTEX_INTERNAL_INDEX_ID,VERTEX_SEARCH_ENDPOINT=$VERTEX_SEARCH_ENDPOINT"

BACKEND_URL=$(gcloud run services describe redteam-backend \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --format "value(status.url)")

echo "Backend deployed at: $BACKEND_URL"

echo "--- Deploying frontend ---"
gcloud run deploy redteam-frontend \
  --source "$ROOT_DIR/frontend" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --allow-unauthenticated \
  --set-env-vars "VITE_API_URL=$BACKEND_URL"

FRONTEND_URL=$(gcloud run services describe redteam-frontend \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT_ID" \
  --format "value(status.url)")

echo ""
echo "=== Deploy complete ==="
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
