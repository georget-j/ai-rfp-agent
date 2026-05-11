#!/usr/bin/env python3
"""
analyze-patterns.py
Analyzes extracted source documents for common RFP/proposal section patterns.

Usage:
    python scripts/analyze-patterns.py

Reads: research/extracted/*.txt
Writes: research/analysis/source-pattern-notes.md

IMPORTANT: The output report contains NO source text — only structural patterns,
section heading counts, and metadata observations.
"""

import re
import sys
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
EXTRACTED_DIR = REPO_ROOT / "research" / "extracted"
ANALYSIS_DIR = REPO_ROOT / "research" / "analysis"
OUTPUT_FILE = ANALYSIS_DIR / "source-pattern-notes.md"

# Regex patterns that suggest a section heading
HEADING_PATTERNS = [
    re.compile(r"^\s*#{1,4}\s+(.+)$"),           # Markdown headings
    re.compile(r"^\s*(\d+\.[\d.]*\s+[A-Z].+)$"),  # Numbered sections: 1.2 Title
    re.compile(r"^\s*([A-Z][A-Z\s]{4,})\s*$"),    # ALL CAPS headings
    re.compile(r"^\s*([A-Z][a-z].{3,50})\s*:\s*$"),  # Title Case heading with colon
]

# Common proposal/RFP section heading keywords to look for
KNOWN_SECTION_KEYWORDS = [
    "executive summary", "overview", "introduction", "background",
    "scope of work", "scope of services", "statement of work",
    "technical approach", "technical solution", "methodology",
    "implementation", "implementation plan", "deployment",
    "project plan", "timeline", "schedule", "milestones",
    "security", "data security", "information security", "compliance",
    "certifications", "accreditations",
    "experience", "case studies", "references", "past performance",
    "pricing", "commercial", "cost", "fees", "investment",
    "team", "key personnel", "staff", "resources",
    "support", "maintenance", "service level", "sla",
    "integrations", "api", "technical requirements",
    "risk", "risk management", "assumptions", "dependencies",
    "evaluation", "acceptance criteria", "quality assurance",
    "governance", "reporting", "audit", "monitoring",
    "change management", "training", "onboarding",
    "legal", "terms", "contractual", "warranties",
    "appendix", "exhibit", "attachment", "annexure",
]


def extract_headings(text: str) -> list[str]:
    """Extract likely section headings from document text."""
    headings = []
    for line in text.splitlines():
        line = line.strip()
        if len(line) < 4 or len(line) > 120:
            continue
        for pattern in HEADING_PATTERNS:
            m = pattern.match(line)
            if m:
                heading = m.group(1).strip().lower()
                if len(heading) > 3:
                    headings.append(heading)
                break
    return headings


def match_keyword(heading: str) -> str | None:
    """Match a heading to a known section keyword category."""
    heading_lower = heading.lower()
    for kw in KNOWN_SECTION_KEYWORDS:
        if kw in heading_lower:
            return kw
    return None


