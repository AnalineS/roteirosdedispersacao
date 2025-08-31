# [SECURITY] DOCUMENTAÇÃO DE SEGURANÇA - SISTEMA EDUCACIONAL MÉDICO

## [LIST] **INFORMAÇÕES GERAIS**

- **Sistema**: Roteiro de Dispensação - Hanseníase
- **Versão de Segurança**: 2.0 (Fase 4 - Security Middleware)
- **Data de Implementação**: 30/08/2025
- **Responsável**: Ana
- **Tipo de Sistema**: Educacional Médico (Dados Sensíveis)
- **Compliance**: LGPD/GDPR Ready

---

## [TARGET] **VISÃO GERAL DA SEGURANÇA**

O sistema implementa segurança **enterprise-grade** com foco em proteção de dados médicos educacionais. A arquitetura de segurança segue padrões internacionais OWASP e implementa proteções contra as principais vulnerabilidades conhecidas.

### **Componentes de Segurança Implementados**

1. **SecurityMiddleware** - Middleware principal de segurança
2. **AttackPatternDetector** - Detector de padrões de ataque
3. **IntelligentRateLimiter** - Rate limiting adaptativo
4. **Framework de Testes** - Suite automática de penetração

---

## [ALERT] **PADRÕES DE ATAQUES DETECTADOS**

### **1. SQL INJECTION**

#### **Descrição**
Tentativas de injeção de código SQL malicioso para acessar ou modificar dados do banco de dados.

#### **Padrões Detectados**
```sql
-- Bypass de autenticação
' OR '1'='1
admin'--
' OR 'a'='a

-- Extração de informações
' UNION SELECT null, version(), null--
' UNION SELECT 1,2,3--

-- Ataques de tempo
1' AND SLEEP(5)#
1; WAITFOR DELAY '00:00:05'--

-- Execução de comandos
'; DROP TABLE users; --
'; EXEC xp_cmdshell('dir'); --

-- Inserção de dados maliciosos
'; INSERT INTO users (username) VALUES ('hacker')--
```

#### **Como o Sistema Detecta**
- Análise de padrões regex em parâmetros GET/POST
- Detecção de palavras-chave SQL: `UNION`, `SELECT`, `INSERT`, `DROP`
- Identificação de caracteres especiais: aspas simples, ponto e vírgula
- Análise de funções do sistema: `version()`, `@@version`

#### **Resposta do Sistema**
- **Bloqueio**: HTTP 403 (Forbidden)
- **Log**: Evento de segurança com severity HIGH
- **Score**: Redução de 40 pontos no security score do IP
- **Tempo de Bloqueio**: 15 minutos (configurável)

### **2. CROSS-SITE SCRIPTING (XSS)**

#### **Descrição**
Injeção de scripts maliciosos que executam no navegador do usuário para roubar dados ou executar ações não autorizadas.

#### **Padrões Detectados**
```html
<!-- XSS básico -->
<script>alert('XSS')</script>

<!-- XSS via atributos -->
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>

<!-- XSS via JavaScript -->
javascript:alert('XSS')

<!-- XSS em iframes -->
<iframe src=javascript:alert('XSS')></iframe>

<!-- XSS via eventos -->
<body onload=alert('XSS')>
<input onfocus=alert('XSS') autofocus>

<!-- XSS em elementos HTML5 -->
<video><source onerror=alert('XSS')>
<details open ontoggle=alert('XSS')>
```

#### **Como o Sistema Detecta**
- Análise de tags HTML maliciosas: `<script>`, `<iframe>`, `<object>`
- Detecção de atributos perigosos: `onload`, `onerror`, `onfocus`
- Identificação de protocolos suspeitos: `javascript:`
- Análise de encoding: `data:.*base64`

#### **Resposta do Sistema**
- **Bloqueio**: HTTP 403 (Forbidden)
- **Headers**: Content Security Policy restritiva
- **Sanitização**: Remoção automática de tags perigosas
- **Log**: Evento com severity MEDIUM-HIGH

### **3. PATH TRAVERSAL**

#### **Descrição**
Tentativas de acesso a arquivos fora do diretório autorizado usando navegação de diretórios.

#### **Padrões Detectados**
```bash
# Navegação básica
../../../etc/passwd
..\\..\\..\\windows\\system32\\config\\sam

# Encoding URL
%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd
..%c0%af..%c0%af..%c0%afetc%c0%afpasswd

# Bypass de filtros
....//....//....//etc/passwd
../\\../\\../\\etc/passwd

# Null byte injection
../../../../../../etc/passwd%00
```

