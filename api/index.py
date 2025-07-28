from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        "message": "Roteiro de Dispensação API - Vercel",
        "version": "9.0.0",
        "status": "online"
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "platform": "vercel",
        "version": "9.0.0"
    })

# Para Vercel
if __name__ == '__main__':
    app.run()