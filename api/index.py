from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/')
@app.route('/health')
@app.route('/<path:path>')
def handle_all(path=None):
    """Handle all routes"""
    
    # Health check
    if request.path.endswith('/health') or path == 'health':
        return jsonify({
            "status": "healthy",
            "platform": "vercel",
            "version": "9.0.0",
            "timestamp": "2025-01-28"
        })
    
    # Default response
    return jsonify({
        "message": "Roteiro de Dispensação API - Vercel",
        "version": "9.0.0", 
        "status": "online",
        "endpoints": {
            "health": "/api/health"
        },
        "path_requested": request.path
    })

# Para Vercel
if __name__ == '__main__':
    app.run()