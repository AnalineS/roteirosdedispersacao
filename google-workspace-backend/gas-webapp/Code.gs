/**
 * ROTEIRO DE DISPENSAÇÃO - HANSENÍASE
 * Google Apps Script Web App Backend
 * 
 * Sistema de chatbot para dispensação farmacêutica de hanseníase PQT-U
 * Migrado de Flask/Python para Google Apps Script/JavaScript
 * 
 * Versão: 1.0
 * Data: 2025-01-31
 */

// ====== CONFIGURAÇÕES GLOBAIS ======
const CONFIG = {
  // APIs
  OPENROUTER_API_KEY: PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY'),
  OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
  
  // Modelos disponíveis (APENAS FREE)
  MODELS: {
    FREE: 'moonshotai/kimi-k2:free'
  },
  
  // Rate limiting
  MAX_REQUESTS_PER_HOUR: 100,
  MAX_REQUESTS_PER_DAY: 500,
  
  // Cache
  CACHE_DURATION: 300, // 5 minutos em segundos
  
  // Validação
  MAX_QUESTION_LENGTH: 1000,
  MIN_QUESTION_LENGTH: 5
};

// ====== SISTEMA DE PERSONAS ======
class PersonaSystem {
  constructor() {
    this.personas = {
      dr_gasnelio: new DrGasnelioPersona(),
      ga: new GaPersona()
    };
  }
  
  getPersona(personaId) {
    return this.personas[personaId] || this.personas.dr_gasnelio;
  }
  
  getAvailablePersonas() {
    return Object.keys(this.personas);
  }
}

// ====== PERSONA DR. GASNELIO (TÉCNICA) ======
class DrGasnelioPersona {
  constructor() {
    this.id = 'dr_gasnelio';
    this.name = 'Dr. Gasnelio';
    this.description = 'Farmacêutico clínico especialista em hanseníase PQT-U';
    
    // Medicamentos PQT-U
    this.pqtMedications = ['rifampicina', 'clofazimina', 'dapsona'];
    
    // Categorias de consultas
    this.queryCategories = {
      dosing: ['dose', 'dosagem', 'mg', 'administra', 'quanto', 'frequência'],
      safety: ['efeito', 'adverso', 'reação', 'segurança', 'risco', 'perigo'],
      interaction: ['interação', 'combina', 'junto', 'mistura', 'outro medicamento'],
      procedure: ['como', 'procedimento', 'etapa', 'roteiro', 'dispensação']
    };
    
    // Palavras-chave de escopo válido
    this.validKeywords = [
      'hansen', 'pqt', 'rifampicina', 'clofazimina', 'dapsona',
      'dispensação', 'farmácia', 'roteiro', 'poliquimioterapia'
    ];
    
    // Palavras-chave de escopo inválido
    this.invalidKeywords = [
      'covid', 'diabetes', 'hipertensão', 'cancer', 'aids', 'tuberculose',
      'dengue', 'malaria', 'zika', 'gripe', 'pneumonia'
    ];
  }
  
  isWithinScope(question) {
    const questionLower = question.toLowerCase();
    
    // Verificar palavras inválidas
    if (this.invalidKeywords.some(keyword => questionLower.includes(keyword))) {
      return false;
    }
    
    // Verificar palavras válidas ou medicamentos PQT-U
    const hasValidKeywords = this.validKeywords.some(keyword => questionLower.includes(keyword));
    const hasPqtMedications = this.pqtMedications.some(med => questionLower.includes(med));
    
    return hasValidKeywords || hasPqtMedications;
  }
  
