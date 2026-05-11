# Technical Architecture Overview

## Purpose

This document provides a technical overview of our platform architecture for engineering and security reviewers, system integrators, and enterprise procurement teams.

---

## High-Level Architecture

```
[Customer Systems]
        │
        ▼
[API Gateway / Auth Layer]
        │
   ┌────┴────┐
   │         │
[Ingestion  [Query
 Pipeline]   Pipeline]
   │         │
   ▼         ▼
[Document   [Retrieval
 Store]      Engine]
        │
        ▼
    [LLM Layer]
        │
        ▼
  [Structured Output / Response]
```

---

## Component Breakdown

### 1. API Gateway

- All external API traffic enters via a managed API gateway.
- Authentication: API key (HMAC-signed) or OAuth 2.0 bearer token.
- Rate limiting: per-tenant, configurable.
- Request logging: all requests logged with tenant ID, timestamp, and request hash.
- No raw request content is logged (only metadata).

### 2. Ingestion Pipeline

The ingestion pipeline converts raw documents into searchable, retrievable chunks.

**Steps:**
1. Document validation (file type, size limits, virus scan).
2. Text extraction (format-specific parsers: PDF, DOCX, Markdown, plain text).
3. Text cleaning (whitespace normalisation, encoding correction).
4. Chunking (configurable chunk size; default 800–1200 tokens; overlap 100–150 tokens).
5. Embedding generation (vector representation of each chunk using embedding model).
6. Storage: chunk content + embedding stored in vector database; document metadata stored in relational database.

**Performance characteristics:**
- Typical document (10 pages): 3–8 seconds processing time.
- Large document (100+ pages): 30–90 seconds.
- Batch ingestion: up to 500 documents per batch via async job queue.

### 3. Document Store

- **Relational database:** Document metadata, user data, audit logs. PostgreSQL.
- **Vector database:** Document chunk embeddings. pgvector on PostgreSQL.
- **Object storage:** Raw document files (encrypted). AWS S3 or equivalent.

All databases are encrypted at rest (AES-256) and accessible only from within the private network.

### 4. Query Pipeline

When a user submits a query:

1. Query is validated and logged.
2. Query text is embedded using the same embedding model as documents.
3. Vector similarity search retrieves top-K most relevant chunks (default K=6, configurable).
4. Retrieved chunks are passed to the LLM layer as context.

### 5. Retrieval Engine

- Cosine similarity search using pgvector.
- IVFFlat index for approximate nearest-neighbour search at scale.
- Similarity threshold filtering: chunks below threshold are excluded.
- Metadata filters available: document type, date range, tags.

**Retrieval performance:**
- P50 latency: 80ms for vector search (library of 100k chunks).
- P99 latency: 250ms.

### 6. LLM Layer

- We use leading foundation models via API (currently OpenAI GPT-4 family and Anthropic Claude).
- All LLM calls are made server-side. API keys are never exposed to client browsers.
- Prompts include retrieved context chunks only. The model is instructed to ground responses in provided context and flag unsupported claims.
- Structured output: responses are validated against a JSON schema before being returned to the application.
- Retry logic: up to 2 retries on rate limit errors with exponential backoff.

### 7. Response Layer

The structured response includes:
- Draft answer (prose).
- Executive summary.
- Supporting evidence with source citations.
- Missing information flags.
- Confidence level (high/medium/low).
- Suggested next actions.

---

## Scalability

- Stateless API servers: horizontally scalable.
- Database: managed PostgreSQL with read replicas for query load.
- Embedding generation: async with queue-based batching for large ingestion jobs.
- LLM calls: rate limit handled with queue and retry; burst capacity via model provider.

---

## Availability

- **Target SLA:** 99.9% uptime (excluding scheduled maintenance).
- **Scheduled maintenance:** notified 48 hours in advance; typically <30 minutes.
- **Redundancy:** multi-AZ deployment in EU region.
- **Backup:** daily database snapshots; point-in-time recovery available.

---

## Monitoring and Observability

- Application metrics: latency, error rate, throughput — Datadog or equivalent.
- Alerting: P1 alerts paged to on-call engineer within 2 minutes.
- LLM quality monitoring: response confidence distributions tracked over time.
- Model drift: embedding distributions compared monthly to detect retrieval degradation.
- Cost monitoring: per-tenant LLM and embedding usage tracked for billing and capacity planning.

---

## Networking

- All services run within a private VPC.
- No direct public internet access to database or internal services.
- Egress: only to LLM API endpoints and customer-configured webhooks.
- IP allowlisting available for enterprise customers.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React), TypeScript |
| API | Next.js Route Handlers / Node.js |
| Database | PostgreSQL + pgvector |
| Object Storage | AWS S3 |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | OpenAI GPT-4o-mini / GPT-4o |
| Infrastructure | AWS / Vercel |
| Monitoring | Datadog |
| CI/CD | GitHub Actions |

---

## Questions We Commonly Receive

**Can we run this on-premise?**
Private cloud (VPC) deployment is available on Enterprise tier. On-premise is on the roadmap.

**What happens if the LLM API is unavailable?**
Queries are queued and retried. After 3 failed attempts, an error is returned. Document search (non-generative) remains available.

**How do you handle very large documents?**
Documents are chunked into segments of approximately 1,000 tokens. Very large documents (>500 pages) are processed via async batch job with webhook notification on completion.

**Can we use our own embedding model?**
Custom embedding model integration is available on Enterprise tier. Contact us for details.
