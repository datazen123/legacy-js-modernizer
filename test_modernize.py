"""Offline unit tests for modernize.py's deterministic helpers - no API key needed."""
import pytest

from modernize import extract_json, strip_fences


def test_strip_fences_removes_markdown_code_block():
    assert strip_fences('```json\n{"a": 1}\n```') == '{"a": 1}'


def test_strip_fences_leaves_bare_text_alone():
    assert strip_fences('{"a": 1}') == '{"a": 1}'


def test_extract_json_parses_fenced_json():
    assert extract_json('```json\n{"summary": "ok"}\n```') == {"summary": "ok"}


def test_extract_json_raises_clear_error_on_malformed_json():
    with pytest.raises(RuntimeError, match="wasn't valid JSON"):
        extract_json("this is not json")
