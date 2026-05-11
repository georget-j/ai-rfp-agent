-- Fixes ambiguous column reference in 004_hybrid_search.sql.
-- Uses explicit chunk_id alias throughout the CTEs to avoid any
-- PostgreSQL ambiguity between id columns from different joined tables.
create or replace function hybrid_search_chunks(
  query_text      text,
  query_embedding vector(1536),
  match_count     int default 6
)
returns table (
  id             uuid,
  document_id    uuid,
  document_title text,
  content        text,
  similarity     float,
  metadata       jsonb
)
language plpgsql
as $$
declare
  rrf_k    constant int      := 60;
  ts_query          tsquery;
begin
  ts_query := plainto_tsquery('english', query_text);

  return query
  with
    vector_hits as (
      select
        dc.id   as chunk_id,
        row_number() over (order by dc.embedding <=> query_embedding) as rank
      from document_chunks dc
      where dc.embedding is not null
      order by dc.embedding <=> query_embedding
      limit 20
    ),
    fts_hits as (
      select
        dc.id   as chunk_id,
        row_number() over (
          order by ts_rank(to_tsvector('english', dc.content), ts_query) desc
        ) as rank
      from document_chunks dc
      where to_tsvector('english', dc.content) @@ ts_query
      order by ts_rank(to_tsvector('english', dc.content), ts_query) desc
      limit 20
    ),
    rrf_scores as (
      select
        chunk_id,
        sum(1.0 / (rrf_k + rank)) as score
      from (
        select chunk_id, rank from vector_hits
        union all
        select chunk_id, rank from fts_hits
      ) all_hits
      group by chunk_id
    )
  select
    dc.id,
    dc.document_id,
    d.title        as document_title,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity,
    dc.metadata
  from rrf_scores rs
  join document_chunks dc on dc.id = rs.chunk_id
  join documents d         on d.id  = dc.document_id
  order by rs.score desc
  limit match_count;
end;
$$;
