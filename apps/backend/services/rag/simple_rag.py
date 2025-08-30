# -*- coding: utf-8 -*-
"""
SISTEMA RAG SIMPLIFICADO
Usando apenas NLTK para processamento básico de texto
Testando limites do Render.com
"""

import re
from typing import List, Dict, Tuple

def simple_tokenize(text: str) -> List[str]:
    """Tokenização simples sem dependências pesadas"""
    # Remove caracteres especiais e converte para minúsculo
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    # Divide em palavras
    words = text.split()
    # Remove palavras muito curtas
    return [word for word in words if len(word) > 2]

def calculate_similarity(query_tokens: List[str], chunk_tokens: List[str]) -> float:
    """Calcula similaridade simples baseada em palavras em comum"""
    if not query_tokens or not chunk_tokens:
        return 0.0
    
    query_set = set(query_tokens)
    chunk_set = set(chunk_tokens)
    
    # Jaccard similarity
    intersection = len(query_set.intersection(chunk_set))
    union = len(query_set.union(chunk_set))
    
    return intersection / union if union > 0 else 0.0

def split_into_chunks(text: str, chunk_size: int = 500) -> List[str]:
    """Divide texto em chunks menores"""
    sentences = re.split(r'[.!?]+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        if len(current_chunk) + len(sentence) < chunk_size:
            current_chunk += sentence + ". "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

def simple_rag_search(query: str, knowledge_base: str, top_k: int = 3) -> List[Dict]:
    """Sistema RAG simplificado usando apenas processamento básico"""
    
    if not knowledge_base or not query:
        return []
    
    # Tokenizar query
    query_tokens = simple_tokenize(query)
    
    # Dividir base de conhecimento em chunks
    chunks = split_into_chunks(knowledge_base)
    
    # Calcular similaridade para cada chunk
    chunk_scores = []
    for i, chunk in enumerate(chunks):
        chunk_tokens = simple_tokenize(chunk)
        similarity = calculate_similarity(query_tokens, chunk_tokens)
        
        chunk_scores.append({
            'id': i,
            'text': chunk,
            'similarity': similarity,
            'length': len(chunk)
        })
    
    # Ordenar por similaridade
    chunk_scores.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Retornar top_k resultados
    return chunk_scores[:top_k]

def generate_context_from_rag(query: str, knowledge_base: str, max_context_length: int = 1500) -> Tuple[str, Dict]:
    """Gera contexto usando RAG simples"""
    
    # Buscar chunks relevantes
    relevant_chunks = simple_rag_search(query, knowledge_base, top_k=5)
    
    if not relevant_chunks:
        return knowledge_base[:max_context_length], {
            'method': 'fallback',
            'chunks_found': 0,
            'avg_similarity': 0.0
        }
    
    # Combinar chunks até atingir tamanho máximo
    context = ""
    chunks_used = 0
    total_similarity = 0.0
    
    for chunk in relevant_chunks:
        if len(context) + len(chunk['text']) < max_context_length:
            context += chunk['text'] + "\n\n"
            chunks_used += 1
            total_similarity += chunk['similarity']
        else:
            break
    
    metadata = {
        'method': 'simple_rag',
        'chunks_found': len(relevant_chunks),
        'chunks_used': chunks_used,
        'avg_similarity': total_similarity / chunks_used if chunks_used > 0 else 0.0
    }
    
    return context.strip(), metadata

# Teste básico
if __name__ == "__main__":
    test_text = """
    A hanseníase é uma doença infectocontagiosa crônica. 
    O tratamento é feito com PQT-U (Poliquimioterapia Única).
    Os medicamentos incluem rifampicina, dapsona e clofazimina.
    """
    
    query = "tratamento hanseníase"
    context, meta = generate_context_from_rag(query, test_text)
    print(f"Context: {context}")
    print(f"Metadata: {meta}")