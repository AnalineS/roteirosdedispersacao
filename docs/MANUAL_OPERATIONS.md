# Manual Operations Guide

**Purpose**: Documentation for manual scripts replacing automated workflows
**Date**: 2025-10-19

## Overview

As part of workflow optimization, several automated workflows were converted to manual scripts for operations that:
- Are one-time or infrequent (knowledge base indexing)
- Require human judgment (RAG testing and validation)
- Don't need scheduled automation

This guide documents how to use these manual operation scripts.

## Available Scripts

### 1. Knowledge Base Indexing

**Script**: `scripts/index-knowledge-base.sh`

**Purpose**: Index medical knowledge base documents to Supabase vector database

**Replaces**:
- `.github/workflows/index-knowledge-base.yml`
- `.github/workflows/index-supabase.yml`

#### Usage

Basic indexing (incremental):
```bash
./scripts/index-knowledge-base.sh
```

Force complete reindexing:
```bash
./scripts/index-knowledge-base.sh --force
```

Show help:
```bash
./scripts/index-knowledge-base.sh --help
```

#### Requirements

**Environment Variables** (required):
```bash
export SUPABASE_PROJECT_URL="https://your-project.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

**Dependencies**:
- Python 3.11+
- Backend requirements.txt installed
- `huggingface_hub` package

#### Process Flow

1. Activates Python virtual environment (if exists)
2. Installs dependencies (`requirements.txt` + `huggingface_hub`)
3. Runs `scripts/index_knowledge_base.py`
4. Verifies indexing success
5. Reports document count

#### Expected Output

```
=Ú Indexing Medical Knowledge Base to Supabase...
========================================
Force reindex: false

=' Activating virtual environment...
=æ Installing dependencies...

=€ Starting indexing process...
========================================
[indexing output from Python script]

= Verifying indexing...
========================================
 Indexed documents: 342

<‰ Knowledge base indexing completed successfully!

========================================
=Ê Indexing Summary
========================================
Status: Completed
Timestamp: 2025-10-19 14:32:15 UTC
Force reindex: false
```

#### Troubleshooting

**Error: Missing environment variables**
```
L Error: SUPABASE_PROJECT_URL and SUPABASE_PUBLISHABLE_KEY environment variables required
```
Solution: Export required environment variables

**Warning: Document count too low**
```
  Warning: Expected at least 100 documents, found 45
```
Solution: Check knowledge base source files in `data/knowledge_base/`

**Error: Import failure**
```
L Error: Missing dependency - No module named 'supabase'
```
Solution: `pip install supabase`

### 2. RAG System Testing

**Script**: `scripts/test-rag-manual.sh`

**Purpose**: Manual testing and validation of RAG (Retrieval-Augmented Generation) system

**Replaces**: `.github/workflows/test-rag-accuracy.yml`

#### Usage Modes

**Mode 1: Unit Tests** (default)
```bash
./scripts/test-rag-manual.sh
```
Runs existing RAG unit tests or basic connectivity test.

**Mode 2: Single Query Test**
```bash
./scripts/test-rag-manual.sh --query "Qual a dose de rifampicina?"
```
Tests RAG with a specific query.

**Mode 3: Single Query with Details**
```bash
./scripts/test-rag-manual.sh --query "Qual a dose de rifampicina?" --detailed
```
Shows retrieved sources and relevance scores.

**Mode 4: Full Benchmark**
```bash
./scripts/test-rag-manual.sh --benchmark
```
Runs complete RAG accuracy benchmark suite.

**Show Help**
```bash
./scripts/test-rag-manual.sh --help
```

#### Requirements

**Environment Variables** (required for RAG queries):
```bash
export SUPABASE_PROJECT_URL="https://your-project.supabase.co"
export SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
export OPENROUTER_API_KEY="your-openrouter-key"
export HUGGINGFACE_API_KEY="your-huggingface-key"
```

**Dependencies**:
- Python 3.11+
- Backend requirements.txt installed
- pytest (for unit tests)

#### Example Output

**Single Query Test**:
```
>ê Manual RAG System Testing
========================================

=' Activating virtual environment...
=æ Installing test dependencies...

=€ Starting RAG tests...
========================================

= Testing RAG query: Qual a dose de rifampicina?

=Ë RAG Query Results
==================================================
Query: Qual a dose de rifampicina?
Documents retrieved: 5
Confidence score: 0.89

=Ä Response:
A dose de rifampicina para adultos é de 600 mg/dia, administrada
em jejum (1 hora antes ou 2 horas após o café da manhã)...

========================================
=Ê Test Summary
========================================
Timestamp: 2025-10-19 14:45:23 UTC
Mode: Single query
Query: Qual a dose de rifampicina?
```

**Detailed Query Test**:
```
= Retrieved Sources:
  1. Relevance: 0.92
     Content: A rifampicina é um antibiótico bactericida utilizado no tratamento da hanseníase...

  2. Relevance: 0.87
     Content: Posologia: Adultos - 600 mg/dia em jejum. Crianças - 10-20 mg/kg/dia...
