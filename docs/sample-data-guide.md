# Sample Data Guide

Describes each file in `sample-data/` and how it is used in the AI RFP demo.

---

## File overview

| File | Document type | Sector | Demo use case |
|------|--------------|--------|---------------|
| `fintech-aml-case-study.md` | Case study | Fintech | AML alert triage story, retrieval evidence |
| `legaltech-contract-review-case-study.md` | Case study | Legaltech | Contract review automation story |
| `enterprise-ai-security-note.md` | Security note | Enterprise AI | Security/compliance RFP questions |
| `implementation-playbook.md` | Playbook | Enterprise AI | Timeline and onboarding questions |
| `product-capability-overview.md` | Product overview | Enterprise AI | Capability and feature questions |
| `technical-architecture-note.md` | Technical note | Enterprise AI | Architecture and integration questions |
| `customer-success-notes.md` | Support guide | Enterprise AI | SLA and support model questions |
| `rfp-answer-library.md` | Answer library | Enterprise AI | Pre-written RFP answers |
| `proposal-methodology.md` | Methodology | Enterprise AI | Delivery approach questions |
| `integration-and-api-notes.md` | Integration notes | Enterprise AI | API and connector questions |

---

## Ingesting into the demo

All files can be ingested directly via the Documents upload page.

The app supports `.md` files natively — each file is chunked on `##` section
boundaries and embedded with `text-embedding-3-small`.

To seed the full sample dataset at once, use the **Load Sample Documents** button
on the Documents page, which ingests all 10 files automatically.

---

## Recommended test queries

After ingesting all sample files, try these queries to test retrieval and generation:

| Query | Expected primary source |
|-------|------------------------|
| How do you reduce AML review time? | fintech-aml-case-study |
| What is your standard implementation timeline? | implementation-playbook |
| Do you have SOC 2 certification? | enterprise-ai-security-note |
| Which case studies are relevant for a contract review pitch? | legaltech-contract-review-case-study |
| How does your API authentication work? | integration-and-api-notes |
| What support SLAs do you offer? | customer-success-notes |
| How do you handle PII in the platform? | enterprise-ai-security-note |
| What integrations do you support out of the box? | integration-and-api-notes, product-capability-overview |

---

## Adding new sample files

1. Add a spec to `scripts/generate-synthetic-samples.py` in the `SAMPLE_FILES` list
2. Run `python scripts/generate-synthetic-samples.py --file <filename>`
3. Run `python scripts/safety-check.py`
4. Review and edit the output
5. Commit the new file to `sample-data/`
6. Re-seed the app via the Documents page

---

## Disclaimer

All sample files are synthetic. See [synthetic-data-methodology.md](synthetic-data-methodology.md).
