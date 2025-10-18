# -*- coding: utf-8 -*-
"""
Script de diagnóstico para investigar threshold de similaridade Supabase RPC
Verifica se o problema é no cálculo de similaridade ou no threshold
"""

import os
import sys
import json
from sentence_transformers import SentenceTransformer
from supabase import create_client

# Configuração Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://skmyflckurikjprdleuz.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbXlmbGNrdXJpa2pwcmRsZXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU1Mjc3OCwiZXhwIjoyMDcyMTI4Nzc4fQ.RqGfQ2UIP0rmC6rK_C57CMyLBfMt9_EGOqp9cXJtb4k')

# Carregar modelo de embedding
print("[1/5] Carregando modelo intfloat/multilingual-e5-small...")
model = SentenceTransformer('intfloat/multilingual-e5-small')

# Conectar ao Supabase
print(f"[2/5] Conectando ao Supabase: {SUPABASE_URL}")
client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Criar embedding para query de teste
query = "Qual a dose da rifampicina para tratamento de hanseníase em adultos?"
print(f"\n[3/5] Query de teste: {query}")
print(f"[3/5] Gerando embedding...")

# Prefixo para queries (conforme documentação do modelo E5)
query_with_prefix = f"query: {query}"
query_embedding = model.encode(query_with_prefix, normalize_embeddings=True).tolist()

print(f"[3/5] Embedding gerado: {len(query_embedding)}D")

# Testar com diferentes thresholds
thresholds = [0.0, 0.3, 0.5, 0.7, 0.8]

print("\n[4/5] Testando RPC match_medical_embeddings com diferentes thresholds:\n")

for threshold in thresholds:
    try:
        result = client.rpc(
            'match_medical_embeddings',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': 10
            }
        ).execute()

        count = len(result.data) if result.data else 0
        print(f"  Threshold {threshold:.1f}: {count:3d} resultados", end="")

        if count > 0:
            # Mostrar top 3 com similarity scores
            print(f" (similarity range: {result.data[0]['similarity']:.3f} - {result.data[-1]['similarity']:.3f})")
            for i, doc in enumerate(result.data[:3], 1):
                text_preview = doc['text'][:60] + "..." if len(doc['text']) > 60 else doc['text']
                print(f"    #{i}: similarity={doc['similarity']:.4f} | {text_preview}")
        else:
            print("")

    except Exception as e:
        print(f"  Threshold {threshold:.1f}: ERRO - {e}")

print("\n[5/5] Diagnóstico completo!")
print("\n📊 Análise:")
print("  - Se threshold 0.0 retorna resultados → RPC function funciona")
print("  - Se threshold 0.7 retorna 0 resultados → embeddings não são similares o suficiente")
print("  - Solução: reduzir threshold OU melhorar chunking/indexação")
