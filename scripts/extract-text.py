#!/usr/bin/env python3
"""
extract-text.py
Extracts plain text from files in research/raw/ and writes to research/extracted/.

Usage:
    python scripts/extract-text.py

Supports: PDF, DOCX, HTML, TXT.
Flags scanned/image PDFs where text is sparse (<100 chars/page).
Extracted text is gitignored — never commit research/extracted/.
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
RAW_DIR = REPO_ROOT / "research" / "raw"
EXTRACTED_DIR = REPO_ROOT / "research" / "extracted"

MIN_CHARS_PER_PAGE = 100


def extract_pdf(path: Path) -> tuple[str, list[str]]:
    """Returns (text, warnings)."""
    try:
        import pypdf
    except ImportError:
        return "", ["pypdf not installed — run: pip install pypdf"]

    warnings = []
    text_parts = []

    with open(path, "rb") as f:
        reader = pypdf.PdfReader(f)
        n_pages = len(reader.pages)
        for page in reader.pages:
            text_parts.append(page.extract_text() or "")

    full_text = "\n".join(text_parts)
    avg_chars = len(full_text) / max(n_pages, 1)

    if avg_chars < MIN_CHARS_PER_PAGE:
        warnings.append(
            f"Scanned/image PDF suspected: {avg_chars:.0f} chars/page avg "
            f"({n_pages} pages). Text extraction may be incomplete."
        )

    return full_text, warnings


def extract_docx(path: Path) -> tuple[str, list[str]]:
    try:
        from docx import Document
    except ImportError:
        return "", ["python-docx not installed — run: pip install python-docx"]

    doc = Document(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs), []


def extract_html(path: Path) -> tuple[str, list[str]]:
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return "", ["beautifulsoup4 not installed — run: pip install beautifulsoup4"]

    raw = path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(raw, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "head"]):
        tag.decompose()

    text = soup.get_text(separator="\n")
    text = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    return text, []


def extract_txt(path: Path) -> tuple[str, list[str]]:
    return path.read_text(encoding="utf-8", errors="replace"), []


EXTRACTORS = {
    ".pdf": extract_pdf,
    ".docx": extract_docx,
    ".html": extract_html,
    ".htm": extract_html,
    ".txt": extract_txt,
}


def main() -> None:
    files = [p for p in RAW_DIR.iterdir() if p.suffix.lower() in EXTRACTORS and p.name != ".gitkeep"]

    if not files:
        print("No files found in research/raw/ — run fetch-sources.py first")
        sys.exit(0)

    print(f"extract-text.py — {len(files)} files to process\n")
    ok, failed = 0, 0

    for path in sorted(files):
        stem = path.stem
        out_path = EXTRACTED_DIR / f"{stem}.txt"

        if out_path.exists():
            print(f"  [skip]  {path.name} — already extracted")
            ok += 1
            continue

        print(f"  [extract] {path.name}")
        extractor = EXTRACTORS[path.suffix.lower()]

        try:
            text, warnings = extractor(path)
        except Exception as e:
            print(f"  [fail]    {e}")
            failed += 1
            continue

        for w in warnings:
            print(f"  [warn]    {w}")

        if not text.strip():
            print(f"  [warn]    Empty extraction — skipping {path.name}")
            failed += 1
            continue

        out_path.write_text(text, encoding="utf-8")
        word_count = len(text.split())
        print(f"  [ok]      {out_path.name} ({word_count:,} words)")
        ok += 1

    print(f"\nDone: {ok} ok, {failed} failed/skipped")


if __name__ == "__main__":
    main()
