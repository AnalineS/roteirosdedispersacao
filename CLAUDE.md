# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive educational platform for hanseníase (leprosy) medication dispensing guidance, featuring two specialized AI assistants: Dr. Gasnelio (technical pharmacist) and Gá (empathetic assistant). The system includes both frontend applications and a sophisticated backend API with RAG capabilities.

## Repository Structure

The project uses a monorepo structure with multiple specialized applications:

```
roteiro-dispensacao/
├── apps/
│   ├── backend/                 # Flask API with AI personas
│   └── frontend-nextjs/        # Active Next.js application
├── data/                      # Knowledge base files
├── docs/                      # Documentation
└── qa-reports/               # Quality assurance reports
```

## Development Commands

### Backend (Python Flask)
```bash
cd apps/backend
pip install -r requirements.txt
python main.py                 # Development server
```

### Frontend Next.js (Primary)
```bash
cd apps/frontend-nextjs
npm install
npm run dev                    # Development (port 3000)
npm run build                  # Production build
npm run start                  # Production server
npm run lint                   # ESLint
npm run type-check            # TypeScript validation
```

## Architecture Overview

### Backend Architecture (Real Stack)
- **Flask 3.1 API** with comprehensive security measures + blueprints modulares
- **OpenRouter Integration**: Llama 3.2 and Kimie K2 models (free tier)
- **RAG System**: ChromaDB + OpenAI embeddings for knowledge retrieval
- **Persona System**: Two specialized AI assistants with distinct personalities
- **Hybrid Storage**: Google Cloud Storage + SQLite for performance optimization
- **Vector Database**: Supabase PostgreSQL with pgvector extension
- **Multimodal Processing**: OpenCV + Tesseract + EasyOCR + PIL
- **Security Framework**: PyJWT + cryptography + bleach + CORS + bandit
- **Cache System**: cachetools (memory) + Google Cloud Storage fallback
- **Validation**: Pydantic 2.0 + jsonschema for data integrity

### Frontend Architecture (Next.js)
- **App Router**: Modern Next.js 14+ structure with server-side rendering
- **Component Structure**:
  - `components/chat/`: Chat interface components with persona avatars
  - `components/educational/`: Educational dashboard and learning modules
  - `components/navigation/`: Responsive navigation with accessibility
  - `hooks/`: Custom React hooks for state management
  - `services/`: API integration and business logic

### Key Technologies (Real Stack - Updated)
- **Backend**: Flask 3.1 + cachetools + Google Cloud Storage + Supabase PostgreSQL
- **Frontend**: Next.js 14 + React 19 + TypeScript + 15 tipos de testes automatizados
- **Vector Store**: Supabase PostgreSQL with pgvector extension (produção)
- **AI Models**: Meta Llama 3.2-3B + Kimie K2 Chat via OpenRouter (free tier)
- **Multimodal**: OpenCV + Tesseract + EasyOCR + PIL for image processing
- **Security**: PyJWT + cryptography + bleach + bandit + CodeQL
- **CI/CD**: GitHub Actions + Google Cloud Run + Docker containers
- **Automation**: SuperClaude Framework + quality hooks + LGPD compliance

## Personas System

The application features two distinct AI assistants:

### Dr. Gasnelio (Technical)
- **Role**: Clinical pharmacist specialist
- **Response Style**: Technical, scientific, with citations
- **Validation**: Quality scoring and technical accuracy checks
- **Use Cases**: Professional dosing queries, pharmacology questions

### Gá (Empathetic)  
- **Role**: Empathetic educator
- **Response Style**: Simple, caring, translates technical terms
- **Validation**: Empathy scoring and accessibility checks
- **Use Cases**: Patient-friendly explanations, emotional support

## Knowledge Base Structure

The system uses a hybrid knowledge architecture:

1. **Primary Sources**:
   - `data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md`
   - `data/knowledge_base/roteiro_hanseniase_basico.md`

2. **Structured Data** (`data/structured/`):
   - `clinical_taxonomy.json`: Medical terminology
   - `dispensing_workflow.json`: Process workflows  
   - `dosing_protocols.json`: Medication protocols
   - `pharmacovigilance_guidelines.json`: Safety monitoring

3.  **Context7** Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

4.  **Fail honest policy**: sem fallbacks em hml/main