#### **Como o Sistema Detecta**
- Padrões de navegação de diretório: `../`, `..\\`
- Encoding suspeito: `%2e%2e%2f`, `%2e%2e%5c`
- Tentativas de bypass: `....//`, `..%252f`
- Arquivos sistema: `/etc/passwd`, `/windows/system32`

#### **Resposta do Sistema**
- **Bloqueio**: HTTP 403 (Forbidden)
- **Score**: Redução de 35 pontos no security score
- **Alertas**: Log imediato para análise

### **4. COMMAND INJECTION**

#### **Descrição**
Injeção de comandos do sistema operacional para execução não autorizada no servidor.

#### **Padrões Detectados**
```bash
# Separadores de comandos
; cat /etc/passwd
| whoami
&& dir

# Substitução de comandos
$(cat /etc/passwd)
`whoami`

# Comandos de sistema
; ls -la
; ping -c 4 google.com
; netstat -an

# Ferramentas de rede
; curl http://malicious-site.com
$(nc -lvp 4444)
```

#### **Como o Sistema Detecta**
- Separadores de comando: `;`, `|`, `&&`, `&`
- Substitução: `$()`, backticks
- Comandos suspeitos: `cat`, `ls`, `ping`, `curl`, `nc`
- Redirecionamento: `>`, `>>`, `<`

#### **Resposta do Sistema**
- **Bloqueio**: HTTP 403 (Forbidden)  
- **Score**: Redução de 45 pontos (alto risco)
- **Investigação**: Análise forense automática

### **5. USER-AGENT SUSPEITOS**

#### **Descrição**
Detecção de ferramentas automatizadas, bots maliciosos e scanners de vulnerabilidade.

#### **Padrões Detectados**
```
# Ferramentas de penetração
sqlmap/1.4.4#stable (http://sqlmap.org)
Burp Suite Professional
OWASP ZAP
Nikto/2.1.6

# Scanners automatizados
Nmap Scripting Engine
dirb 2.22
gobuster/3.1.0
wfuzz/2.4.5

# User-agents genéricos
Python-urllib/3.7
Wget/1.20.3
curl/7.68.0

# User-agents vazios ou muito curtos
""
"test"
"curl"
```

#### **Como o Sistema Detecta**
- Lista negra de ferramentas conhecidas
- User-agents muito genéricos ou vazios
- Padrões de bots: `bot`, `crawler`, `spider`
- Comprimento suspeito: < 10 caracteres

#### **Resposta do Sistema**
- **Bloqueio**: HTTP 403 (Forbidden)
- **Score**: Redução de 20 pontos
- **Categoria**: Classificação como "suspicious"

---

## ⚙️ **CONFIGURAÇÕES DE SEGURANÇA**

### **Rate Limiting - Configuração Moderada**
```env
RATE_LIMIT_DEFAULT=200/hour     # 200 requests por hora (geral)
RATE_LIMIT_CHAT=50/hour        # 50 requests por hora (chat)
SECURITY_AUTO_BLOCK_ENABLED=true
SECURITY_BLOCK_DURATION_MINUTES=15
SECURITY_MAX_VIOLATIONS=5
```

### **Headers de Segurança Obrigatórios**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: [configuração específica]
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### **Content Security Policy (CSP)**
```
# Para APIs (restritivo)
default-src 'none'; 
connect-src 'self'; 
frame-ancestors 'none'; 
base-uri 'none'

# Para Frontend (flexível para conteúdos externos)
default-src 'self'; 
script-src 'self' 'unsafe-inline' https://trusted-cdn.com; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
img-src 'self' data: https: blob:; 
font-src 'self' https://fonts.gstatic.com; 
connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai; 
media-src 'self' https:; 
frame-src 'none'
```

---

## [REPORT] **MÉTRICAS E MONITORAMENTO**

### **KPIs de Segurança**
- **Taxa de Detecção**: ≥95% (meta: detectar 95% dos ataques conhecidos)
- **Taxa de Falsos Positivos**: ≤0.1% (meta: menos de 1 em 1000 requests legítimos)
- **Tempo de Resposta**: ≤50ms adicional de latência
- **Score de Segurança**: ≥90/100 (sistema considerado seguro)

### **Alertas Automáticos**
- **Crítico**: Vulnerabilidades CRITICAL detectadas
- **Alto**: 5+ ataques do mesmo IP em 15 minutos
- **Médio**: User-agents suspeitos com alta frequência
- **Baixo**: Rate limiting ativado

### **Logs de Segurança**
```json
{
  "timestamp": "2025-08-30T14:30:00Z",
  "event_type": "sql_injection",
  "severity": "high", 
  "client_ip": "192.168.1.100",
  "endpoint": "/api/chat",
  "method": "POST",
  "blocked": true,
  "details": {
    "url_analysis": {...},
    "payload_analysis": {...},
    "rate_limit_info": {...}
  }
}
```

