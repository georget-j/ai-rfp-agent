-- Hybrid search using Reciprocal Rank Fusion (RRF)
--
-- Runs vector similarity search and full-text search independently (top 20
-- each), then merges using RRF: score = sum(1 / (k + rank)).
-- A chunk ranking highly in both lists scores higher than one strong in only
-- one. Degrades gracefully to pure vector search when FTS finds no matches.
--
-- tsvector is computed inline rather than stored — for the current dataset
-- size (~60–100 chunks) this is fast and avoids GIN index memory requirements
-- on the free tier.
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
  rrf_k constant int := 60;
  ts_query tsquery;
begin
  ts_query := plainto_tsquery('english', query_text);

  return query
  with
    vector_hits as (
      select
        dc.id,
        row_number() over (order by dc.embedding <=> query_embedding) as rank
      from document_chunks dc
      where dc.embedding is not null
      order by dc.embedding <=> query_embedding
      limit 20
    ),
    fts_hits as (
      select
        dc.id,
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
        id,
        sum(1.0 / (rrf_k + rank)) as score
      from (
        select id, rank from vector_hits
        union all
        select id, rank from fts_hits
      ) all_hits
      group by id
    )
  select
    dc.id,
    dc.document_id,
    d.title  as document_title,
    dc.content,
    (1 - (dc.embedding <=> query_embedding))::float as similarity,
    dc.metadata
  from rrf_scores rs
  join document_chunks dc on dc.id = rs.id
  join documents d on d.id = dc.document_id
  order by rs.score desc
  limit match_count;
end;
$$;
