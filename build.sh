#!/bin/bash
# Render build script

echo "🚀 Starting Render build for Roteiro de Dispensação..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p data/knowledge_base

# Verify installation
echo "✅ Verifying installation..."
python -c "import flask; print(f'Flask version: {flask.__version__}')"
python -c "import langflow; print(f'LangFlow version: {langflow.__version__}')" || echo "⚠️ LangFlow not installed"
python -c "import openai; print(f'OpenAI version: {openai.__version__}')"

# Check if knowledge base exists
if [ -f "data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md" ]; then
    echo "✅ Knowledge base file found"
else
    echo "⚠️ Knowledge base file not found"
fi

echo "🎯 Build completed successfully!"