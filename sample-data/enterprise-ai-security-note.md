# Enterprise AI Security & Compliance Overview

## Purpose

This document outlines our security posture, data handling practices, and compliance approach for enterprise deployments. It is intended to support information security reviews, RFP responses, and due diligence processes.

---

## Data Handling

### Data in Transit

- All data transmitted between customer systems and our platform uses TLS 1.2 or higher.
- API endpoints are authenticated via API keys or OAuth 2.0 bearer tokens.
- No unencrypted data transmission is supported or permitted.

### Data at Rest

- Customer data is encrypted at rest using AES-256.
- Encryption keys are managed per-tenant and rotated annually.
- Database-level encryption is applied to all production storage.

### Data Isolation

- Each customer environment is logically isolated at the application layer.
- No customer data is used to train, fine-tune, or improve shared models without explicit written consent.
- Customers may request a data residency region (EU, UK, or US) at contract time.

### Data Retention

- Customer data is retained for the duration of the contract plus a 30-day grace period.
- At contract end, data is deleted and a deletion certificate is available on request.
- Audit logs are retained for 12 months by default; extended retention available.

---

## Access Controls

### Internal Access

- Production system access is restricted to on-call engineers via a privileged access management (PAM) system.
- All access to production environments is logged and reviewed quarterly.
- No standing access to customer data: access requires a support ticket and time-limited justification.

### Customer-Facing Access

- Role-based access control (RBAC) is available on all enterprise plans.
- Admins can define roles, restrict features, and audit user activity.
- Single sign-on (SSO) via SAML 2.0 is supported on Enterprise tier.
- Multi-factor authentication (MFA) is enforced for all user accounts.

---

## Human-in-the-Loop

For deployments involving AI-generated outputs in regulated workflows:

- We recommend and support a human review step before any AI output is acted upon.
- Our API returns confidence indicators and source citations to support informed human review.
- The platform does not automatically execute actions based on AI outputs — all automation requires explicit customer configuration.

---

## Audit Logging

- All user actions (logins, queries, document uploads, deletions) are logged with timestamp, user ID, and IP address.
- Logs are immutable and stored separately from application data.
- Audit logs are available to customer admins via the dashboard or API export.
- SIEM integration is available via log streaming (webhook or S3 export).

---

## PII Handling

- Our platform is designed to process business documents, not personal data.
- If a customer uploads documents containing PII, we recommend implementing a redaction step in their pipeline.
- We do not store personal data beyond what is required for user authentication.
- GDPR: we act as a data processor. A Data Processing Agreement (DPA) is available.
- UK GDPR and DPA 2018 compliance: confirmed.

---

## Certifications and Standards

**Current status (as of last review):**

- SOC 2 Type I: completed.
- SOC 2 Type II: in progress, expected completion Q3 2025.
- ISO 27001: gap assessment completed; certification roadmap in place.
- GDPR / UK GDPR: compliant as data processor.
- Cyber Essentials Plus: certified.

*Note: Certification status should be verified directly with our commercial team for the most current information, as audit cycles may update these dates.*

---

## Penetration Testing

- Annual third-party penetration test conducted by an accredited provider (CREST-certified).
- Most recent test: Q4 2024. No critical findings. Medium findings remediated within 30 days.
- Penetration test summary is available under NDA for enterprise customers.

---

## Incident Response

- Defined incident response plan with P1/P2/P3 severity levels.
- P1 (service outage or data breach): 1-hour response SLA, 4-hour resolution or escalation.
- Customers are notified of any breach affecting their data within 72 hours in accordance with GDPR requirements.
- Post-incident reports are provided for P1 and P2 incidents.

---

## Subprocessors

- A list of approved subprocessors is maintained and published in our Data Processing Agreement.
- Customers are notified of new subprocessors 30 days before onboarding.
- All subprocessors are assessed against our vendor security standards before approval.

---

## Questions We Commonly Receive

**Do you use customer data to train AI models?**
No. Customer data is never used to train, fine-tune, or update any shared model without explicit written consent.

**Where is data stored?**
By default, data is stored in the EU (Ireland region). UK-only and US regions are available on Enterprise plans.

**Can we conduct our own security assessment?**
Yes. We support customer security questionnaires and can arrange a technical call with our security team for enterprise prospects.

**Is the platform available in an air-gapped or private cloud deployment?**
Private cloud (VPC) deployment is available on Enterprise plans. Air-gapped deployment is on the roadmap.
