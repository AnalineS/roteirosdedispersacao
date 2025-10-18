#!/bin/bash

# ============================================================================
# Local Development Environment Setup
# Configures environment variables for local development
# Usage: source scripts/setup-local-env.sh
# ============================================================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}💻 Setting up Local Development Environment${NC}"
echo "=============================================="

# Firebase Configuration (Public - same as GitHub Variables)
export NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyBKA9wgGfN6cNYKLQ-96F9Y5BZdM8QmF4U"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="red-truck-468923-s4.firebaseapp.com"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="red-truck-468923-s4"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="red-truck-468923-s4.appspot.com"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
export NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abc123def456ghi789"

# Local API Configuration
export NEXT_PUBLIC_API_URL="http://localhost:5000"
export NEXT_PUBLIC_ENVIRONMENT="development"

# Development Features
export NEXT_PUBLIC_AUTH_ENABLED="true"
export NEXT_PUBLIC_FIRESTORE_ENABLED="true"
export NEXT_PUBLIC_OFFLINE_MODE="true"
export NEXT_PUBLIC_DEBUG="true"
export NEXT_PUBLIC_VERBOSE_LOGGING="true"

# Cache Configuration
export NEXT_PUBLIC_FIRESTORE_CACHE_ENABLED="true"
export NEXT_PUBLIC_ADVANCED_CACHE="true"
export NEXT_PUBLIC_CACHE_TTL_MINUTES="60"
export NEXT_PUBLIC_LOCAL_CACHE_MAX_SIZE="50"
export NEXT_PUBLIC_HYBRID_CACHE_STRATEGY="memory_first"
export NEXT_PUBLIC_FIRESTORE_COLLECTION_CACHE="cache"

# RAG and Embeddings Configuration
export NEXT_PUBLIC_EMBEDDINGS_ENABLED="true"
export NEXT_PUBLIC_RAG_AVAILABLE="true"
export NEXT_PUBLIC_EMBEDDING_MODEL="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
export NEXT_PUBLIC_EMBEDDING_DEVICE="cpu"
export NEXT_PUBLIC_EMBEDDINGS_MAX_LENGTH="512"
export NEXT_PUBLIC_EMBEDDING_BATCH_SIZE="32"
export NEXT_PUBLIC_VECTOR_DB_PATH="./cache/embeddings"
export NEXT_PUBLIC_SEMANTIC_SIMILARITY_THRESHOLD="0.7"

# Security Middleware Configuration (Development)
export NEXT_PUBLIC_SECURITY_MIDDLEWARE_ENABLED="false"
export NEXT_PUBLIC_RATE_LIMIT_ENABLED="false"
export NEXT_PUBLIC_RATE_LIMIT_DEFAULT="200/hour"
export NEXT_PUBLIC_RATE_LIMIT_CHAT="50/hour"
export NEXT_PUBLIC_MAX_CONTENT_LENGTH="16777216"
export NEXT_PUBLIC_SESSION_COOKIE_SECURE="false"
export NEXT_PUBLIC_SESSION_COOKIE_HTTPONLY="true"

# Backend Development Configuration
export FLASK_ENV="development"
export FLASK_DEBUG="true"
export FLASK_RUN_HOST="0.0.0.0"
export FLASK_RUN_PORT="5000"
export FLASK_RUN_RELOAD="true"

# Medical Platform Specific
export MEDICAL_MODE="development"
export LGPD_COMPLIANCE_REQUIRED="false"
export PCDT_VERSION="2022"

echo -e "${GREEN}✅ Local environment variables configured${NC}"
echo ""
echo -e "${YELLOW}📋 Configuration Summary:${NC}"
echo "  • Firebase: Configured with project red-truck-468923-s4"
echo "  • API URL: http://localhost:5000"
echo "  • Environment: development"
echo "  • Cache: Firestore hybrid cache enabled"
echo "  • RAG: Embeddings and semantic search enabled"
echo "  • Security: Development mode (relaxed)"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Frontend: cd apps/frontend-nextjs && npm run dev"
echo "  2. Backend: cd apps/backend && python main.py"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  • Run this script with: source scripts/setup-local-env.sh"
echo "  • Frontend will run on: http://localhost:3000"
echo "  • Backend will run on: http://localhost:5000"
echo "  • Hot reload is enabled for both"
echo ""
echo -e "${GREEN}🏥 Medical Platform Development Environment Ready!${NC}"