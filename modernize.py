"""
Claude-driven legacy-to-modern migration: reads real (synthetic) legacy JS,
produces a structured analysis + modernization plan, then generates a modern
replacement for the business-logic module and a React component for the
presentation layer that used to depend on jQuery.

The generated modernized/logic.js is then checked for behavioral parity
against the legacy version by verify_parity.js (a separate, deterministic
Node script - not something this script trusts itself to judge).

Run:
    export ANTHROPIC_API_KEY=sk-ant-...
    python modernize.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from llm_client import AnthropicClient

ROOT = Path(__file__).parent
CODE_FENCE_RE = re.compile(r"^```[a-zA-Z]*\s*|\s*```$", re.MULTILINE)


def strip_fences(text: str) -> str:
    return CODE_FENCE_RE.sub("", text.strip()).strip()


def extract_json(text: str) -> dict:
    return json.loads(strip_fences(text))


def call(client: AnthropicClient, system: str, user: str, max_tokens: int = 4096) -> str:
    response = client.create(system=system, messages=[{"role": "user", "content": user}], max_tokens=max_tokens)
    return "".join(b.text for b in response.content if b.type == "text")


def analyze(client: AnthropicClient, logic_src: str, dashboard_src: str, ps1_src: str) -> dict:
    prompt = (
        "Here is a legacy facility-asset status dashboard: a framework-independent "
        "business-logic module, a jQuery presentation layer that depends on it, and "
        "an unrelated legacy PowerShell reporting script.\n\n"
        f"=== legacy/logic.js ===\n{logic_src}\n\n"
        f"=== legacy/dashboard.js ===\n{dashboard_src}\n\n"
        f"=== legacy/generate_report.ps1 ===\n{ps1_src}\n\n"
        "Return ONLY JSON (no markdown fences):\n"
        '{"summary": "plain-English description of what this system does", '
        '"risks": ["specific coupling/global-state/callback-soup risks you found"], '
        '"js_modernization_plan": ["ordered steps to modernize the JS/jQuery pieces"], '
        '"powershell_modernization_plan": ["ordered steps to modernize generate_report.ps1 into a modern CLI - describe only, do not implement"]}'
    )
    return extract_json(
        call(
            client,
            "You are a senior engineer doing a legacy code assessment before a migration. Be specific and concrete.",
            prompt,
        )
    )


def generate_modern_logic(client: AnthropicClient, logic_src: str, analysis: dict) -> str:
    prompt = (
        "Rewrite this legacy business-logic module as clean, modern JavaScript. "
        "Hard requirements: export a function named exactly `processAssets` via "
        "`module.exports = { processAssets }`. It must be synchronous (return the "
        "array directly, no callback), preserve the exact same business rules as "
        "the legacy version (same overdue/risk logic, including the condition_notes "
        "'fail' keyword bump and the same sort order), and every returned asset "
        "object must include at least: id, daysSinceCheck, isOverdue, riskLevel. "
        "Return ONLY the JavaScript source, no markdown fences, no commentary.\n\n"
        f"=== legacy/logic.js ===\n{logic_src}\n\n"
        f"=== analysis ===\n{json.dumps(analysis, indent=2)}"
    )
    return strip_fences(
        call(client, "You are a senior JavaScript engineer performing a careful, behavior-preserving rewrite.", prompt)
    )


def generate_modern_dashboard(client: AnthropicClient, dashboard_src: str, modern_logic_src: str) -> str:
    prompt = (
        "Rewrite this jQuery dashboard as a modern React functional component "
        "(hooks: useState/useEffect), calling the modernized logic module below "
        "instead of the old one, using fetch instead of $.ajax. Return ONLY the "
        ".jsx source, no markdown fences, no commentary.\n\n"
        f"=== legacy/dashboard.js ===\n{dashboard_src}\n\n"
        f"=== modernized/logic.js ===\n{modern_logic_src}"
    )
    return strip_fences(
        call(client, "You are a senior React engineer modernizing a legacy jQuery view.", prompt)
    )


def main() -> None:
    client = AnthropicClient()

    logic_src = (ROOT / "legacy" / "logic.js").read_text()
    dashboard_src = (ROOT / "legacy" / "dashboard.js").read_text()
    ps1_src = (ROOT / "legacy" / "generate_report.ps1").read_text()

    print("Analyzing legacy code...")
    analysis = analyze(client, logic_src, dashboard_src, ps1_src)
    (ROOT / "modernized" / "analysis.json").write_text(json.dumps(analysis, indent=2) + "\n")
    print(json.dumps(analysis, indent=2))

    print("\nGenerating modernized/logic.js...")
    modern_logic = generate_modern_logic(client, logic_src, analysis)
    (ROOT / "modernized" / "logic.js").write_text(modern_logic + "\n")

    print("Generating modernized/Dashboard.jsx...")
    modern_dashboard = generate_modern_dashboard(client, dashboard_src, modern_logic)
    (ROOT / "modernized" / "Dashboard.jsx").write_text(modern_dashboard + "\n")

    print("\nWrote modernized/analysis.json, modernized/logic.js, modernized/Dashboard.jsx")
    print("Next: run `node verify_parity.js` to check behavioral parity against the legacy logic.")


if __name__ == "__main__":
    main()
