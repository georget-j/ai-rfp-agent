#!/usr/bin/env python3
"""
fetch-sources.py
Downloads source documents listed in research/sources.yaml into research/raw/.

Usage:
    python scripts/fetch-sources.py

Only downloads files with include_in_analysis: true.
Skips files that already exist (idempotent).
Raw files are gitignored — never commit research/raw/.
"""

import sys
import time
from pathlib import Path
import requests
import yaml

REPO_ROOT = Path(__file__).parent.parent
SOURCES_FILE = REPO_ROOT / "research" / "sources.yaml"
RAW_DIR = REPO_ROOT / "research" / "raw"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (research pipeline; structural reference only; "
        "not for redistribution)"
    )
}

TIMEOUT = 30  # seconds per download


def infer_extension(url: str, content_type: str) -> str:
    """Guess file extension from URL or Content-Type header."""
    url_lower = url.lower()
    if url_lower.endswith(".pdf") or "pdf" in content_type:
        return ".pdf"
    if url_lower.endswith(".docx") or "wordprocessingml" in content_type:
        return ".docx"
    if url_lower.endswith(".html") or "text/html" in content_type:
        return ".html"
    if url_lower.endswith(".txt") or "text/plain" in content_type:
        return ".txt"
    return ".bin"


def fetch(source: dict) -> bool:
    sid = source["id"]
    url = source["source_url"]

    # Check if already downloaded (any extension)
    existing = list(RAW_DIR.glob(f"{sid}.*"))
    if existing:
        print(f"  [skip]  {sid} — already exists as {existing[0].name}")
        return True

    print(f"  [fetch] {sid}")
    print(f"          {url}")

    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        resp.raise_for_status()
    except requests.exceptions.HTTPError as e:
        print(f"  [fail]  HTTP {e.response.status_code} — {e}")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"  [fail]  Connection error — {e}")
        return False
    except requests.exceptions.Timeout:
        print(f"  [fail]  Timeout after {TIMEOUT}s")
        return False
    except requests.exceptions.RequestException as e:
        print(f"  [fail]  {e}")
        return False

    content_type = resp.headers.get("Content-Type", "")
    ext = infer_extension(url, content_type)
    out_path = RAW_DIR / f"{sid}{ext}"

    out_path.write_bytes(resp.content)
    size_kb = len(resp.content) / 1024
    print(f"  [ok]    saved {out_path.name} ({size_kb:.1f} KB)")
    return True


def main() -> None:
    if not SOURCES_FILE.exists():
        print(f"ERROR: {SOURCES_FILE} not found")
        sys.exit(1)

    with SOURCES_FILE.open() as f:
        sources = yaml.safe_load(f)

    active = [s for s in sources if s.get("include_in_analysis", False)]
    print(f"fetch-sources.py — {len(active)} sources to fetch\n")

    ok, failed = 0, 0
    for source in active:
        success = fetch(source)
        if success:
            ok += 1
        else:
            failed += 1
        time.sleep(1)  # polite delay between requests

    print(f"\nDone: {ok} ok, {failed} failed")
    if failed:
        print("NOTE: Failed sources must be placed manually in research/raw/{id}.pdf")
        sys.exit(1)


if __name__ == "__main__":
    main()