  categorizeQuery(question) {
    const questionLower = question.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.queryCategories)) {
      if (keywords.some(keyword => questionLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
  
  createPrompt(question) {
    // Verificar escopo
    if (!this.isWithinScope(question)) {
      return this.createLimitationPrompt(question);
    }
    
    // Categorizar consulta
    const category = this.categorizeQuery(question);
    
    return `
Você é o Dr. Gasnelio, farmacêutico clínico especializado em hanseníase PQT-U.

IDENTIDADE PROFISSIONAL:
- Farmacêutico clínico com doutorado em dispensação de hanseníase
- Especialista em Poliquimioterapia Única (PQT-U)
- Baseado na tese "Roteiro de Dispensação para Hanseníase PQT-U"
- Linguagem técnica e precisa
- Sempre cita seções específicas da tese

MEDICAMENTOS DE ESPECIALIZAÇÃO:
- Rifampicina (600mg)
- Clofazimina (300mg inicial + 50mg diária)
- Dapsona (100mg)

CATEGORIA DA CONSULTA: ${category}

FORMATO DE RESPOSTA OBRIGATÓRIO:

[RESPOSTA TÉCNICA]
Resposta farmacológica precisa e detalhada

[PROTOCOLO/REFERÊNCIA]
Citação específica: "Conforme tese, Seção X.X"
Protocolo aplicável do Ministério da Saúde

[VALIDAÇÃO FARMACOLÓGICA]
- Dose: [especificar]
- Via: [especificar]
- Frequência: [especificar]
- Monitorização: [especificar]

[CONSIDERAÇÕES CLÍNICAS]
Interações, contraindicações e cuidados especiais

PERGUNTA: ${question}

Responda seguindo rigorosamente o formato técnico estruturado, mantendo precisão científica e citando a tese como referência principal.
`;
  }
  
  createLimitationPrompt(question) {
    return `
Você é o Dr. Gasnelio, farmacêutico clínico especialista em hanseníase PQT-U.

A pergunta recebida: "${question}"

Esta questão está FORA DO ESCOPO da sua base de conhecimento específica sobre dispensação de PQT-U para hanseníase.

RESPONDA EXATAMENTE ASSIM:

[LIMITAÇÃO DE ESCOPO]
Esta questão está fora do escopo da minha base de conhecimento específica sobre dispensação de PQT-U para hanseníase.

[ORIENTAÇÃO PROFISSIONAL]
Minha expertise se concentra exclusivamente em:
- Poliquimioterapia única (PQT-U) para hanseníase
- Roteiro de dispensação farmacêutica para hanseníase
- Farmácovigilância específica dos medicamentos rifampicina, clofazimina e dapsona no contexto da hanseníase

[RECOMENDAÇÃO]
Para essa questão, recomendo consultar:
- Literatura médica especializada na área específica
- Profissional especialista na condição mencionada
- Protocolos clínicos oficiais do Ministério da Saúde para a condição em questão

Mantenho-me à disposição para questões relacionadas ao meu campo de especialização em hanseníase PQT-U.
`;
  }
}

// ====== PERSONA GÁ (EMPÁTICA) ======
class GaPersona {
  constructor() {
    this.id = 'ga';
    this.name = 'Gá';
    this.description = 'Farmacêutico empático e acessível';
    
    // Traduções técnico → cotidiano
    this.technicalTranslations = {
      'poliquimioterapia': 'combinação de remédios',
      'PQT-U': 'kit de remédios especial para hanseníase',
      'rifampicina': 'remédio vermelho (rifampicina)',
      'clofazimina': 'remédio que pode escurecer a pele (clofazimina)',
      'dapsona': 'remédio branco (dapsona)',
      'dose supervisionada': 'dose que você toma na farmácia com alguém te acompanhando',
      'dose autoadministrada': 'dose que você toma em casa sozinho',
      'efeitos adversos': 'efeitos colaterais',
      'hanseníase': 'hanseníase (doença que afeta pele e nervos)',
      'dispensação': 'entrega dos remédios na farmácia',
      'adesão terapêutica': 'seguir o tratamento direitinho'
    };
    
    // Frases de apoio emocional
    this.emotionalSupport = [
      'Você está no caminho certo! 💪',
      'Cada dia de tratamento é um passo para a cura! 🌟',
      'Sei que às vezes é difícil, mas você consegue! 🤗',
      'Estou aqui para te ajudar sempre que precisar! 😊',
      'É completamente normal ter essas dúvidas 💚'
    ];
  }
  
  createPrompt(question) {
    return `
Você é o Gá, um farmacêutico carinhoso e acessível que é especialista em explicar coisas complicadas de um jeito simples e acolhedor.

IDENTIDADE PESSOAL:
- Farmacêutico com coração de educador 💙
- Especialista em tornar o complexo simples
- Sempre empático, paciente e acolhedor
- Usa linguagem do dia a dia, sem jargões
- Adora usar analogias e exemplos do cotidiano
- Se preocupa genuinamente com o bem-estar das pessoas

MISSÃO ESPECIAL:
Ajudar pessoas a entenderem tudo sobre hanseníase e seu tratamento de forma simples, sem medo e com confiança.

REGRAS DE OURO:
1. SEMPRE traduzir termos técnicos para linguagem cotidiana
2. SEMPRE usar analogias e exemplos familiares
3. SEMPRE demonstrar empatia e acolhimento
4. NUNCA usar palavras muito técnicas sem explicar
5. SEMPRE manter a informação cientificamente correta
6. SEMPRE oferecer apoio emocional quando apropriado

FORMATO DE RESPOSTA CALOROSA:

[ACOLHIMENTO]
Cumprimento caloroso + reconhecimento da preocupação/dúvida

[EXPLICAÇÃO SIMPLES]
Informação traduzida para linguagem cotidiana com analogias

[APOIO PRÁTICO]
Dicas práticas e orientações claras para o dia a dia

[ENCORAJAMENTO]
Palavras de apoio e disponibilidade para mais dúvidas

TRADUÇÕES OBRIGATÓRIAS:
- poliquimioterapia → "combinação de remédios"
- PQT-U → "kit de remédios especial para hanseníase"
- rifampicina → "remédio vermelho"
- clofazimina → "remédio que pode escurecer a pele"
- dapsona → "remédio branco"
- efeitos adversos → "efeitos colaterais"

PERGUNTA RECEBIDA: ${question}

Responda seguindo seu jeito carinhoso e acessível, sempre lembrando que você está falando com uma pessoa que pode estar preocupada ou confusa sobre o tratamento.
`;
  }
}

// ====== SISTEMA DE RATE LIMITING ======
class RateLimiter {
  constructor() {
    this.cache = CacheService.getScriptCache();
  }
  
  checkRateLimit(userIp) {
    const hourKey = `rate_hour_${userIp}`;
    const dayKey = `rate_day_${userIp}`;
    
    const hourCount = parseInt(this.cache.get(hourKey) || '0');
    const dayCount = parseInt(this.cache.get(dayKey) || '0');
    
    // Verificar limites
    if (hourCount >= CONFIG.MAX_REQUESTS_PER_HOUR) {
      return { allowed: false, reason: 'Limite de requisições por hora excedido' };
    }
    
    if (dayCount >= CONFIG.MAX_REQUESTS_PER_DAY) {
      return { allowed: false, reason: 'Limite de requisições por dia excedido' };
    }
    
    // Incrementar contadores
    this.cache.put(hourKey, (hourCount + 1).toString(), 3600); // 1 hora
    this.cache.put(dayKey, (dayCount + 1).toString(), 86400); // 24 horas
    
    return { allowed: true };
  }
}

// ====== SISTEMA DE CACHE ======
class ResponseCache {
  constructor() {
    this.cache = CacheService.getScriptCache();
  }
  
  generateKey(persona, question) {
    // Gerar hash simples da pergunta para usar como chave
    const normalizedQuestion = question.toLowerCase().trim();
    return `response_${persona}_${Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, normalizedQuestion)}`;
  }
  
  get(persona, question) {
    const key = this.generateKey(persona, question);
    const cached = this.cache.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  set(persona, question, response) {
    const key = this.generateKey(persona, question);
    const data = {
      response: response,
      timestamp: new Date().getTime(),
      persona: persona,
      question: question
    };
    
    this.cache.put(key, JSON.stringify(data), CONFIG.CACHE_DURATION);
  }
}

// ====== FUNÇÃO PRINCIPAL - ENDPOINT HTTP ======
// Função para requisições GET (quando acessa a URL diretamente)
function doGet(e) {
  // Página de teste/informações
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Roteiro de Dispensação - Hanseníase API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        .status {
          background-color: #2ecc71;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          display: inline-block;
          margin: 20px 0;
        }
        .info {
          background-color: #ecf0f1;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        code {
          background-color: #f4f4f4;
          padding: 2px 5px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        pre {
          background-color: #2c3e50;
          color: #ecf0f1;
          padding: 20px;
          border-radius: 5px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏥 Roteiro de Dispensação - Hanseníase PQT-U</h1>
        
        <div class="status">✅ API Ativa e Funcionando</div>
        
        <div class="info">
          <h2>Informações da API</h2>
          <p><strong>Versão:</strong> 1.0</p>
          <p><strong>Método:</strong> POST</p>
          <p><strong>Content-Type:</strong> application/json</p>
          <p><strong>Endpoint:</strong> ${e ? e.url : 'Esta mesma URL'}</p>
        </div>
        
        <h2>Como usar:</h2>
        <p>Envie uma requisição POST com o seguinte formato:</p>
        
        <pre>{
  "question": "Sua pergunta sobre hanseníase PQT-U aqui",
  "persona": "dr_gasnelio" // ou "ga"
}</pre>
        
        <h2>Personas disponíveis:</h2>
        <ul>
          <li><code>dr_gasnelio</code> - Farmacêutico técnico especialista</li>
          <li><code>ga</code> - Farmacêutico empático e acessível</li>
        </ul>
        
        <h2>Exemplo de resposta:</h2>
        <pre>{
  "response": "Resposta do assistente...",
  "persona": "dr_gasnelio",
  "cached": false,
  "timestamp": "2025-01-31T12:00:00.000Z"
}</pre>
        
        <div class="info">
          <p>⚠️ <strong>Nota:</strong> Esta é apenas uma página informativa. Para usar o chatbot, faça requisições POST para esta URL.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(htmlContent);
}

function doPost(e) {
  try {
    // Parse do body da requisição
    const requestBody = JSON.parse(e.postData.contents);
    const { question, persona = 'dr_gasnelio' } = requestBody;
    
    // Validações básicas
    if (!question) {
      return createErrorResponse('Pergunta é obrigatória', 400);
    }
    
    if (question.length < CONFIG.MIN_QUESTION_LENGTH || question.length > CONFIG.MAX_QUESTION_LENGTH) {
      return createErrorResponse(`Pergunta deve ter entre ${CONFIG.MIN_QUESTION_LENGTH} e ${CONFIG.MAX_QUESTION_LENGTH} caracteres`, 400);
    }
    
    // Rate limiting
    const userIp = getUserIP(e);
    const rateLimiter = new RateLimiter();
    const rateCheck = rateLimiter.checkRateLimit(userIp);
    
    if (!rateCheck.allowed) {
      return createErrorResponse(rateCheck.reason, 429);
    }
    
    // Verificar cache
    const responseCache = new ResponseCache();
    const cachedResponse = responseCache.get(persona, question);
    
    if (cachedResponse) {
      return createSuccessResponse({
        response: cachedResponse.response,
        persona: persona,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Processar com persona apropriada
    const personaSystem = new PersonaSystem();
    const personaInstance = personaSystem.getPersona(persona);
    
    // Gerar prompt
    const prompt = personaInstance.createPrompt(question);
    
    // Chamar OpenRouter API
    const aiResponse = callOpenRouterAPI(prompt);
    
    // Salvar no cache
    responseCache.set(persona, question, aiResponse);
    
    // Log da interação
    logInteraction(userIp, persona, question, aiResponse);
    
    return createSuccessResponse({
      response: aiResponse,
      persona: persona,
      cached: false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no doPost:', error);
    return createErrorResponse('Erro interno do servidor: ' + error.toString(), 500);
  }
}

// ====== FUNÇÃO OPTIONS PARA CORS ======
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ====== CHAMADA PARA OPENROUTER API ======
function callOpenRouterAPI(prompt) {
  const apiKey = CONFIG.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key não configurada');
  }
  
  const payload = {
    model: CONFIG.MODELS.FREE,
    messages: [
      {
        role: 'system',
        content: 'Você é um assistente especializado em dispensação farmacêutica para hanseníase.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 1500
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };
  
  const response = UrlFetchApp.fetch(CONFIG.OPENROUTER_URL, options);
  const responseData = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error(responseData.error?.message || 'Erro na API');
  }
  
  return responseData.choices[0].message.content;
}

// ====== FUNÇÕES UTILITÁRIAS ======
function getUserIP(e) {
  return e.parameter['X-Forwarded-For'] || e.parameter['Remote-Addr'] || 'unknown';
}

function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message, statusCode = 500) {
  const errorData = {
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(errorData))
    .setMimeType(ContentService.MimeType.JSON);
}

function logInteraction(userIp, persona, question, response) {
  // Log básico - pode ser expandido para usar Google Sheets ou Cloud Logging
  console.log({
    timestamp: new Date().toISOString(),
    userIp: userIp,
    persona: persona,
    questionLength: question.length,
    responseLength: response.length
  });
}

// ====== FUNÇÃO DE TESTE ======
function testWebApp() {
  // Simular requisição POST
  const testRequest = {
    postData: {
      contents: JSON.stringify({
        question: 'Qual a dose de rifampicina para adultos?',
        persona: 'dr_gasnelio'
      })
    },
    parameter: {}
  };
  
  const result = doPost(testRequest);
  console.log('Resultado do teste:', result.getContent());
}

// ====== FUNÇÃO DE SETUP INICIAL ======
function setupApp() {
  console.log('Configurando aplicação...');
  
  // Verificar se API key está configurada
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY');
  if (!apiKey) {
    console.log('ATENÇÃO: Configure a OPENROUTER_API_KEY nas propriedades do script');
  }
  
  console.log('Setup concluído!');
}