## API Endpoints

### Core Endpoints
- `POST /api/chat`: Main chat interface with persona selection
- `GET /api/personas`: Detailed persona information and capabilities
- `GET /api/health`: Comprehensive system health check
- `POST /api/scope`: Question scope verification

### Specialized Endpoints
- `POST /api/feedback`: User feedback collection for ML improvement
- `GET /api/stats`: System performance metrics
- `GET /api/usability/monitor`: UX monitoring data

## Security Considerations

The application implements enterprise-grade security:
- **Rate Limiting**: Tiered limits per endpoint type
- **Input Sanitization**: Multi-layer validation with bleach
- **CORS Protection**: Configurable origin allowlists
- **CSP Headers**: Content Security Policy implementation
- **IP Monitoring**: Suspicious activity detection and blocking

## Testing & Quality Assurance

### Available Test Scripts
```bash
# Frontend Next.js (15 types of tests)
npm run test                   # All test suites
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:a11y              # Accessibility tests
npm run test:performance       # Performance tests
npm run lint                   # Code quality
npm run type-check             # TypeScript validation

# Backend validation through API
curl /api/health               # System health check
curl /api/test                 # CORS and connectivity test
```

### Quality Reports
- Check `qa-reports/` directory for validation reports
- `VALIDATION_REPORT.md`: Comprehensive QA analysis
- Performance benchmarks and accessibility scores

## Deployment Architecture

### Current Setup
- **Frontend**: Google Cloud Run (Next.js containerized)
- **Backend**: Google Cloud Run (Flask containerized)
- **Storage**: Google Cloud Storage for static assets and backups
- **Vector Database**: Supabase PostgreSQL with pgvector
- **Domain**: roteirosdedispensacao.com

### Build Process
```bash
# Frontend deployment (automated via GitHub Actions)
cd apps/frontend-nextjs
npm run build
# Containerized deployment to Cloud Run

# Backend deployment (automated via Docker)
cd apps/backend
# Deployment handled by Cloud Run from repository
# Uses requirements.txt with security updates
```

## Development Guidelines and Code Review

### 1. Functionality & Correctness
- Requirements: code does what it should
- Logic: works for all expected inputs, including edge cases
- Integration: works without breaking the existing features
- Testing: includes tests for features and edge cases

### 2. Readability & Clarity
- Clarity: code is easy to read
- Style: follows project style guidelines
- Documentation: understandable and correct
- Comments: explains why, not just what

### 3. Performance & Efficiency
- Algorithms: uses efficient algorithms and data structures
- Scalability: works efficiently as users or data grow
- Bottlenecks: avoid repeated computations or unnecessary operations
- Reuse: no repeated code; instead, use shared code
- Resources: uses cpu and memory effectively
- Caching: reuse results to speed things up if needed

### 4. Security & Stability
- Validation: sanitizes all inputs
- Vulnerabilities: protects against common security holes
- Data: handle sensitive information securely
- Error Handling: does proper error handling and fails gracefully
- Observability: simple to monitor and debug
- Compatibility: works with older versions and features
- API Design: simple and consistent
- Dependencies: uses only safe and needed libraries

### Code Patterns
1. **Error Handling**: All API endpoints use comprehensive error handling with request IDs
2. **Logging**: Structured JSON logging for production monitoring
3. **Caching**: Implement caching at multiple levels (API, RAG, personas)
4. **Accessibility**: WCAG 2.1 AA compliance maintained

### Adding New Features
1. **Backend**: Follow the modular structure in `services/` directory
2. **Frontend**: Use the established component patterns with proper TypeScript types
3. **AI Integration**: Extend persona system through `get_personas()` function
4. **Knowledge Base**: Add structured data to appropriate JSON files

## Performance Optimizations

The system includes several performance enhancements:
- **Bundle Optimization**: Next.js automatic code splitting
- **API Caching**: 75% reduction in API calls through intelligent caching
- **Image Optimization**: Next.js optimized image loading
- **PWA Features**: Service Worker implementation for offline capability

## Quality Check Hooks

The repository includes quality check hooks that automatically validate and fix code:

### Hook System
- Hooks are triggered after Write/Edit/MultiEdit operations on TypeScript/JavaScript files
- Exit code 0 = success (silent), exit code 2 = quality issues found (blocking)
- Each project type has its own quality check implementation

