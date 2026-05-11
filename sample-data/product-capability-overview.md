# Product Capability Overview

## What We Build

We build AI-powered workflow tools for enterprise teams that process large volumes of documents, decisions, or knowledge-intensive tasks.

Our platform enables organisations to ingest, classify, search, and generate structured outputs from their existing document workflows — without replacing the humans who are accountable for decisions.

---

## Core Capabilities

### 1. Document Ingestion

- Supports PDF, Word, Markdown, plain text, and structured data formats.
- Handles multi-page documents, tables, and mixed-format content.
- Configurable pre-processing pipeline: redaction, cleaning, chunking.
- Batch ingestion API for high-volume document flows.
- Webhook notifications on ingestion completion.

### 2. Semantic Search

- Full-text and vector (semantic) search across ingested document library.
- Search returns ranked results with source document, page reference, and excerpt.
- Supports natural language queries without requiring exact keyword matching.
- Filters available: document type, date range, custom metadata tags.
- API and UI access.

### 3. AI Extraction and Classification

- Extract named entities, clauses, obligations, metrics, and custom fields.
- Configurable extraction targets: define what to find, not how to find it.
- Classification: assign categories or labels to documents or sections.
- Comparison against reference playbooks or standards.
- Output as structured JSON or embedded annotations.

### 4. Structured Generation

- Generate summaries, draft responses, reports, or memos grounded in source documents.
- Source citations included in every generated output.
- Confidence indicators: high/medium/low based on source quality.
- Flagging of unsupported claims and missing evidence.
- Structured JSON output for downstream integration.

### 5. Workflow Automation

- Trigger downstream actions based on extracted data or classifications.
- Native integration: webhooks, REST API, Zapier/Make connectors.
- Approval workflows: generated outputs can be routed to a human reviewer before action.
- Audit log: all workflow steps logged with timestamps.

### 6. Reporting and Analytics

- Usage dashboard: queries, documents processed, users active.
- Quality dashboard: user feedback ratings, override rates, accuracy trends.
- Export: CSV, JSON, or direct API.
- Custom reports available on Enterprise tier.

---

## Integration Options

| Integration Type | Details |
|-----------------|---------|
| REST API | Full API access to all platform capabilities |
| Webhooks | Event-driven notifications on document events or workflow triggers |
| File drop (SFTP/S3) | Batch ingestion from cloud storage |
| Native connectors | SharePoint, Google Drive, Salesforce (Enterprise tier) |
| SSO | SAML 2.0 with major IdPs (Okta, Azure AD, Google Workspace) |
| SIEM | Log streaming to Splunk, Datadog, or S3 |

---

## Deployment Options

| Tier | Deployment | Data Residency |
|------|-----------|----------------|
| Growth | Shared cloud (EU) | EU (Ireland) |
| Business | Dedicated cloud instance | EU or US |
| Enterprise | Private cloud (VPC) or on-premise | Customer-selected |

---

## Supported Use Cases

We are deployed across the following use case categories:

**Financial services:**
- AML alert triage and narrative generation
- Loan application document review
- Regulatory report preparation
- Contract risk extraction

**Legal:**
- Contract first-pass review and playbook comparison
- Due diligence document processing
- Regulatory filing drafting

**Enterprise operations:**
- RFP and proposal response generation
- Customer onboarding document processing
- Policy and procedure compliance checking
- Knowledge base Q&A

---

## What the Platform Does Not Do

- The platform does not make final decisions in regulated workflows. All decisions remain with the human user.
- The platform does not generate content that is not grounded in source material (when operating in citation mode).
- The platform does not provide legal, financial, or medical advice.
- The platform does not replace qualified professionals. It assists them.

---

## Pricing Model

- Usage-based pricing (queries + documents ingested).
- Monthly subscription with volume commitments available.
- Enterprise pricing available for large-volume or private cloud deployments.
- Proof of concept pricing available for qualified enterprise prospects.
- Contact sales for a custom quote.

---

## Competitive Positioning

We focus on regulated, knowledge-intensive workflows where:
- Source grounding and citation are essential.
- Human review remains in the loop.
- Explainability and audit trail are required.
- The customer cannot accept hallucinated outputs.

We are not a general-purpose AI assistant. We are a structured workflow tool designed for teams where accuracy, accountability, and evidence matter.
