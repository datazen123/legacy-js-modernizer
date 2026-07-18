"""
Real-data benchmark: checks whether this repo's legacy-code analysis
actually surfaces a real, well-documented vulnerability in a real reference
codebase - OWASP NodeGoat - rather than just generic style complaints.

Why NodeGoat and not NIST SARD: SARD (samate.nist.gov/SARD) is the natural
first place to look for labeled-vulnerable legacy code, but it has no
JavaScript test suite (only C/C++/Java/PHP/C#) - misrepresenting it as
covering JS would be dishonest. OWASP NodeGoat is the real, well-known,
industry-standard substitute for JS specifically: an intentionally
vulnerable Node.js reference app used industry-wide for AppSec training,
with each vulnerability self-documented in code comments (the fix is
literally commented out above the vulnerable line).

This is a pass/fail check on ONE real, documented case, not a statistical
benchmark like the other repos' benchmark.py files - said plainly rather
than manufacturing a false precision/recall number out of a sample size of
one.

Run:
    export ANTHROPIC_API_KEY=sk-ant-...
    python benchmark.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import requests

from llm_client import AnthropicClient

ROOT = Path(__file__).parent
CODE_FENCE_RE = re.compile(r"^```[a-zA-Z]*\s*|\s*```$", re.MULTILINE)
NODEGOAT_URL = "https://raw.githubusercontent.com/OWASP/NodeGoat/master/app/routes/allocations.js"

# The real, documented vulnerability class in this file (OWASP NodeGoat's
# own A4/Insecure-Direct-Object-Reference tutorial exercise): it takes
# userId from the URL/route parameter instead of the authenticated session,
# so any logged-in user can view any other user's allocations by editing
# the URL. Detecting mentions of this concept is intentionally lenient
# (several ways to phrase the same real issue), not a strict string match.
DETECTION_KEYWORDS = [
    "insecure direct object reference", "idor", "direct object reference",
    "authorization", "access control", "req.params", "url parameter",
    "session", "any user", "another user", "other user",
]


def strip_fences(text: str) -> str:
    return CODE_FENCE_RE.sub("", text.strip()).strip()


def extract_json(text: str) -> dict:
    return json.loads(strip_fences(text))


def main() -> None:
    client = AnthropicClient()

    print(f"Fetching real OWASP NodeGoat source: {NODEGOAT_URL}")
    source = requests.get(NODEGOAT_URL, timeout=30).text

    system_prompt = (
        "You are a senior engineer doing a legacy code security assessment. "
        "Be specific and concrete about any real vulnerabilities you find."
    )
    prompt = (
        "Here is a real Node.js route handler from a production-style "
        "codebase. Analyze it for security risks.\n\n"
        f"=== allocations.js ===\n{source}\n\n"
        "Return ONLY JSON (no markdown fences):\n"
        '{"summary": "plain-English description of what this code does", '
        '"vulnerabilities": ["each specific, concrete security issue you found, '
        'named and explained"]}'
    )
    response = client.create(system=system_prompt, messages=[{"role": "user", "content": prompt}], max_tokens=2048)
    text = "".join(b.text for b in response.content if b.type == "text")
    analysis = extract_json(text)

    findings_text = " ".join(analysis["vulnerabilities"]).lower()
    matched_keywords = [k for k in DETECTION_KEYWORDS if k in findings_text]
    surfaced_real_vuln = len(matched_keywords) >= 2  # more than one incidental word match

    report = [
        "# OWASP NodeGoat Real-Data Benchmark Report (legacy-js-modernizer)",
        "",
        f"Source analyzed: {NODEGOAT_URL}",
        "",
        f"**Known real vulnerability in this file**: Insecure Direct Object "
        "Reference (IDOR) - it reads `userId` from `req.params` (the URL) "
        "instead of the authenticated session, so any logged-in user can "
        "view any other user's data by editing the URL. This is NodeGoat's "
        "own documented A4/IDOR tutorial exercise (the fix is commented out "
        "directly above the vulnerable line in the source).",
        "",
        f"**Did Claude's analysis surface this specific issue?** "
        f"{'YES' if surfaced_real_vuln else 'NO'} "
        f"(matched concepts: {matched_keywords or 'none'})",
        "",
        "This is a pass/fail check on one real, documented case - not a "
        "statistical benchmark like the other repos' real-data tests.",
        "",
        "## Claude's full analysis",
        "",
        f"Summary: {analysis['summary']}",
        "",
        "Vulnerabilities found:",
    ] + [f"- {v}" for v in analysis["vulnerabilities"]]

    (ROOT / "benchmark_report.md").write_text("\n".join(report) + "\n")
    print("\n".join(report))
    print("\nWrote benchmark_report.md")


if __name__ == "__main__":
    main()
