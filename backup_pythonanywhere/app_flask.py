from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timedelta
from collections import defaultdict
import os
import requests

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configurar OpenRouter
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
API_BASE = "https://openrouter.ai/api/v1/chat/completions"

# Controle de requisições por IP
request_counts = defaultdict(list)
MAX_REQUESTS_PER_HOUR = 100

def check_rate_limit(ip):
    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    request_counts[ip] = [req_time for req_time in request_counts[ip] if req_time > hour_ago]
    if len(request_counts[ip]) >= MAX_REQUESTS_PER_HOUR:
        return False
    request_counts[ip].append(now)
    return True

# HTML simples para interface
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Roteiro de Dispensação - Hanseníase</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; }
        .chat-box { border: 1px solid #ddd; padding: 20px; margin: 20px 0; min-height: 100px; }
        button { background: #2563eb; color: white; padding: 10px 20px; border: none; cursor: pointer; }
        input, textarea { width: 100%; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🏥 Roteiro de Dispensação - Hanseníase</h1>
    <p>Sistema de apoio à dispensação farmacêutica</p>
    
    <form id="chatForm">
        <textarea id="question" placeholder="Digite sua pergunta..." rows="3"></textarea>
        <button type="submit">Enviar</button>
    </form>
    
    <div class="chat-box" id="response"></div>
    
    <script>
        document.getElementById('chatForm').onsubmit = async (e) => {
            e.preventDefault();
            const question = document.getElementById('question').value;
            const responseDiv = document.getElementById('response');
            responseDiv.innerHTML = 'Processando...';
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({question: question})
                });
                const data = await response.json();
                responseDiv.innerHTML = data.response || data.error;
            } catch (error) {
                responseDiv.innerHTML = 'Erro: ' + error.message;
            }
        };
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Verificar rate limit
        client_ip = request.headers.get('X-Real-IP', request.remote_addr)
        if not check_rate_limit(client_ip):
            return jsonify({"error": "Limite de requisições excedido. Tente novamente em 1 hora."}), 429
        
        data = request.json
        question = data.get('question', '')
        
        if not OPENROUTER_API_KEY:
            return jsonify({"error": "API key não configurada"}), 500
        
        # Chamar OpenRouter
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mistralai/mistral-7b-instruct:free",
            "messages": [
                {"role": "system", "content": "Você é um assistente especializado em dispensação farmacêutica para hanseníase."},
                {"role": "user", "content": question}
            ]
        }
        
        response = requests.post(API_BASE, json=payload, headers=headers)
        result = response.json()
        
        if response.status_code == 200:
            answer = result['choices'][0]['message']['content']
            return jsonify({"response": answer})
        else:
            return jsonify({"error": result.get('error', {}).get('message', 'Erro na API')}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)