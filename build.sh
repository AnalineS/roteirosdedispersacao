#!/bin/bash
# Render build script for Full Stack App

echo "🚀 Starting Render build for Roteiro de Dispensação (Full Stack)..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Build frontend
echo "📦 Installing frontend dependencies..."
cd src/frontend
npm install

echo "🔨 Building React frontend..."
VITE_API_URL=/api npm run build

echo "✅ Frontend build complete!"
ls -la dist/

cd ../..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data/knowledge_base

# Verify installation
echo "✅ Verifying installation..."
python -c "import flask; print(f'Flask version: {flask.__version__}')"
python -c "import openai; print(f'OpenAI version: {openai.__version__}')"

# Check if knowledge base exists
if [ -f "data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md" ]; then
    echo "✅ Knowledge base file found"
else
    echo "⚠️ Knowledge base file not found"
fi

# Check if frontend was built
if [ -f "src/frontend/dist/index.html" ]; then
    echo "✅ Frontend build found"
else
    echo "⚠️ Frontend build not found"
fi

echo "🎯 Full Stack build completed successfully!"