def analyze_document(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    words = len(text.split())
    headings = extract_headings(text)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    avg_para_len = sum(len(p.split()) for p in paragraphs) / max(len(paragraphs), 1)

    matched_sections = []
    for h in headings:
        kw = match_keyword(h)
        if kw:
            matched_sections.append(kw)

    return {
        "word_count": words,
        "heading_count": len(headings),
        "headings": headings,
        "matched_sections": matched_sections,
        "paragraph_count": len(paragraphs),
        "avg_para_words": round(avg_para_len, 1),
    }


def main() -> None:
    files = sorted(EXTRACTED_DIR.glob("*.txt"))

    if not files:
        print("No extracted files found — run extract-text.py first")
        sys.exit(0)

    print(f"analyze-patterns.py — analyzing {len(files)} documents\n")

    all_headings: list[str] = []
    all_sections: list[str] = []
    doc_stats: list[dict] = []

    for path in files:
        print(f"  analyzing {path.name}…")
        stats = analyze_document(path)
        stats["filename"] = path.name
        doc_stats.append(stats)
        all_headings.extend(stats["headings"])
        all_sections.extend(stats["matched_sections"])

    heading_counter = Counter(all_headings)
    section_counter = Counter(all_sections)

    top_headings = heading_counter.most_common(40)
    top_sections = section_counter.most_common(len(KNOWN_SECTION_KEYWORDS))

    avg_words = sum(d["word_count"] for d in doc_stats) / len(doc_stats)
    avg_headings = sum(d["heading_count"] for d in doc_stats) / len(doc_stats)

    # Write report — NO source text, only patterns and counts
    lines = [
        "# Source Pattern Notes",
        "",
        "> **IMPORTANT:** This file contains structural analysis only. No source document",
        "> text is reproduced here. Raw source files are in research/raw/ (gitignored).",
        "> Use these patterns to guide synthetic sample file generation.",
        "",
        "---",
        "",
        "## Document corpus summary",
        "",
        f"- Documents analysed: **{len(files)}**",
        f"- Average word count: **{avg_words:,.0f} words**",
        f"- Average section headings per document: **{avg_headings:.1f}**",
        "",
        "---",
        "",
        "## Documents analysed",
        "",
        "| File | Words | Headings | Paragraphs | Avg para (words) |",
        "|------|-------|----------|------------|-----------------|",
    ]

    for d in doc_stats:
        lines.append(
            f"| {d['filename']} | {d['word_count']:,} | {d['heading_count']} "
            f"| {d['paragraph_count']} | {d['avg_para_words']} |"
        )

    lines += [
        "",
        "---",
        "",
        "## Most common section heading categories",
        "",
        "Headings matched to known RFP section keyword categories, counted across all documents.",
        "",
        "| Section category | Count |",
        "|------------------|-------|",
    ]

    for section, count in top_sections:
        if count > 0:
            lines.append(f"| {section} | {count} |")

    lines += [
        "",
        "---",
        "",
        "## Top 40 raw heading strings (lowercased)",
        "",
        "Verbatim heading text is shown only as structural pattern — not as quoted source content.",
        "",
        "| Heading text | Count |",
        "|--------------|-------|",
    ]

    for heading, count in top_headings:
        safe_heading = heading.replace("|", "\\|")
        lines.append(f"| {safe_heading} | {count} |")

    lines += [
        "",
        "---",
        "",
        "## Recommended synthetic sample file sections",
        "",
        "Based on the section frequency analysis above, the following sections are",
        "recommended for inclusion in the 10 synthetic sample files.",
        "These are structural recommendations only — content must be entirely fictional.",
        "",
        "### Case study files",
        "- Overview / Executive Summary",
        "- Customer Context (fictional customer)",
        "- Problem Statement",
        "- Solution Description",
        "- Implementation Approach and Timeline",
        "- Results and Metrics (fictional)",
        "- Risks and Controls",
        "- Human-in-the-Loop Review",
        "- Lessons Learned",
        "- Reusable RFP Evidence Points",
        "",
        "### Security / compliance notes",
        "- Overview",
        "- Data Handling and Storage",
        "- Access Control",
        "- Audit Logging",
        "- PII Handling",
        "- Model Governance",
        "- Deployment Assumptions",
        "- Customer Responsibilities",
        "- Security Q&A for RFP Follow-Up",
        "",
        "### Implementation playbook",
        "- Overview",
        "- Pre-Implementation Requirements",
        "- Implementation Phases and Milestones",
        "- Customer Obligations",
        "- Risk Register",
        "- Change Management",
        "- Go-Live Criteria",
        "- Post-Go-Live Support",
        "",
        "### RFP answer library",
        "- Implementation Timeline",
        "- Security and Data Handling",
        "- Integrations",
        "- Support Model",
        "- Model Governance",
        "- Reporting and Analytics",
        "- Change Management",
        "- Commercial Assumptions",
        "- Standard Caveats",
        "",
        "---",
        "",
        "## Notes for synthetic generation",
        "",
        "- Use fictional company **Northstar AI** throughout",
        "- Use fictional customers: Meridian Bank, Harrington Shaw LLP, Atlas Markets,",
        "  Lumen Insurance, Northbridge Legal",
        "- All metrics must be fictional (e.g. '62% reduction in review time')",
        "- Do not claim real certifications — use 'SOC 2 readiness workstream planned'",
        "- Target 400–1,200 words per file — suitable for RAG chunking",
        "- Each file must end with the standard synthetic data disclaimer",
        "",
    ]

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nWrote {OUTPUT_FILE}")
    print(f"Top 5 section categories: {', '.join(s for s, _ in top_sections[:5])}")


if __name__ == "__main__":
    main()
