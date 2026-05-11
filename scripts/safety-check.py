#!/usr/bin/env python3
"""
safety-check.py
Checks sample-data/*.md files for potential copyright/attribution issues.

Usage:
    python scripts/safety-check.py

Checks:
  1. Forbidden phrases (confidential, proprietary, etc.)
  2. Real company names found in sources.yaml
  3. Source URLs appearing in sample files
  4. Similarity against extracted source text (requires research/extracted/)

Writes: research/analysis/safety-check-report.md

This is a best-effort check — manual review is still required before publishing.
"""

import difflib
import re
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).parent.parent
SAMPLE_DIR = REPO_ROOT / "sample-data"
EXTRACTED_DIR = REPO_ROOT / "research" / "extracted"
SOURCES_FILE = REPO_ROOT / "research" / "sources.yaml"
REPORT_FILE = REPO_ROOT / "research" / "analysis" / "safety-check-report.md"

SIMILARITY_THRESHOLD = 0.60  # flag passages above this ratio

FORBIDDEN_PHRASES = [
    "confidential",
    "proprietary",
    "all rights reserved",
    "do not distribute",
    "submitted by",
    "copyright ©",
    "copyright (c)",
    "supplier response",
    "this document may not",
    "trade secret",
    "not for public release",
]

SYNTHETIC_MARKER = "synthetic: true"
DISCLAIMER_MARKER = "Synthetic data notice"


def load_sources() -> tuple[list[str], list[str]]:
    """Return (real_company_names, source_urls) from sources.yaml."""
    if not SOURCES_FILE.exists():
        return [], []

    with SOURCES_FILE.open() as f:
        sources = yaml.safe_load(f) or []

    company_names = []
    urls = []
    for s in sources:
        title = s.get("title", "")
        # Extract potential company/org names (words longer than 4 chars, capitalised)
        for word in re.findall(r"\b[A-Z][a-zA-Z]{3,}\b", title):
            if word not in {"Services", "Technology", "Digital", "Framework",
                           "Implementation", "Guide", "Template", "Report",
                           "Management", "Information", "Programme"}:
                company_names.append(word)
        url = s.get("source_url", "")
        if url:
            urls.append(url)

    return list(set(company_names)), urls


def check_file(
    path: Path,
    forbidden: list[str],
    real_names: list[str],
    source_urls: list[str],
    extracted_texts: dict[str, str],
) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    text_lower = text.lower()

    issues: list[dict] = []
    hard_stops: list[str] = []

    # 1. Check for synthetic frontmatter marker
    if SYNTHETIC_MARKER not in text:
        hard_stops.append("Missing `synthetic: true` in frontmatter")

    # 2. Check for disclaimer
    if DISCLAIMER_MARKER not in text:
        hard_stops.append("Missing synthetic data disclaimer at end of file")

    # 3. Forbidden phrases
    for phrase in forbidden:
        if phrase.lower() in text_lower:
            idx = text_lower.index(phrase.lower())
            snippet = text[max(0, idx - 30):idx + 60].replace("\n", " ")
            issues.append({
                "type": "forbidden_phrase",
                "detail": f"'{phrase}' found: …{snippet}…",
            })

    # 4. Real company names from sources
    for name in real_names:
        if re.search(r"\b" + re.escape(name) + r"\b", text):
            issues.append({
                "type": "real_name",
                "detail": f"Potential real organisation name found: '{name}'",
            })

    # 5. Source URLs
    for url in source_urls:
        domain = re.sub(r"https?://(www\.)?", "", url).split("/")[0]
        if domain and domain in text_lower:
            issues.append({
                "type": "source_url",
                "detail": f"Source domain '{domain}' found in sample file",
            })

    # 6. Similarity check against extracted source text
    sample_paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 80]

    similarity_flags: list[dict] = []
    for src_name, src_text in extracted_texts.items():
        src_paragraphs = [p.strip() for p in src_text.split("\n\n") if len(p.strip()) > 80]
        for s_para in sample_paragraphs[:30]:  # limit to first 30 paragraphs
            for src_para in src_paragraphs[:50]:  # limit source paragraphs checked
                ratio = difflib.SequenceMatcher(None, s_para[:500], src_para[:500]).ratio()
                if ratio >= SIMILARITY_THRESHOLD:
                    similarity_flags.append({
                        "source_file": src_name,
                        "ratio": round(ratio, 3),
                        "sample_excerpt": s_para[:100],
                        "source_excerpt": src_para[:100],
                    })

    return {
        "filename": path.name,
        "hard_stops": hard_stops,
        "issues": issues,
        "similarity_flags": similarity_flags,
        "passed": len(hard_stops) == 0 and len(issues) == 0 and len(similarity_flags) == 0,
    }


