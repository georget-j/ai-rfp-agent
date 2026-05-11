-- Adds ingestion-time metadata columns to documents and a content_type
-- discriminator to document_chunks. All new columns are nullable so existing
-- rows are unaffected and no backfill is required.

alter table documents
  add column if not exists page_count           integer,
  add column if not exists word_count           integer,
  add column if not exists extraction_warnings  text[],
  add column if not exists file_size_bytes      bigint;

alter table document_chunks
  add column if not exists content_type  text default 'text';
  -- expected values: 'text' | 'table_row' | 'heading' | 'list'
