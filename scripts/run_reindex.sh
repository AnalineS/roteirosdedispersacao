#!/bin/bash
# Temporary script to run re-indexing with GitHub secrets

echo "🔐 Loading Supabase credentials from GitHub secrets..."

export SUPABASE_URL=$(gh secret get SUPABASE_PROJECT_URL)
export SUPABASE_SERVICE_KEY=$(gh secret get SUPABASE_API_KEY)

echo "✅ Credentials loaded"
echo "🚀 Starting re-indexing process..."

cd "$(dirname "$0")"
python reindex_supabase_e5.py
