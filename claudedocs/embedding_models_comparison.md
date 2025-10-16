# Comparação de Modelos de Embedding Gratuitos - Português Médico

**Data**: 2025-10-15
**Objetivo**: Encontrar melhor modelo gratuito para RAG de conteúdo médico em português

## Problema Identificado

- **Supabase indexado**: 279 dimensões (modelo desconhecido)
- **Runtime atual**: BAAI/bge-small-en-v1.5 (384 dimensões)
- **Resultado**: Incompatibilidade → similarity score 0.21 < 0.5 threshold → RAG retorna `sources: []`

## Modelos Testados Localmente

| Modelo | Dimensões | Português | Médico | Resultado |
|--------|-----------|-----------|--------|-----------|
| all-MiniLM-L6-v2 | 384 | Limitado | Não | ❌ Não multilíngue |
| all-MiniLM-L12-v2 | 384 | Limitado | Não | ❌ Não multilíngue |
| paraphrase-MiniLM-L3-v2 | 384 | Bom | Não | ❌ Pequeno demais |
| paraphrase-multilingual-MiniLM-L12-v2 | 384 | Excelente | Não | ✅ Candidato |
| paraphrase-multilingual-mpnet-base-v2 | 768 | Excelente | Não | ⚠️ Grande demais |
| distiluse-base-multilingual-cased-v2 | 512 | Excelente | Não | ⚠️ Tamanho médio |
| LaBSE | 768 | Excelente | Não | ⚠️ Grande demais |
| multilingual-e5-small | 384 | Excelente | Não | ✅ Candidato |
| multilingual-e5-base | 768 | Excelente | Não | ⚠️ Grande demais |

## Modelos Médicos (Inglês)

| Modelo | Dimensões | Português | Médico | Free Tier |
|--------|-----------|-----------|--------|-----------|
| NeuML/pubmedbert-base-embeddings | 768 | Não | Excelente | HuggingFace Serverless |
| MedEmbed (família) | Variável | Não | Excelente | HuggingFace Serverless |
| embeddinggemma-300m-medical | Variável | Não | Excelente | HuggingFace Serverless |

## Modelos API (Via OpenRouter Free Tier)

| Modelo | Dimensões | Português | Médico | Limite Gratuito |
|--------|-----------|-----------|--------|-----------------|
| text-embedding-3-small (OpenAI) | 1536 | Excelente | Bom | Limitado |
| text-embedding-3-large (OpenAI) | 3072 | Excelente | Excelente | Limitado |

## Análise de Custo

### Opções Totalmente Gratuitas (Sem Limites)

1. **sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2**
   - Execução local (Python)
   - Tamanho: ~470 MB
   - Velocidade: ~100-200 textos/segundo
   - **Custo**: R$ 0,00 (sem limites)

2. **intfloat/multilingual-e5-small**
   - Execução local (Python)
   - Tamanho: ~470 MB
   - Velocidade: ~100-200 textos/segundo
   - **Custo**: R$ 0,00 (sem limites)

### Opções API Gratuitas (Com Limites)

3. **HuggingFace Serverless API**
   - Modelos: BAAI/bge-small-en-v1.5, multilingual-e5-small
   - Rate limit: 1000 requests/hora (free tier)
   - **Custo**: R$ 0,00 até o limite

4. **OpenRouter Free Tier**
   - Modelo: text-embedding-3-small
   - Limite: Variável (compartilhado com LLM)
   - **Custo**: R$ 0,00 até o limite

## Recomendações por Cenário

### Cenário 1: Máxima Qualidade + Português + Médico
**Recomendação**: Re-indexar com **intfloat/multilingual-e5-small** (384D)

**Vantagens**:
- State-of-the-art em multilingual (MTEB score: ~66)
- Excelente suporte a português
- Totalmente gratuito (execução local)
- 384 dimensões = bom equilíbrio qualidade/tamanho

**Desvantagens**:
- Não especializado em medicina
- Requer re-indexação de 148 documentos

### Cenário 2: Português + Tamanho Menor
**Recomendação**: Re-indexar com **paraphrase-multilingual-MiniLM-L12-v2** (384D)

**Vantagens**:
- Modelo comprovado e estável
- Ótimo português (paraphrase é o foco)
- Totalmente gratuito
- 384 dimensões

**Desvantagens**:
- Performance inferior ao E5
- Não especializado em medicina

### Cenário 3: Máxima Qualidade (Sem Restrição de Tamanho)
**Recomendação**: Re-indexar com **intfloat/multilingual-e5-base** (768D)

**Vantagens**:
- Melhor performance multilingual
- Totalmente gratuito
- Mais contexto capturado (768D)

**Desvantagens**:
- Vetores 2x maiores (mais armazenamento/latência)
- Processamento mais lento
- Requer re-indexação

## Decisão Final Recomendada

### 🏆 **VENCEDOR: intfloat/multilingual-e5-small (384D)**

**Justificativa**:
1. **Melhor qualidade multilingual** (MTEB: ~66 vs ~50 dos outros)
2. **Totalmente gratuito** sem rate limits (execução local)
3. **384 dimensões** = equilíbrio perfeito qualidade/performance
4. **Português excelente** (treinado com corpus multilingual massivo)
5. **Comunidade ativa** (modelo mantido por intfloat/Microsoft)

**Trade-offs Aceitáveis**:
- Não especializado em medicina (mas corpus geral é suficiente para terminologia médica)
- Requer re-indexação (processo one-time, ~5-10 minutos para 148 docs)

## Script de Re-indexação

```python
# apps/backend/scripts/reindex_embeddings.py
from sentence_transformers import SentenceTransformer
from supabase import create_client
import os
from tqdm import tqdm

def reindex_with_e5_small():
    """Re-indexa Supabase com multilingual-e5-small (384D)"""

    # Configuração
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')

    # Modelo novo
    model = SentenceTransformer('intfloat/multilingual-e5-small')
    print(f"Modelo carregado: {model.get_sentence_embedding_dimension()} dimensões")

    # Conectar Supabase
    supabase = create_client(supabase_url, supabase_key)

    # Buscar todos os documentos
    response = supabase.table('roteiro_dispensacao_embeddings').select('*').execute()
    documents = response.data

    print(f"Encontrados {len(documents)} documentos para re-indexar")

    # Re-indexar cada documento
    for doc in tqdm(documents):
        # Gerar novo embedding
        text = doc['content']
        new_embedding = model.encode(text).tolist()

        # Atualizar no Supabase
        supabase.table('roteiro_dispensacao_embeddings').update({
            'embedding': new_embedding
        }).eq('id', doc['id']).execute()

    print("✅ Re-indexação concluída com sucesso!")

if __name__ == '__main__':
    reindex_with_e5_small()
```

## Validação Pós Re-indexação

```bash
# Teste 1: Verificar dimensões
curl -X POST "https://backend-url/api/v1/chat" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d @test_rag_hanseniase.json

# Esperado: sources com similarity > 0.5

# Teste 2: Query médica complexa
{
  "message": "Quais são os efeitos adversos da rifampicina no tratamento da hanseníase?",
  "persona_id": "dr_gasnelio"
}

# Esperado: 3-5 sources relevantes, similarity 0.6-0.9
```

## Próximos Passos

1. ✅ Aprovar modelo escolhido (multilingual-e5-small)
2. ⏳ Criar script de re-indexação
3. ⏳ Testar re-indexação em ambiente staging
4. ⏳ Executar re-indexação em produção
5. ⏳ Validar RAG retornando sources
6. ⏳ Monitorar qualidade das respostas