```

**Benchmark Mode**:
```
=Ê Running full RAG accuracy benchmark...
[Benchmark test execution with multiple queries]

=Ê Benchmark Results:
- Total queries tested: 25
- Average confidence: 0.85
- Queries above threshold (>0.7): 23/25 (92%)
- Average response time: 1.2s
```

#### Use Cases

**Development Testing**:
- Test RAG system after code changes
- Validate embedding quality
- Benchmark performance improvements

**Quality Assurance**:
- Verify medical accuracy of responses
- Test edge cases and unusual queries
- Validate source retrieval quality

**Debugging**:
- Identify low-confidence responses
- Analyze source relevance scores
- Troubleshoot connectivity issues

#### Troubleshooting

**Error: RAG system not operational**
```
L RAG system returned invalid response
```
Solution: Check Supabase connectivity and embeddings table

**Low confidence score**
```
Confidence score: 0.42
```
Solution:
- Review knowledge base indexing
- Check if query is within domain
- Verify embedding model quality

**No tests found**
```
  No RAG-specific tests found
```
Solution: Script falls back to basic connectivity test (expected behavior)

## Best Practices

### Knowledge Base Indexing

**When to Run**:
- After updating knowledge base source files
- After major changes to embedding model
- When initializing new environment
- After Supabase schema changes

**Frequency**:
- Incremental: As needed (when content changes)
- Full reindex: Monthly or after model updates

**Validation**:
Always verify document count matches expectations (e100 documents for medical platform)

### RAG Testing

**When to Run**:
- After RAG system code changes
- Before deploying to production
- When investigating accuracy issues
- During development of new features

**Recommended Workflow**:
1. Unit tests first (quick validation)
2. Single query tests for specific issues
3. Benchmark for comprehensive validation
4. Detailed mode for debugging

**Test Queries**:
Maintain a list of representative queries covering:
- Common clinical questions
- Edge cases
- Multi-concept queries
- Queries requiring specific sources

## Integration with CI/CD

### Automated Workflows
These scripts are **not** called by automated workflows. They are intentionally manual operations requiring human oversight.

### Quality Gates
RAG accuracy validation runs automatically via:
- `post-security-update-validation.yml` (after dependency updates)
- Medical compliance checks in deployment workflow

### When to Use Manual Scripts vs Automated Workflows

**Use Manual Scripts**:
- One-time operations (initial setup, major changes)
- Debugging and investigation
- Development testing
- Quality assurance sampling

**Use Automated Workflows**:
- Continuous monitoring (production health)
- PR validation (code quality gates)
- Deployment pipelines
- Security scanning

## Environment Setup

### Local Development

1. **Clone Repository**:
   ```bash
   git clone https://github.com/AnalineS/roteirosdedispersacao.git
   cd roteirosdedispersacao
   ```

2. **Backend Setup**:
   ```bash
   cd apps/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run Scripts**:
   ```bash
   cd ../..
   ./scripts/index-knowledge-base.sh
   ./scripts/test-rag-manual.sh --query "teste"
   ```

### Production Environment

**Scripts should NOT run in production automatically**. Use for:
- Initial production setup
- Scheduled maintenance windows
- Debugging production issues

**Access Control**:
- Require manual approval
- Log all script executions
- Verify environment before running

## Monitoring and Logging

### Script Logs

Scripts output to stdout/stderr. Capture logs:
```bash
./scripts/index-knowledge-base.sh 2>&1 | tee indexing.log
./scripts/test-rag-manual.sh --benchmark 2>&1 | tee rag-test.log
```

### Success Criteria

**Knowledge Base Indexing**:
- Exit code: 0
- Document count: e100
- No import errors

**RAG Testing**:
- Exit code: 0
- Confidence score: >0.5 (single query)
- Pass rate: >80% (benchmark)

### Alerting

Manual scripts do not trigger automated alerts. Monitor:
- Exit codes (0 = success)
- Document counts (indexing)
- Confidence scores (RAG testing)

## Maintenance

### Script Updates

Scripts are version controlled:
- Location: `scripts/`
- Updates: Via pull requests
- Testing: Required before merging

### Deprecation Policy

If a manual operation becomes frequent enough to justify automation:
1. Create GitHub issue proposing workflow
2. Document use case and frequency
3. Implement automated workflow if approved
4. Update this guide

## Support

### Getting Help

- **Documentation**: See `docs/WORKFLOWS_STRATEGY.md`
- **Issues**: Create GitHub issue with `[manual-ops]` prefix
- **Questions**: Use GitHub Discussions

### Reporting Bugs

Include in bug report:
- Script name and arguments
- Full error output
- Environment (local/staging/production)
- Steps to reproduce
