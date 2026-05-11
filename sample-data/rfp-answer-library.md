# RFP Answer Library — Standard Responses

## Purpose

This document contains standard, pre-approved answers to common RFP questions. These answers are intended as starting points for proposal teams. They should be reviewed and customised for each specific customer context before submission.

All answers should be verified against the current security note, product capability overview, and any customer-specific commitments before use.

---

## Section 1: Security and Data Handling

### Q: How do you protect customer data?

Customer data is protected in transit using TLS 1.2 or higher. At rest, all data is encrypted using AES-256. Encryption keys are managed per-tenant. We do not share customer data between tenants or use it to train shared models. Access to production environments is restricted to on-call engineers via a privileged access management system, and all access is logged.

### Q: Where is customer data stored?

By default, data is stored in the EU (Ireland). UK-only and US regions are available for Enterprise customers. Region selection is confirmed at contract time.

### Q: Do you have SOC 2 certification?

We have completed SOC 2 Type I. SOC 2 Type II is in progress, with expected completion in Q3 2025. A SOC 2 Type I report is available under NDA. We also hold Cyber Essentials Plus certification and are GDPR compliant as a data processor.

*Note: Always verify certification status with the commercial team before including in a proposal, as audit cycles may update these dates.*

### Q: How do you handle a data breach?

We have a defined incident response plan. For any breach affecting customer data, we notify the affected customer within 72 hours, in accordance with GDPR requirements. A post-incident report is provided for all P1 and P2 incidents. Our most recent penetration test (Q4 2024, CREST-certified provider) returned no critical findings.

### Q: Can we conduct our own security assessment?

Yes. We support customer security questionnaires and can arrange a technical call with our security team for enterprise prospects. A penetration test summary is available under NDA.

---

## Section 2: Implementation and Onboarding

### Q: How long does implementation take?

Our standard implementation timeline is 8–12 weeks from contract signature to go-live. This includes discovery, data mapping, pilot, UAT, and rollout. Timeline varies based on customer readiness, data complexity, and integration requirements.

### Q: What do you require from us during implementation?

We require:
- A technical point of contact who can provide API or data access credentials.
- A business champion to support end-user adoption.
- 2–4 end users available for the pilot phase (approximately 2 weeks).
- Review and sign-off on the pilot report before full rollout.

The typical customer time commitment during implementation is 4–6 hours per week from the business champion and 2–4 hours per week from the technical lead.

### Q: Do you provide training?

Yes. We provide live onboarding sessions (45–60 minutes per group, up to 12 users). We also provide a quick-start guide, FAQ documentation, and a video walkthrough. For regulated workflows, we offer an additional session on documenting AI-assisted decisions for audit purposes.

### Q: What happens if the implementation doesn't go to plan?

We work to a defined acceptance criteria process. If the pilot does not meet agreed success thresholds, we pause and reconfigure before proceeding to full rollout. Our implementation manager is accountable for delivery throughout. We have a documented escalation path for unresolved implementation issues.

---

## Section 3: Support and SLAs

### Q: What are your support SLAs?

- **P1 (service outage or data breach):** 1-hour response, 4-hour resolution or escalation.
- **P2 (significant degradation):** 4-hour response, 24-hour resolution target.
- **P3 (non-critical issues):** 24-hour response, 5 business day resolution target.

Support is available via in-app ticket, email, and dedicated Slack channel (Enterprise tier).

### Q: What is your uptime SLA?

We target 99.9% uptime, excluding scheduled maintenance. Scheduled maintenance is notified 48 hours in advance and is typically less than 30 minutes. Our service is deployed in a multi-AZ configuration in the EU region.

### Q: Do you provide a dedicated customer success manager?

Yes, on Business and Enterprise tiers. Enterprise customers also receive a dedicated implementation manager for their initial deployment. We run quarterly business reviews (QBRs) with all Enterprise customers.

---

## Section 4: AI and Model Behaviour

### Q: How do you prevent the AI from generating incorrect or hallucinated information?

Our platform operates in a retrieval-augmented generation (RAG) mode. All generated outputs are grounded in the customer's source documents. The model is explicitly instructed not to generate claims not supported by the retrieved context. Responses include:
- Source citations (document name, excerpt, relevance).
- Confidence level (high/medium/low) with explanation.
- Missing information flags where evidence is insufficient.

We recommend that all AI-generated outputs are reviewed by a qualified human before use in regulated workflows.

### Q: Does the AI make decisions, or does it assist humans?

The AI assists human decision-makers. It does not autonomously execute actions, submit forms, or make regulatory decisions. All outputs are presented to a human reviewer. Our platform is designed for human-in-the-loop workflows.

### Q: Do you use customer data to train your AI models?

No. Customer data is never used to train, fine-tune, or update shared AI models without explicit written consent. Each customer's data is isolated and used only to serve that customer's queries.

### Q: Which AI models do you use?

We currently use models from the OpenAI GPT-4 family for generation and OpenAI's text-embedding-3 series for semantic search. We continuously evaluate alternative models for quality, cost, and data handling compliance.

---

## Section 5: Integrations and Technical

### Q: Do you have an API?

Yes. We provide a full REST API with OpenAPI documentation. The API supports document ingestion, querying, extraction, and workflow trigger integration.

### Q: What file formats do you support?

Current support: PDF, Word (DOCX), Markdown, plain text (TXT). On roadmap: Excel, PowerPoint, HTML. For formats not listed, contact us to discuss.

### Q: Can you integrate with our existing systems?

We support integration via REST API, webhooks, and file drop (S3/SFTP). Native connectors for SharePoint, Google Drive, and Salesforce are available on Enterprise tier. SSO via SAML 2.0 is supported with major identity providers including Okta, Azure AD, and Google Workspace.

### Q: What are your infrastructure requirements for on-premise deployment?

Private cloud (VPC) deployment is available on Enterprise tier. On-premise deployment is on the roadmap. Contact us to discuss requirements for your specific environment.

---

## Section 6: Commercial

### Q: How is the platform priced?

Pricing is usage-based (queries + documents ingested), with monthly subscription options for predictable workloads. Volume commitments are available with discounted rates. Enterprise pricing is customised based on volume, deployment model, and support requirements.

### Q: What is the minimum contract term?

Our standard minimum term is 12 months. Shorter-term pilots (3–6 months) are available for qualified enterprise prospects at pilot pricing.

### Q: Do you offer a proof of concept?

Yes. We offer a structured proof of concept programme for enterprise prospects. Typical PoC duration: 4–6 weeks. PoC pricing is available. Contact our sales team to discuss eligibility.
