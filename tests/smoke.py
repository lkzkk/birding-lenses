#!/usr/bin/env python3
"""Dependency-free pre-deploy validation for the static microsite."""

from __future__ import annotations

import csv
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "systems.csv"
HTML_PATH = ROOT / "index.html"

REQUIRED_COLUMNS = [
    "system_id",
    "display_name",
    "body",
    "lens",
    "teleconverter",
    "actual_focal_length_mm",
    "actual_f_stop",
    "equiv_focal_length_mm",
    "equiv_f_stop",
    "system_weight_g",
]
NUMERIC_COLUMNS = [
    "actual_focal_length_mm",
    "actual_f_stop",
    "equiv_focal_length_mm",
    "equiv_f_stop",
    "system_weight_g",
]
REQUIRED_HTML_MARKERS = [
    'id="colorDimension"',
    'id="colorMode"',
    'id="planeToggle"',
    'id="idToggle"',
    'id="plot"',
    'id="systemList"',
    "data/systems.csv",
    "Residual from average plane",
    "Absolute value",
]


def main() -> None:
    assert CSV_PATH.is_file(), f"Missing {CSV_PATH.relative_to(ROOT)}"
    assert HTML_PATH.is_file(), f"Missing {HTML_PATH.relative_to(ROOT)}"

    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        assert reader.fieldnames == REQUIRED_COLUMNS, (
            "CSV columns changed. Expected: " + ", ".join(REQUIRED_COLUMNS)
        )
        rows = list(reader)

    assert rows, "CSV contains no systems"
    ids = [row["system_id"] for row in rows]
    assert len(ids) == len(set(ids)), "system_id values must be unique"

    for row_number, row in enumerate(rows, start=2):
        for column in REQUIRED_COLUMNS:
            assert row[column].strip(), f"Blank {column} at CSV row {row_number}"
        for column in NUMERIC_COLUMNS:
            try:
                value = float(row[column])
            except ValueError as exc:
                raise AssertionError(
                    f"Non-numeric {column} at CSV row {row_number}: {row[column]!r}"
                ) from exc
            assert math.isfinite(value) and value > 0, (
                f"Invalid {column} at CSV row {row_number}: {value}"
            )

    html = HTML_PATH.read_text(encoding="utf-8")
    for marker in REQUIRED_HTML_MARKERS:
        assert marker in html, f"index.html is missing required marker: {marker}"

    assert html.count("<script") == 1, "Expected one application script in index.html"
    assert html.count("</script>") == 1, "Unbalanced script tags in index.html"

    print(f"Smoke validation passed: {len(rows)} systems, {len(REQUIRED_COLUMNS)} CSV columns.")


if __name__ == "__main__":
    main()
