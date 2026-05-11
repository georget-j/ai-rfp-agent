#!/usr/bin/env python3
"""
generate-synthetic-samples.py
Generates fictional synthetic sample markdown files for the public demo using GPT-4o-mini.

Usage:
    python scripts/generate-synthetic-samples.py [--file <filename>] [--all] [--force]

    --file fintech-aml-case-study.md   generate a specific file
    --all                              generate all missing files
    --force                            overwrite existing files

Reads OPENAI_API_KEY from .env.local.
Writes drafts to sample-data/*.md.

IMPORTANT: Generated files must be manually reviewed before committing.
Run safety-check.py after generation.
"""

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
SAMPLE_DIR = REPO_ROOT / "sample-data"
ANALYSIS_FILE = REPO_ROOT / "research" / "analysis" / "source-pattern-notes.md"
ENV_FILE = REPO_ROOT / ".env.local"

DISCLAIMER = (
    "\n---\n\n"
    "> **Synthetic data notice:** This document is fictional and created for "
    "demonstration purposes only. It does not represent real customers, real contracts, "
    "real certifications, or real commercial outcomes. Northstar AI is a fictional company. "
    "All metrics, customer names, and implementation details are invented."
)

NORTHSTAR_CONTEXT = """
FICTIONAL COMPANY CONTEXT (use throughout all generated files):

Company: Northstar AI
Product: An AI workflow platform for regulated enterprise teams.
Capabilities:
  - Document ingestion and semantic search
  - AI-assisted review and triage
  - Workflow automation with human-in-the-loop approval gates
  - Audit trail generation and compliance logging
  - API integrations (REST, webhook, Salesforce, ServiceNow)
  - Reporting dashboards and analytics
  - Implementation support and change management

Target sectors: fintech AML operations, legal contract review, enterprise knowledge workflows.

Fictional customers to use:
  - Meridian Bank (fintech / AML)
  - Harrington Shaw LLP (legaltech / contract review)
  - Atlas Markets (fintech / compliance)
  - Lumen Insurance (enterprise AI)
  - Northbridge Legal (legaltech / workflow)

CERTIFICATION RULES:
  - Do NOT say "SOC 2 certified" or "ISO 27001 certified"
  - Instead write "SOC 2 Type II readiness workstream underway" or "ISO 27001 alignment in progress"
  - Do NOT invent regulatory approvals
  - You MAY say "designed to support GDPR compliance" or "aligned with FCA guidance"

ALL METRICS MUST BE FICTIONAL. Example acceptable metrics:
  - "reduced AML review time by 58%"
  - "cut contract review cycle from 14 days to 2.5 days"
  - "98.7% alert triage accuracy in UAT"
  Do not attribute metrics to real organisations.
"""

SYSTEM_PROMPT = f"""You are a B2B enterprise AI company technical writer.
You write realistic, professionally structured markdown documents for a public product demo.

{NORTHSTAR_CONTEXT}

CRITICAL RULES:
1. All content must be entirely fictional and original.
2. Do not reproduce, closely paraphrase, or reference text from real RFP documents, proposals, or third-party sources.
3. Do not include real company names, real customer names, real vendor names, or real certification claims.
4. Do not include confidentiality notices, copyright legends, or legal disclaimers from third parties.
5. Use realistic but clearly invented metrics and examples.
6. Write in professional B2B enterprise tone.
7. Produce well-structured markdown with clear headings.
8. Target 500–1000 words per document (suitable for RAG retrieval).
9. End every document with exactly this line (do not modify it):
   > **Synthetic data notice:** This document is fictional and created for demonstration purposes only. It does not represent real customers, real contracts, real certifications, or real commercial outcomes. Northstar AI is a fictional company. All metrics, customer names, and implementation details are invented.
"""

