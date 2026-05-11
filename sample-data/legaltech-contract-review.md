# Case Study: AI-Assisted Contract Review — Ashbridge & Partners LLP

## Customer Overview

**Customer:** Ashbridge & Partners LLP (fictional)
**Sector:** Commercial law — mid-size UK law firm
**Practice areas:** M&A, real estate, commercial contracts
**Size:** ~220 lawyers, offices in London and Manchester

## Business Problem

Ashbridge's corporate team was experiencing significant bottlenecks in the first-pass review of commercial contracts. Junior associates and paralegals spent a large portion of their time on routine contract review tasks that were high-volume but low-complexity — largely checking for standard clause presence, identifying deviations from firm playbooks, and flagging unusual indemnity or liability positions.

Key pain points:

- **First-pass review time:** Average commercial contract (50–80 pages) took 3.5–4.5 hours for a first-pass review by a junior associate.
- **Playbook deviation rate:** Partners estimated 60–70% of their review time on standard contracts was spent on issues that could be identified by a checklist.
- **Capacity constraint:** The team was turning down mid-market M&A support work due to associate bandwidth.
- **Inconsistency:** Different associates applied firm playbook standards differently, leading to rework when contracts reached partner review.

## Solution

We deployed a contract review assistant that performed automated first-pass extraction and risk flagging on standard commercial agreements.

### Capabilities deployed:

1. **Clause extraction:** Identified and extracted 48 standard clause types (limitation of liability, indemnity, governing law, termination rights, IP ownership, data protection, force majeure, etc.).
2. **Playbook comparison:** Each extracted clause was compared against the firm's negotiation playbook. Deviations were classified as: standard / minor deviation / significant deviation / missing clause.
3. **Risk summary:** A one-page summary was generated for each contract, showing clause-by-clause status and flagging items requiring associate or partner attention.
4. **Redline suggestions:** For a subset of clause types (limitation of liability, indemnity), the tool proposed alternative playbook language.

### Human workflow integration:

The output was formatted as a structured review memo that slotted into the firm's existing document management system. Associates reviewed the AI summary alongside the original contract. Partners reviewed the associate's annotations on top of the AI output.

## Outcomes

After 5 months of deployment across the commercial contracts team:

- **40% reduction in average first-pass review time:** From 4.0 hours to 2.4 hours per contract.
- **Playbook consistency:** Post-deployment, the variance in clause flagging between associates dropped by 62% as measured by partner re-review rate.
- **Capacity recovered:** The team was able to take on 3 additional mid-market M&A mandates in the first quarter post-deployment, representing approximately £240,000 in additional fee income.
- **False positive rate:** 11% of AI-flagged deviations were assessed by associates as non-material on review. Considered acceptable for a first-pass tool.

## Implementation Timeline

- **Phase 1 (Weeks 1–3):** Playbook digitisation — firm's standard positions were converted into structured clause criteria.
- **Phase 2 (Weeks 4–6):** Model training on 1,200 historical contracts (anonymised).
- **Phase 3 (Weeks 7–8):** Pilot with 4 associates on live contracts. Feedback incorporated.
- **Phase 4 (Weeks 9–12):** Full rollout to commercial contracts team.

## Data Handling

- All documents were processed within a private deployment. No data was sent to shared AI infrastructure.
- Client documents were never used to train or update any shared model.
- Retention policy: AI outputs were deleted on the same schedule as the underlying matter documents.

## Key Learnings

- Playbook digitisation was the highest-effort phase, but also the highest-value. Without structured playbooks, the tool's comparison output was limited.
- Associate buy-in was stronger when the tool was positioned as a first-pass assistant, not a checker. The framing mattered.
- The false positive rate improved from 18% in week 1 to 11% by month 3 as the model was tuned to the firm's specific clause library.

## Quote

"The first-pass summary is now a standard part of how we work. The value isn't in the AI being perfect — it's in having a structured starting point so the associate can focus their attention on what actually needs judgment." — Head of Commercial Contracts, Ashbridge & Partners LLP
