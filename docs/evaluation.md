# Evaluation — Retrieval and Generation Quality

This document tracks test queries against the sample dataset, expected retrieval behaviour, and observed output quality. The goal is to be honest about where the system works well, where it's shaky, and what would need to change to make it production-grade.

---

## Test Cases

### 1 — AML review time reduction

**Query:** "Draft a response to a fintech customer asking how we reduce AML review time."

**Expected source documents:**
- Fintech AML Case Study — Meridian Digital Bank (primary)
- Product Capability Overview (secondary)
- Customer Success Guide (secondary)

**What a good response looks like:**
- Cites the 35% faster review time from the case study — doesn't invent it
- Cites the 22% reduction in escalations if it's in the source — doesn't pad the number
- Confidence: high (there's a directly relevant case study)
- Missing information: flags that it doesn't know the customer's current baseline alert volume or review time

**Pass / fail:**
- ✓ Fintech AML chunk is the top retrieved result
- ✓ Metric is cited with source, not invented or inflated
- ✓ Missing info includes something about customer-specific baseline
- ✗ Fail if a metric appears without a citation

---

### 2 — SOC 2 certification

**Query:** "Do we have SOC 2 certification?"

**Expected source documents:**
- Enterprise AI Security & Compliance Overview (primary)
- RFP Answer Library (secondary)

**What a good response looks like:**
- Correctly distinguishes SOC 2 Type I (completed) from Type II (in progress)
- Does not claim Type II is complete
- Recommends verifying current status with the commercial team before sending to a customer
- Confidence: medium-high (information is in the source but needs a caveat)

**Pass / fail:**
- ✓ Type I vs Type II distinction is made correctly
- ✓ Does not claim Type II is complete
- ✓ Includes a verification caveat
- ✗ Fail if it claims SOC 2 Type II certification without qualification

---

### 3 — Legaltech case study

**Query:** "Which case studies are relevant to a legaltech workflow automation pitch for contract review?"

**Expected source documents:**
- Legaltech Case Study — Contract Review Automation (primary)
- Product Capability Overview (secondary)

**What a good response looks like:**
- Retrieves the Ashbridge & Partners case study
- Cites the 40% reduction in first-pass review time with source
- Confidence: high (direct match)

**Pass / fail:**
- ✓ Legaltech case study is retrieved
- ✓ 40% metric cited with source
- ✗ Fail if the fintech case study is returned instead of legaltech

---

### 4 — Off-topic / hallucination test

**Query:** "Can this platform help with hospital staffing optimisation and NHS workforce planning?"

**Expected source documents:** None — there are no healthcare documents in the sample set.

**What a good response looks like:**
- Confidence: low
- Acknowledges limited evidence explicitly
- Missing information: flags the absence of healthcare or NHS-relevant case studies or capabilities
- Does not invent a healthcare pitch

**Pass / fail:**
- ✓ Confidence is low
- ✓ Missing info flags the absence of healthcare evidence
- ✓ Response does not claim capabilities that aren't in the source material
- ✗ Fail if any healthcare capabilities are described as if they exist

This is the most important test. If an AI tool passes the on-topic tests but fails this one, it's not safe for enterprise use.

---

### 5 — Implementation timeline

**Query:** "What is our standard implementation timeline and what do we require from the customer?"

**Expected source documents:**
- Implementation Playbook — Standard Deployment Process (primary)
- Customer Success Guide (secondary)
- RFP Answer Library (secondary)

**What a good response looks like:**
- Cites the 8–12 week timeline
- Lists customer requirements (technical POC, business champion, pilot users)
- Confidence: high (playbook covers this directly)
- Missing information: minimal

**Pass / fail:**
- ✓ 8–12 week timeline cited from playbook
- ✓ Customer requirements listed from source
- ✗ Fail if timeline is significantly different from the source

---

## Known failure modes

**Threshold too low.** Setting the similarity threshold below 0.35 starts pulling in weakly related chunks that degrade the response. Worth monitoring — if you're getting irrelevant citations, raise the threshold.

**No documents loaded.** If the knowledge base is empty, the API returns a low-confidence response with no citations. The UI handles this with an empty state prompt, but it's worth testing explicitly.

**LLM inventing citation IDs.** The model is instructed to cite only chunk IDs from the retrieved set, but this isn't server-verified. Occasionally it cites a chunk ID that wasn't retrieved. Adding a post-generation check against the retrieved IDs is a straightforward improvement.

**Confidence calibration is approximate.** The confidence level is assigned by the model based on how well the retrieved content answers the question. It generally correlates with retrieval similarity scores but isn't formally calibrated — high similarity (>0.85) usually means high confidence, but not always.

**Long questions.** RFP questions over ~500 words produce embeddings that are less precise because they cover too many topics at once. Shorter, focused queries retrieve better.

---

## Current configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| Match count | 6 | Maximum chunks retrieved per query |
| Similarity threshold | 0.3 | Chunks below this score are excluded |
| Embedding model | text-embedding-3-small | 1536 dimensions |
| Max chunk size | ~1,500 chars | Section-aware; splits on `##`/`###` boundaries |
| Chunk overlap | 150 chars | Applied within long sections only |

---

## What would improve this

**Hybrid search.** Adding a full-text search fallback alongside the vector search would help with exact-match queries (e.g., looking for a specific product name or acronym that might not embed well).

**Cross-encoder reranking.** A reranker pass after initial retrieval would improve precision, especially when the top retrieved chunks are from different documents with similar similarity scores.

**Citation verification.** A server-side check that every chunk ID in the LLM's response actually exists in the retrieved set would catch the occasional hallucinated citation.

**Evaluation harness.** Automating the above test cases — running the query, checking whether the expected documents appear in retrieval, flagging confidence-level mismatches — would make regression testing practical.

**Feedback loop.** Capturing user feedback on response quality and using it to tune the similarity threshold or prompt would let the system improve over time.
