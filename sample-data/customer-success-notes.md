# Customer Success Guide — Onboarding & Adoption

## Purpose

This document is an internal reference for customer success managers. It describes the common patterns of successful and unsuccessful deployments, key risk factors, and recommended practices for driving adoption.

---

## Onboarding Phases

### Week 1: Technical Setup

Key activities:
- API credentials provisioned and tested.
- Data pipeline confirmed (how documents flow into the system).
- Initial document ingestion of pilot document set.
- User accounts created for pilot users.

Common blockers:
- Data access delays (IT procurement, security review taking longer than expected).
- API key management policies adding friction.
- Document format issues (scanned PDFs, legacy file types).

Mitigation:
- Agree on data access plan during Phase 0.
- Offer format conversion support for common legacy formats.

### Week 2–3: Pilot

Key activities:
- Pilot users run live tasks through the platform.
- Daily check-ins to capture feedback.
- Calibration of confidence thresholds and extraction configuration.

Success signals:
- Users expressing time savings unprompted.
- Users starting to route real work through the tool.
- Requests to expand the pilot scope.

Warning signals:
- Users describing the tool as "interesting but not useful yet."
- Very low query volume (< 5 queries per user per day).
- Repeated feedback about the same false positive type — indicates a configuration issue.

### Week 4–8: Rollout

Common adoption blockers and how to address them:

| Blocker | Response |
|---------|----------|
| "I'm too busy to learn a new tool" | Show the time saving with a live demo of one real task |
| "I don't trust the output" | Walk through citation and source review features; emphasise human remains in the loop |
| "My manager hasn't approved this" | Escalate to customer champion; ensure executive sponsor is communicating value |
| "It doesn't work on my document type" | Check format and ingest settings; escalate to technical team if needed |

---

## Stakeholder Map

A typical enterprise deployment involves:

| Role | Concern | How to Address |
|------|---------|----------------|
| Economic buyer (CFO/COO) | ROI, cost per use case | Quantify time savings × FTE rate at 12 weeks |
| Business champion | Day-to-day friction, team buy-in | Early involvement in pilot design; credit them with results |
| Technical lead (IT/Engineering) | Security, integration, data flow | Provide security overview, architecture note, penetration test summary |
| End users | Ease of use, workflow fit, trust | Training session, quick-start guide, highlight wins early |
| Legal/Compliance | Data handling, audit trail, human oversight | Security & compliance note, DPA, explanation of human-in-the-loop design |

---

## Training Requirements

- Live onboarding session: 45–60 minutes per user group (max 12 users per session).
- Topics: platform overview, query interface, interpreting results, source review, feedback mechanism.
- Self-service resources: quick-start guide, FAQ, video walkthrough (10 minutes).
- For regulated workflows: additional session on how to document AI-assisted decisions for audit purposes.

---

## Adoption Metrics

We track the following signals to assess deployment health:

| Metric | Healthy Range | Warning Threshold |
|--------|--------------|-------------------|
| Weekly active users / total users | >60% at 30 days | <30% at 30 days |
| Queries per active user per week | >10 | <5 |
| User feedback positive rate | >70% | <50% |
| Override rate (AI output not used) | <25% | >50% |
| Repeat queries (same question re-asked) | <10% | >30% |

---

## Common Failure Modes

### 1. Tool used only for demos, not for real work
**Symptom:** High query volume in week 1, low in week 3.
**Root cause:** Pilot was not using real representative tasks.
**Fix:** Rerun onboarding with actual workload. Reassign pilot users.

### 2. Single-user dependency ("hero syndrome")
**Symptom:** One user has 80%+ of queries; others not using.
**Root cause:** Insufficient rollout communication; champion not enabling peers.
**Fix:** Engage champion to run a peer demo session. Offer peer-to-peer training.

### 3. Config drift
**Symptom:** Accuracy degrades over time; users report increasing false positives.
**Root cause:** Document types or language has evolved; model not updated.
**Fix:** Review recent low-rated outputs. Reconfigure extraction targets or request model update.

### 4. Stakeholder change
**Symptom:** Project stalls mid-deployment; communication becomes difficult.
**Root cause:** Champion or economic buyer has changed role.
**Fix:** Re-establish sponsor relationship at new level. Summarise value delivered to date.

---

## QBR (Quarterly Business Review) Framework

Topics for a 60-minute QBR:

1. Usage metrics (10 min): queries, documents, active users.
2. Business outcomes (15 min): time savings, use cases where tool delivered value.
3. Quality review (10 min): feedback ratings, accuracy trends, notable false positives.
4. Roadmap preview (10 min): upcoming features relevant to customer.
5. Blockers and requests (10 min): open issues, feature requests.
6. Plan for next quarter (5 min): agreed goals and expansion opportunities.

---

## Escalation Path

- User issue → in-app feedback or support@[company].com → 24h response.
- Technical issue → dedicated Slack channel or support ticket → 4h response (business hours).
- Billing or contract issue → account manager.
- P1 (service outage) → 1h response SLA, paged to on-call team.
