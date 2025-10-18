-- Enable pgvector extension if not already enabled
create extension if not exists vector with schema extensions;

-- Create RPC function for vector similarity search on medical_embeddings table
-- This function performs cosine similarity search using the <=> operator
-- Returns matching documents above the threshold, ordered by similarity

create or replace function match_medical_embeddings(
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  text text,
  source_file varchar,
  chunk_type varchar,
  priority float,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    medical_embeddings.id,
    medical_embeddings.text,
    medical_embeddings.source_file,
    medical_embeddings.chunk_type,
    medical_embeddings.priority,
    medical_embeddings.metadata,
    1 - (medical_embeddings.embedding <=> query_embedding) as similarity
  from medical_embeddings
  where 1 - (medical_embeddings.embedding <=> query_embedding) > match_threshold
  order by medical_embeddings.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

-- Create index for faster similarity search (HNSW index with cosine distance)
create index if not exists medical_embeddings_embedding_idx
on medical_embeddings
using hnsw (embedding vector_cosine_ops);

-- Grant execute permission to anon and authenticated users
grant execute on function match_medical_embeddings(vector(384), float, int) to anon, authenticated;
