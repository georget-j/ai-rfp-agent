-- Vector similarity search function
-- Returns document chunks ordered by cosine similarity to the query embedding
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_count int default 6,
  similarity_threshold float default 0.3
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  content text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    d.title as document_title,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity,
    dc.metadata
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) > similarity_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;