def main() -> None:
    sample_files = sorted(SAMPLE_DIR.glob("*.md"))
    if not sample_files:
        print("No sample files found in sample-data/")
        sys.exit(0)

    real_names, source_urls = load_sources()

    # Load extracted source texts for similarity check
    extracted_texts: dict[str, str] = {}
    if EXTRACTED_DIR.exists():
        for p in EXTRACTED_DIR.glob("*.txt"):
            extracted_texts[p.name] = p.read_text(encoding="utf-8", errors="replace")

    print(f"safety-check.py — checking {len(sample_files)} sample files")
    print(f"  Extracted sources loaded: {len(extracted_texts)}")
    print(f"  Similarity threshold: {SIMILARITY_THRESHOLD}\n")

    results = []
    for path in sample_files:
        print(f"  checking {path.name}…")
        result = check_file(path, FORBIDDEN_PHRASES, real_names, source_urls, extracted_texts)
        results.append(result)

    # Write report
    passed = [r for r in results if r["passed"]]
    failed = [r for r in results if not r["passed"]]

    lines = [
        "# Safety Check Report",
        "",
        f"Files checked: **{len(results)}** — "
        f"**{len(passed)} passed**, **{len(failed)} need review**",
        "",
        f"Similarity threshold: {SIMILARITY_THRESHOLD}",
        f"Extracted sources compared: {len(extracted_texts)}",
        "",
        "---",
        "",
    ]

    for result in results:
        status = "✅ PASS" if result["passed"] else "❌ NEEDS REVIEW"
        lines += [
            f"## {result['filename']} — {status}",
            "",
        ]

        if result["hard_stops"]:
            lines.append("### Hard stops (must fix before publishing)")
            lines.append("")
            for hs in result["hard_stops"]:
                lines.append(f"- {hs}")
            lines.append("")

        if result["issues"]:
            lines.append("### Issues")
            lines.append("")
            for issue in result["issues"]:
                lines.append(f"- **{issue['type']}**: {issue['detail']}")
            lines.append("")

        if result["similarity_flags"]:
            lines.append("### Similarity flags")
            lines.append("")
            for flag in result["similarity_flags"]:
                lines += [
                    f"- **Ratio {flag['ratio']}** vs `{flag['source_file']}`",
                    f"  - Sample: *{flag['sample_excerpt']}*",
                    f"  - Source: *{flag['source_excerpt']}*",
                    "",
                ]

        if result["passed"]:
            lines.append("No issues found.")
            lines.append("")

        lines.append("---")
        lines.append("")

    lines += [
        "## Manual review checklist",
        "",
        "Before committing sample-data/ to Git, verify:",
        "",
        "- [ ] All hard stops resolved",
        "- [ ] All similarity flags reviewed and confirmed as coincidental",
        "- [ ] All files have `synthetic: true` in frontmatter",
        "- [ ] All files end with the synthetic data disclaimer",
        "- [ ] No real customer names (only: Meridian Bank, Harrington Shaw LLP, Atlas Markets, Lumen Insurance, Northbridge Legal)",
        "- [ ] No real vendor names",
        "- [ ] No ISO/SOC 2 certification claims without 'readiness workstream' qualifier",
        "- [ ] All metrics are clearly fictional with no attributed source",
        "- [ ] Files are 400–1,200 words",
        "",
    ]

    REPORT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nWrote {REPORT_FILE}")
    print(f"Result: {len(passed)} passed, {len(failed)} need review")

    if failed:
        print("\nFiles needing review:")
        for r in failed:
            n_hard = len(r["hard_stops"])
            n_issues = len(r["issues"])
            n_sim = len(r["similarity_flags"])
            print(f"  {r['filename']}: {n_hard} hard stops, {n_issues} issues, {n_sim} similarity flags")
        sys.exit(1)
    else:
        print("All files passed — proceed to manual review checklist in the report.")


if __name__ == "__main__":
    main()
