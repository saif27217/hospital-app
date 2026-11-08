#!/usr/bin/env python3
# Regenerate src/utils/hospitals.ts from src/data/hospitals.json.
# Source of truth: /home/sak/hospital-search-hdfc-care/hospitals.json (hospital-search repo cache).
# Do not hand-edit the generated TS module.
import json, pathlib

SRC = pathlib.Path("/home/sak/hospital-search-hdfc-care/hospitals.json")
OUT_TS = pathlib.Path("/home/sak/hospital-app/src/utils/hospitals.ts")
OUT_JSON = pathlib.Path("/home/sak/hospital-app/src/data/hospitals.json")

records = json.loads(SRC.read_text())
OUT_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=0))

body = json.dumps(records, ensure_ascii=False, separators=(",", ":"))
header = (
    "// Auto-generated from the hospital-search repo cache — regenerate with "
    "scripts/extract_hospitals.py; do not hand-edit.\n"
    "export const HOSPITALS_RAW = "
)
OUT_TS.write_text(header + body + ";\n")
print(f"{len(records)} records -> {OUT_TS}")
