# Synthetic Data Methodology

This document explains how the sample documents in `sample-data/` were created.

---

## Summary

The public demo uses **fictional sample data only**.

Public RFP/proposal documents were used as structural references to understand common
enterprise proposal document types and section patterns. No third-party proposal text
is intentionally reproduced in any committed file.

---

## Approach

### 1. Source research (private, gitignored)

A curated list of publicly available RFP templates, procurement documents, and
regulatory frameworks was assembled in `research/sources.yaml`. These include:

- UK government G-Cloud and Crown Commercial Service templates (Open Government Licence)
- US NASPO and state procurement RFP templates (public domain)
- NIST AI Risk Management Framework (US government public domain)
- UK ICO AI guidance (Open Government Licence)
- EU AI Act procurement guidance (EU Commission public document)
- FINRA AML compliance guidance (public regulatory document)
- Law Society legal technology framework (publicly published guidance)

Raw downloaded files are stored in `research/raw/` which is permanently **gitignored**.
Extracted text is stored in `research/extracted/` which is also **gitignored**.

### 2. Pattern analysis (private, gitignored)

The `scripts/analyze-patterns.py` script analyses the extracted text to identify:
- Common document section types
- Typical heading structures
- Language register and tone

The output (`research/analysis/source-pattern-notes.md`) contains **no source text** —
only structural patterns and section frequency counts.

### 3. Synthetic generation

The `scripts/generate-synthetic-samples.py` script uses OpenAI's `gpt-4o-mini` to
generate fictional markdown documents. The model is given:

- The structural patterns from the analysis step
- A fictional company context (Northstar AI)
- Fictional customer names (Meridian Bank, Harrington Shaw LLP, etc.)
- Explicit instructions **not** to reproduce source text, real company names,
  real certifications, or proprietary claims

### 4. Safety check

The `scripts/safety-check.py` script checks generated files for:
- Forbidden phrases (confidential, proprietary, etc.)
- Real company names from source documents
- Source URLs
- Approximate text similarity against extracted source content (flagging > 60% match)

### 5. Manual review

All generated files are manually reviewed before being committed to Git.

---

## What the sample files are

The files in `sample-data/` are:

- **Entirely fictional** — invented company, invented customers, invented metrics
- **Structurally realistic** — modelled on common B2B enterprise document patterns
- **Safe for public use** — no proprietary content, no real customer names, no real certifications
- **Designed for RAG testing** — structured with clear headings, concise sections,
  and grounded factual claims for retrieval testing

---

## What the sample files are not

- Not real proposals or RFP responses
- Not based on any specific company's confidential documents
- Not representations of real products, real customers, or real commercial outcomes
- Not legal or compliance advice

---

## Fictional company and customers

| Entity | Role |
|--------|------|
| Northstar AI | Fictional vendor / product company |
| Meridian Bank | Fictional fintech / AML customer |
| Harrington Shaw LLP | Fictional legaltech customer |
| Atlas Markets | Fictional fintech / compliance customer |
| Lumen Insurance | Fictional enterprise AI customer |
| Northbridge Legal | Fictional legaltech customer |

---

## Disclaimer

> **These sample documents are synthetic and created for demonstration purposes.
> They do not represent real customers, real contracts, real certifications,
> or real commercial outcomes. Northstar AI is a fictional company.
> All metrics, customer names, and implementation details are invented.**

---

## Running the pipeline

```bash
# Install Python dependencies (research only)
pip install -r requirements-research.txt

# 1. Download source documents (stored in research/raw/ — gitignored)
python scripts/fetch-sources.py

# 2. Extract text from source documents (stored in research/extracted/ — gitignored)
python scripts/extract-text.py

# 3. Analyse patterns (writes research/analysis/source-pattern-notes.md)
python scripts/analyze-patterns.py

# 4. Generate synthetic sample files (writes sample-data/*.md)
python scripts/generate-synthetic-samples.py --all

# 5. Run safety check (writes research/analysis/safety-check-report.md)
python scripts/safety-check.py

# 6. Review the safety check report and manually edit sample files
# 7. Commit only sample-data/ and docs/ — never research/raw/ or research/extracted/
```
