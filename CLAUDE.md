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
│   ├── frontend/               # Legacy Vite React app (archived)
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

### Legacy Frontend (Vite) - Deprecated
```bash
cd apps/frontend
npm install
npm run dev                    # Development (port 5173)
npm run build                  # Production build
npm run type-check            # TypeScript validation
npm run lint                   # ESLint with 49 warning limit
```

**Note**: The Vite frontend has bundle size limitations (<200KB) and is considered deprecated. All new development should use the Next.js application.

## Architecture Overview

### Backend Architecture
- **Flask API** with comprehensive security measures
- **Dual AI Integration**: OpenRouter (primary) with Llama 3.2 and Kimie K2 models
- **RAG System**: Enhanced retrieval-augmented generation for knowledge base queries
- **Persona System**: Two specialized AI assistants with distinct personalities
- **Advanced Caching**: LRU cache with TTL for performance optimization
- **Security Framework**: Rate limiting, input sanitization, CORS protection
- **Scope Detection**: Intelligent question categorization and limitation handling

### Frontend Architecture (Next.js)
- **App Router**: Modern Next.js 14+ structure with server-side rendering
- **Component Structure**:
  - `components/chat/`: Chat interface components with persona avatars
  - `components/educational/`: Educational dashboard and learning modules
  - `components/navigation/`: Responsive navigation with accessibility
  - `hooks/`: Custom React hooks for state management
  - `services/`: API integration and business logic

### Key Technologies
- **Backend**: Flask 3.0, OpenAI/OpenRouter APIs, Redis cache, Pydantic validation
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS (inferred from structure)
- **AI Models**: Meta Llama 3.2-3B, Kimie K2 Chat (both free tier)
- **Data**: Structured JSON knowledge base + Markdown documents

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

## Environment Variables

Required for backend operation:
```
OPENROUTER_API_KEY=xxx          # Primary AI service
HUGGINGFACE_API_KEY=xxx         # Backup AI service  
FLASK_ENV=development|production
PORT=5000                       # Server port
ENVIRONMENT=development|production
```

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
# Frontend Next.js
npm run lint                    # Code quality
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
- **Frontend**: Firebase Hosting (roteiros-de-dispensacao.web.app)
- **Backend**: Google Cloud Run (containerized deployment)
- **Domain**: roteirosdedispensacao.com

### Build Process
```bash
# Frontend deployment
cd apps/frontend-nextjs
npm run build
firebase deploy

# Backend deployment (automated via Docker)
cd apps/backend
# Deployment handled by Cloud Run from repository
```

## Development Guidelines

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

## Common Issues & Solutions

### Bundle Size (Legacy Frontend)
- **Issue**: Vite frontend has <200KB limitation
- **Solution**: Use Next.js frontend for all new development

### AI Model Availability
- **Issue**: Free tier models may have rate limits
- **Solution**: Automatic fallback between Llama 3.2 and Kimie K2

### Knowledge Base Updates
- **Issue**: Content changes require system restart
- **Solution**: Structured JSON format allows hot-reloading

## Documentation References

- `README.md`: General project overview
- `PLANO_IMPLEMENTACAO_FRONTEND.md`: Detailed development roadmap
- `docs/ESTRATEGIA_UX_PERSONAS.md`: UX strategy documentation
- `qa-reports/VALIDATION_REPORT.md`: Quality assurance results

## Contact and Support

This educational platform is based on doctoral thesis research for hanseníase medication dispensing protocols, following Brazilian Ministry of Health guidelines (PCDT Hanseníase 2022).