### Quality Checks Performed
1. TypeScript compilation checks (using project's tsconfig.json)
2. ESLint with auto-fix capability
3. Prettier formatting with auto-fix
4. Custom rule validation (console usage, 'as any', debugger, TODOs)

## Writing Style Guidelines

Write facts, not fluff. Every word must justify its existence.

**Banned Elements:**
- No emojis
- No marketing language or praise
- No "thank you" pleasantries
- No explanatory preambles ("Here is...", "This is...")
- No adjectives that don't add information

**Banned Words:**
- powerful, seamless, comprehensive, robust, elegant
- enhanced, amazing, great, awesome, wonderful, excellent
- sophisticated, advanced, intuitive, user-friendly
- cutting-edge, state-of-the-art, innovative, revolutionary

**What TO Write:**
- Facts only - What it does, not why it's good
- Direct statements - Start with the point
- Concrete specifics - Numbers, not abstractions
- Technical accuracy - Precise, not approximate

## TypeScript Code Quality Standards

When fixing TypeScript `any` types:
1. **Use specific types based on actual usage patterns**
2. **Import proper type definitions from existing interfaces**
3. **Create interfaces when patterns are consistent**
4. **Use generic constraints for reusable functions**
5. **Avoid `unknown` as a blanket replacement - be specific**

Common patterns:
- Event handlers: Use specific React event types (`React.MouseEvent`, `React.ChangeEvent`, etc.)
- API responses: Use existing API interfaces from `@/types/api`
- Form data: Use existing form interfaces from `@/types/forms`
- Component props: Create specific prop interfaces
- Error handling: Use `Error | unknown` with proper type guards

## Documentation References

- `README.md`: General project overview
- `claude_code_optimization_prompt.md`: Otimização e refatoramento de código
- `docs/ESTRATEGIA_UX_PERSONAS.md`: UX strategy documentation
- `qa-reports/VALIDATION_REPORT.md`: Quality assurance results

## REGRAS CRÍTICAS DE QUALIDADE E CONCLUSÃO DE TAREFAS

### NUNCA MARQUE COMO CONCLUÍDO ALGO QUE NÃO ESTÁ 100% FUNCIONAL

**REGRA ABSOLUTA**: Independente da complexidade ou tipo de atividade, uma tarefa só pode ser marcada como "completed" quando:

1. **Zero Erros de Importação**: Todos os imports funcionam sem ModuleNotFoundError ou ImportError
2. **Zero Erros de Sintaxe**: Código compila/executa sem SyntaxError
3. **Zero Warnings Críticos**: Sem UnicodeEncodeError, TypeError, ou AttributeError
4. **Funcionalidade Verificada**: Sistema demonstravelmente funcional através de teste

### Abordagem Obrigatória para Resolução de Problemas

Quando encontrar erros ou warnings:

1. **PARE a tarefa atual**
2. **IDENTIFIQUE todos os erros/warnings**
3. **PLANEJE a resolução completa**
4. **RESOLVA 100% dos problemas**
5. **TESTE a funcionalidade**
6. **SÓ ENTÃO marque como completed**

### Exemplos de Aplicação

❌ **ERRADO**:
- Marcar "logging_blueprint integrado" quando ainda há ImportError
- Marcar "sistema funcionando" quando há UnicodeEncodeError
- Ignorar warnings "porque a funcionalidade principal funciona"

✅ **CORRETO**:
- Resolver todos os erros de import antes de marcar como concluído
- Corrigir problemas de encoding e dependências
- Criar fallbacks funcionais para dependências ausentes
- Verificar que o sistema realmente funciona end-to-end

### Tolerância Zero para "Quase Funcionando"

- Não existe "funcionando com pequenos problemas"
- Não existe "99% concluído"
- Uma funcionalidade ou está 100% funcional ou não está
- Problemas aparentemente "pequenos" frequentemente quebram todo o sistema

**Esta regra se aplica a TODAS as atividades, independente de sua natureza ou complexidade.**

## Contact and Support

This educational platform is based on doctoral thesis research for hanseníase medication dispensing protocols, following Brazilian Ministry of Health guidelines (PCDT Hanseníase 2022).
- to memorize ao testar algo local use o github cli para usar variáveis e secrets e trazer mais veracidade aos teste