---

## [FIX] **RUNBOOK DE RESPOSTA A INCIDENTES**

### **Nível 1: Alertas Baixos/Médios**
1. **Monitorar** padrões nos logs
2. **Verificar** se é falso positivo
3. **Ajustar** filtros se necessário
4. **Documentar** padrões novos

### **Nível 2: Alertas Altos**
1. **Analisar** IP de origem imediatamente
2. **Verificar** outros sistemas afetados
3. **Bloquear** IP se necessário (manual)
4. **Notificar** equipe de segurança

### **Nível 3: Alertas Críticos**
1. **Isolamento** imediato do sistema
2. **Análise forense** completa
3. **Backup** de logs de segurança
4. **Comunicação** com stakeholders
5. **Investigação** de impacto nos dados

### **Comandos Úteis**

```bash
# Verificar logs de segurança
grep "SECURITY_EVENT" logs/security.log | tail -50

# Executar testes de penetração
python security-tests/main_security_test_suite.py --url https://seu-sistema.com

# Verificar health check com headers
curl -I https://seu-sistema.com/api/health

# Testar rate limiting
for i in {1..20}; do curl https://seu-sistema.com/api/health; done

# Verificar IPs bloqueados (precisa acesso ao sistema)
# Ver logs de "IP bloqueado" nos últimos 30 minutos
```

---

## [TEST] **EXECUTANDO TESTES DE SEGURANÇA**

### **Testes Automatizados**
```bash
# Suite completa de testes
cd apps/backend
python security-tests/main_security_test_suite.py

# Testes específicos com verbose
python security-tests/main_security_test_suite.py --url https://sistema.com --verbose

# Apenas testes de SQL Injection
python security-tests/main_security_test_suite.py --test-type sql_injection
```

### **Interpretação dos Resultados**
- **Score 95-100**: [OK] Sistema totalmente seguro
- **Score 80-94**: [WARNING] Segurança adequada, pequenos ajustes
- **Score 60-79**: 🔶 Atenção necessária, correções recomendadas
- **Score <60**: [ALERT] Risco alto, correções urgentes

### **Relatórios Gerados**
- `security-tests/reports/security_report_YYYYMMDD_HHMMSS.json`
- Contém análise detalhada de todos os testes
- Recomendações específicas em português
- Métricas de performance e segurança

---

## [LIST] **CHECKLIST DE VALIDAÇÃO**

### **Pré-Deploy (Obrigatório)**
- [ ] **Testes de penetração** executados com score ≥90
- [ ] **Headers de segurança** todos configurados
- [ ] **HTTPS obrigatório** funcionando
- [ ] **Rate limiting** testado e funcionando
- [ ] **Logs de segurança** sendo gerados corretamente

### **Pós-Deploy (24h)**
- [ ] **Monitoramento ativo** de alertas
- [ ] **Performance** não degradada (≤50ms adicional)
- [ ] **Falsos positivos** ≤0.1%
- [ ] **Sistema responsivo** sob carga normal
- [ ] **Backup de logs** funcionando

### **Revisão Semanal**
- [ ] **Análise de logs** de segurança
- [ ] **Atualização de padrões** de ataque
- [ ] **Ajuste de thresholds** se necessário
- [ ] **Teste de disaster recovery**
- [ ] **Revisão de acessos** administrativos

---

## [ALERT] **CONTATOS DE EMERGÊNCIA**

### **Incidentes de Segurança**
- **Responsável Principal**: Ana
- **Email de Alertas**: [configurar]
- **Escalação**: [definir processo]

### **Monitoramento**
- **Logs**: Cloud Console -> Security Logs
- **Métricas**: Dashboard interno
- **Alertas**: Email + Slack (se configurado)

---

## 📚 **REFERÊNCIAS E COMPLIANCE**

### **Frameworks de Segurança**
- OWASP Top 10 (2023)
- NIST Cybersecurity Framework
- ISO/IEC 27001:2013

### **Compliance Médico**
- LGPD (Lei Geral de Proteção de Dados)
- Resolução CFM nº 1.821/2007
- Portaria GM/MS nº 2.073/2011

### **Atualizações**
Este documento é atualizado sempre que:
- Novos padrões de ataque são descobertos
- Configurações de segurança são alteradas
- Vulnerabilidades são corrigidas
- Compliance requirements mudam

---

*Documento gerado automaticamente pelo Framework de Testes de Segurança*  
*Última atualização: 30/08/2025 - 14:30:00*  
*Versão: 2.0.0*