# Per-file generation specs
SAMPLE_FILES: list[dict] = [
    {
        "filename": "fintech-aml-case-study.md",
        "prompt": """Write a case study markdown document for Northstar AI's fintech AML use case.

Frontmatter:
---
title: Fintech AML Case Study — Reducing Alert Review Time with AI-Assisted Triage
document_type: case_study
sector: fintech
fictional_company: Northstar AI
fictional_customer: Meridian Bank
use_case: aml_alert_triage
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Customer Context
## The Problem
## The Solution
## Implementation Approach
## Workflow
## Results
## Risks and Controls
## Human-in-the-Loop Review
## Data and Integration Requirements
## Lessons Learned
## Reusable RFP Evidence Points
## Open Questions for Prospect Calls

End with the required synthetic data notice.""",
    },
    {
        "filename": "legaltech-contract-review-case-study.md",
        "prompt": """Write a case study markdown document for Northstar AI's legaltech contract review use case.

Frontmatter:
---
title: Legaltech Case Study — AI-Assisted Contract Review for a Mid-Size Law Firm
document_type: case_study
sector: legaltech
fictional_company: Northstar AI
fictional_customer: Harrington Shaw LLP
use_case: contract_review_automation
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Customer Context
## The Problem
## The Solution
## Implementation Approach
## Workflow
## Results
## Risks and Controls
## Human-in-the-Loop Review
## Data and Integration Requirements
## Lessons Learned
## Reusable RFP Evidence Points
## Open Questions for Prospect Calls

End with the required synthetic data notice.""",
    },
    {
        "filename": "enterprise-ai-security-note.md",
        "prompt": """Write a security and compliance note for Northstar AI's enterprise AI platform.

Frontmatter:
---
title: Enterprise AI Security and Compliance Note
document_type: security_note
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: security_compliance_overview
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Data Handling and Storage
## Access Control and Authentication
## Audit Logging
## Human Review and Override Controls
## PII Handling
## Model Usage and Governance
## Deployment Assumptions
## Customer Responsibilities
## Planned Certifications and Compliance Roadmap
## Security Questions for RFP Follow-Up

End with the required synthetic data notice.""",
    },
    {
        "filename": "implementation-playbook.md",
        "prompt": """Write an implementation playbook for Northstar AI's enterprise onboarding process.

Frontmatter:
---
title: Implementation Playbook — Northstar AI Enterprise Onboarding
document_type: implementation_playbook
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: enterprise_implementation
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Pre-Implementation Requirements
## Implementation Phases
## Phase 1: Discovery and Configuration (Weeks 1–2)
## Phase 2: Integration and Data Ingestion (Weeks 3–4)
## Phase 3: User Acceptance Testing (Weeks 5–6)
## Phase 4: Go-Live and Hypercare (Week 7–8)
## Customer Obligations
## Risk Register
## Change Management
## Go-Live Criteria
## Post-Go-Live Support Model

End with the required synthetic data notice.""",
    },
    {
        "filename": "product-capability-overview.md",
        "prompt": """Write a product capability overview for Northstar AI's platform.

Frontmatter:
---
title: Product Capability Overview — Northstar AI Platform
document_type: product_overview
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: product_capabilities
created_for: public_demo
synthetic: true
---

Include these sections:
## Platform Overview
## Core Capabilities
## Document Ingestion and Processing
## Semantic Search and Retrieval
## AI-Assisted Review
## Workflow Automation
## Human-in-the-Loop Controls
## Audit Trail and Reporting
## Integrations
## Supported File Types
## Deployment Options
## Roadmap Highlights

End with the required synthetic data notice.""",
    },
    {
        "filename": "technical-architecture-note.md",
        "prompt": """Write a technical architecture note for Northstar AI's platform.

Frontmatter:
---
title: Technical Architecture Note — Northstar AI Platform
document_type: technical_note
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: technical_architecture
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Architecture Principles
## Data Flow
## Document Ingestion Pipeline
## Embedding and Retrieval Layer
## AI Generation Layer
## Security Architecture
## Data Residency and Storage
## API and Integration Architecture
## Scalability and Performance
## Monitoring and Observability
## Disaster Recovery and Business Continuity
## Technical Assumptions

End with the required synthetic data notice.""",
    },
    {
        "filename": "customer-success-notes.md",
        "prompt": """Write a customer success and support notes document for Northstar AI.

Frontmatter:
---
title: Customer Success and Support Notes — Northstar AI
document_type: customer_success_notes
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: customer_success_support
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Customer Success Model
## Onboarding and Enablement
## Ongoing Support Tiers
## Service Level Commitments
## Escalation Path
## Quarterly Business Reviews
## Customer Success Metrics
## Common Support Scenarios
## Self-Service Resources
## Support Contacts and Response Times

End with the required synthetic data notice.""",
    },
    {
        "filename": "rfp-answer-library.md",
        "prompt": """Write an RFP answer library for Northstar AI — a collection of pre-approved responses to common RFP questions.

Frontmatter:
---
title: RFP Answer Library — Northstar AI Standard Responses
document_type: rfp_answer_library
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: rfp_response_library
created_for: public_demo
synthetic: true
---

Include pre-written answer blocks for these common RFP sections:
## How to Use This Library
## Implementation Timeline
## Security and Data Handling
## Integration Capabilities
## Support Model and SLAs
## Model Governance and Explainability
## Reporting and Analytics
## Change Management and Training
## Commercial Assumptions and Caveats
## Questions Requiring Confirmation Before Response

Each section should contain a short standard answer paragraph that a bid team could use or adapt.
End with the required synthetic data notice.""",
    },
    {
        "filename": "proposal-methodology.md",
        "prompt": """Write a proposal and delivery methodology document for Northstar AI.

Frontmatter:
---
title: Proposal and Delivery Methodology — Northstar AI
document_type: proposal_methodology
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: proposal_delivery_methodology
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Our Approach to RFP Responses
## Delivery Philosophy
## Agile Implementation Methodology
## Discovery Phase
## Design and Configuration Phase
## Testing and Validation Phase
## Deployment and Hypercare Phase
## How We Measure Success
## Continuous Improvement
## Risk Management Approach
## Governance and Reporting

End with the required synthetic data notice.""",
    },
    {
        "filename": "integration-and-api-notes.md",
        "prompt": """Write an integration and API notes document for Northstar AI's platform.

Frontmatter:
---
title: Integration and API Notes — Northstar AI Platform
document_type: integration_notes
sector: enterprise_ai
fictional_company: Northstar AI
fictional_customer: null
use_case: integrations_api
created_for: public_demo
synthetic: true
---

Include these sections:
## Overview
## Integration Philosophy
## Available Integrations
## REST API Overview
## Authentication and Security
## Webhook Support
## CRM Integrations (Salesforce, HubSpot)
## ITSM Integrations (ServiceNow, Jira)
## Document Management Integrations
## Data Ingestion Connectors
## Rate Limits and Quotas
## Integration Roadmap
## Integration Support

End with the required synthetic data notice.""",
    },
]


