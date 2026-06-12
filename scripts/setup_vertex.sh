#!/bin/bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
: "${GCP_REGION:=europe-west1}"

echo "=== Setting up Vertex AI Vector Search indexes ==="

DECISION_INDEX=$(gcloud ai indexes create \
  --display-name="redteam-decision-index" \
  --description="Layer 1: strategic decision document" \
  --metadata-schema-uri="gs://google-cloud-aiplatform/schema/matchingengine/metadata/nearest_neighbor_search_1.0.0.yaml" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --format="value(name)")

INTERNAL_INDEX=$(gcloud ai indexes create \
  --display-name="redteam-internal-index" \
  --description="Layer 2: internal company documents" \
  --metadata-schema-uri="gs://google-cloud-aiplatform/schema/matchingengine/metadata/nearest_neighbor_search_1.0.0.yaml" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --format="value(name)")

echo ""
echo "=== Indexes created ==="
echo "VERTEX_DECISION_INDEX_ID=${DECISION_INDEX##*/}"
echo "VERTEX_INTERNAL_INDEX_ID=${INTERNAL_INDEX##*/}"
echo ""
echo "Add these to your .env file and deploy index endpoints."
