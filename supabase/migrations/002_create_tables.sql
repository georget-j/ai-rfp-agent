-- Documents table: stores document metadata and raw text
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null check (source_type in ('upload', 'sample')),
  file_name text,
  mime_type text,
  raw_text text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document chunks table: stores chunks and their 1536-dim embeddings
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- IVFFlat index for approximate nearest-neighbour search
-- With lists=100 this works well up to ~100k chunks
create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Queries table: stores user questions and optional RFP context
create table if not exists queries (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  rfp_context jsonb,
  created_at timestamptz not null default now()
);

-- Query results table: stores structured LLM responses and retrieved chunk IDs
create table if not exists query_results (
  id uuid primary key default gen_random_uuid(),
  query_id uuid not null references queries(id) on delete cascade,
  answer jsonb not null,
  retrieved_chunk_ids uuid[],
  created_at timestamptz not null default now()
);

-- Auto-update updated_at on documents
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on documents
  for each row execute function set_updated_at();