def load_env() -> str | None:
    """Load OPENAI_API_KEY from .env.local."""
    if not ENV_FILE.exists():
        return None
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith("OPENAI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def load_pattern_notes() -> str:
    """Load pattern notes if available, otherwise return empty string."""
    if ANALYSIS_FILE.exists():
        return ANALYSIS_FILE.read_text(encoding="utf-8")[:4000]  # trim to fit context
    return "(Pattern analysis not yet available — generating from company context only.)"


def generate_file(spec: dict, api_key: str, pattern_notes: str, force: bool = False) -> bool:
    """Generate a single sample file. Returns True on success."""
    try:
        from openai import OpenAI
    except ImportError:
        print("ERROR: openai not installed — run: pip install openai")
        return False

    out_path = SAMPLE_DIR / spec["filename"]

    if out_path.exists() and not force:
        print(f"  [skip]  {spec['filename']} — already exists (use --force to overwrite)")
        return True

    print(f"  [gen]   {spec['filename']}…")

    client = OpenAI(api_key=api_key)

    user_message = f"""Pattern analysis from public RFP source research (structural reference only):

{pattern_notes}

---

{spec['prompt']}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
    except Exception as e:
        print(f"  [fail]  OpenAI API error: {e}")
        return False

    content = response.choices[0].message.content or ""

    # Ensure disclaimer is present
    if "Synthetic data notice" not in content:
        content += DISCLAIMER

    out_path.write_text(content, encoding="utf-8")
    words = len(content.split())
    print(f"  [ok]    {spec['filename']} ({words} words)")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic sample files")
    parser.add_argument("--file", help="Generate a specific file by filename")
    parser.add_argument("--all", action="store_true", help="Generate all missing files")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    if not args.file and not args.all:
        parser.print_help()
        print("\nExample: python scripts/generate-synthetic-samples.py --all")
        sys.exit(0)

    api_key = load_env()
    if not api_key:
        print("ERROR: OPENAI_API_KEY not found in .env.local")
        sys.exit(1)

    pattern_notes = load_pattern_notes()

    if args.file:
        specs = [s for s in SAMPLE_FILES if s["filename"] == args.file]
        if not specs:
            names = [s["filename"] for s in SAMPLE_FILES]
            print(f"ERROR: Unknown file '{args.file}'. Available:\n  " + "\n  ".join(names))
            sys.exit(1)
    else:
        specs = SAMPLE_FILES

    print(f"generate-synthetic-samples.py — {len(specs)} file(s) to generate\n")
    ok, failed = 0, 0

    for spec in specs:
        success = generate_file(spec, api_key, pattern_notes, force=args.force)
        if success:
            ok += 1
        else:
            failed += 1

    print(f"\nDone: {ok} generated, {failed} failed")
    if ok:
        print("\nNEXT STEPS:")
        print("  1. Review generated files in sample-data/")
        print("  2. Run: python scripts/safety-check.py")
        print("  3. Fix any flagged issues")
        print("  4. Manually review and edit before committing")


if __name__ == "__main__":
    main()
