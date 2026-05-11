# Case Study: AI-Assisted AML Review Triage — Meridian Digital Bank

## Customer Overview

**Customer:** Meridian Digital Bank (fictional)
**Sector:** Fintech — digital retail banking
**Geography:** UK & Ireland
**Size:** ~800 staff, 1.2 million retail customers

## Business Problem

Meridian Digital Bank's AML (Anti-Money Laundering) compliance team was overwhelmed by a growing volume of transaction monitoring alerts. The existing rule-based detection system was generating approximately 4,200 alerts per month, with a manual review team of 12 analysts.

Key pain points:

- **Alert backlog:** Review queue regularly exceeded 30-day regulatory requirement.
- **Low signal-to-noise ratio:** Only 6–8% of alerts resulted in a Suspicious Activity Report (SAR). Analysts spent most of their time dismissing low-risk alerts.
- **Inconsistent decisions:** Different analysts were applying different thresholds, creating audit trail inconsistencies.
- **Regulatory pressure:** The FCA had issued a findings letter citing documentation quality as a concern in the previous review cycle.

## Solution

We deployed an AI-assisted triage layer on top of the existing transaction monitoring system.

### How it worked:

1. **Ingestion:** Incoming alerts were pulled from the existing AML platform via API.
2. **Enrichment:** Each alert was enriched with customer risk profile, transaction history patterns, and peer group comparisons.
3. **AI triage:** A trained classification model assigned each alert a priority score (high / medium / low) and generated a one-paragraph narrative explaining the key risk factors.
4. **Human review:** Analysts reviewed the AI-generated narrative alongside the raw alert data. High-priority alerts were surfaced first.
5. **Feedback loop:** Analyst decisions were captured and used to retrain the model quarterly.

### Human-in-the-loop design:

The system was explicitly designed so that no SAR decision was made by the AI. All final decisions remained with the analyst. The AI provided a triage recommendation and supporting narrative only.

## Outcomes

After 6 months of deployment:

- **35% reduction in mean review time per alert:** From 28 minutes to 18 minutes per alert on average.
- **22% reduction in escalations to the SAR team:** By correctly triaging a larger proportion of low-risk alerts to lower priority queues.
- **Improved audit trail:** AI-generated narratives provided a consistent, documented rationale for every reviewed alert.
- **SAR detection rate maintained:** Despite faster reviews, the SAR submission rate held steady at 7.1%, indicating no degradation in detection quality.
- **Analyst satisfaction:** Post-deployment survey showed 78% of analysts agreed the tool made their work more manageable.

## Implementation Timeline

- **Week 1–2:** Discovery and data access setup.
- **Week 3–6:** Model training on historical alert and decision data.
- **Week 7–8:** Integration with existing AML platform and UAT.
- **Week 9:** Pilot with 2 analysts.
- **Week 10–12:** Phased rollout to full team.

## Key Risk Mitigations

- Model decisions were explainable: every score was accompanied by a narrative.
- Bias audit was conducted before deployment: no significant demographic skew observed.
- Fallback mode: if the AI service was unavailable, alerts reverted to standard manual queue.
- Data residency: all processing occurred within the EU, in compliance with Meridian's data handling policy.

## Technology Stack

- Hosted AI service with private endpoint.
- No customer PII left the bank's secure environment.
- Integration via REST API.
- Model monitored for drift on a monthly basis.

## Quotes

"The tool hasn't replaced our analysts — it's made them sharper. They spend less time on obvious low-risk cases and more time on the ones that actually matter." — Head of Financial Crime Compliance, Meridian Digital Bank
