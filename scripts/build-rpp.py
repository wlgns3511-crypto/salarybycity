#!/usr/bin/env python3
"""
Build lib/generated/rpp.json from BEA Regional Price Parities CSVs.

Two BEA series (both LineCode=1, "RPPs: All items"):
  SARPP_STATE_2008_2024.csv  — 50 states + DC + US (51+1 rows)
  MARPP_MSA_2008_2024.csv    — every MSA, ours = our 50 MSAs only

Output schema (per area):
  {
    "<areaCode>": {
      "state": "NY",          // 2-letter state code from existing areas.state
      "stateRpp": 116.5,       // BEA state RPP, latest year
      "msaRpp": 122.3 | null,  // BEA MSA RPP if matched, else null
      "year": 2024              // BEA series-end year
    },
    ...
    "_meta": { "year": 2024, "source": "BEA RPP", "stateBaseline": "US=100" }
  }

Notes:
  - DB MSA codes are 7-digit ("0035620"); BEA MSA GeoFIPS is 5-digit ("35620").
    We strip leading "00" before matching.
  - DB state codes are 2-letter ("NY"); BEA state GeoFIPS is FIPS 2-digit + "000"
    ("36000" = New York). We use a small FIPS→abbrev table.

Usage: python3 scripts/build-rpp.py
"""
import csv
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RPP_DIR = ROOT / 'data' / 'bea-rpp'
STATE_CSV = RPP_DIR / 'SARPP_STATE_2008_2024.csv'
MSA_CSV = RPP_DIR / 'MARPP_MSA_2008_2024.csv'
OUT_PATH = ROOT / 'lib' / 'generated' / 'rpp.json'
DB_PATH = ROOT / 'data' / 'salary.db'

# Manual MSA-code overrides where BLS OEWS uses one CBSA vintage and BEA RPP
# uses another. Maps DB area_code (7-digit "00XXXXX") → BEA GeoFIPS (5-digit).
MSA_CODE_OVERRIDE = {
    '0017460': '17140',  # Cincinnati, OH-KY-IN (BLS 17460 vs BEA 17140)
}


# FIPS state code → 2-letter abbreviation (50 states + DC + PR)
FIPS_TO_ABBREV = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
    '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
    '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
    '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
    '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
    '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
    '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
    '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
    '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
    '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
    '56': 'WY', '72': 'PR',
}


def load_rpp_csv(path: Path, year_col: str = '2024'):
    """Read BEA RPP CSV, return {GeoFIPS: float} for LineCode=1 (All items)."""
    out = {}
    with open(path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            line_code = (row.get('LineCode') or '').strip()
            if line_code != '1':
                continue
            geo = (row.get('GeoFIPS') or '').strip().strip('"')
            val = (row.get(year_col) or '').strip()
            try:
                out[geo] = float(val)
            except ValueError:
                continue
    return out


def main():
    if not STATE_CSV.exists() or not MSA_CSV.exists():
        print(f'ERROR: BEA CSVs not found in {RPP_DIR}')
        return

    state_rpp = load_rpp_csv(STATE_CSV)
    msa_rpp = load_rpp_csv(MSA_CSV)
    print(f'  Loaded {len(state_rpp)} state RPPs, {len(msa_rpp)} MSA RPPs (year=2024)')

    # State abbrev → state RPP (so we can lookup by salary.db's `state` column)
    state_by_abbrev = {}
    for fips, val in state_rpp.items():
        # State GeoFIPS is "XX000" where XX is FIPS state code
        if len(fips) == 5 and fips.endswith('000'):
            abbrev = FIPS_TO_ABBREV.get(fips[:2])
            if abbrev:
                state_by_abbrev[abbrev] = val
    print(f'  Mapped {len(state_by_abbrev)} state abbrev → RPP')

    # Build area → rpp mapping using DB areas table
    db = sqlite3.connect(DB_PATH)
    cur = db.cursor()
    out: dict = {}
    matched_msa = 0
    for area_code, area_title, area_type, state in cur.execute(
        'SELECT area_code, area_title, area_type, state FROM areas'
    ):
        # National row is special: RPP=100 by definition
        if area_type == 'N':
            out[area_code] = {
                'state': 'US',
                'stateRpp': 100.0,
                'msaRpp': 100.0,
                'year': 2024,
            }
            continue
        # MSA: strip "00" prefix to get 5-digit BEA GeoFIPS, then apply manual
        # override for vintage mismatches.
        msa_geo = area_code.lstrip('0').zfill(5)
        if area_code in MSA_CODE_OVERRIDE:
            msa_geo = MSA_CODE_OVERRIDE[area_code]
        msa_val = msa_rpp.get(msa_geo)
        # Multi-state MSAs: state column may be "NY" (we took first via extractState)
        st = (state or '').upper()
        # Some multi-state codes were stored with hyphen; take first 2 chars
        if len(st) > 2:
            st = st[:2]
        state_val = state_by_abbrev.get(st)
        if msa_val:
            matched_msa += 1
        out[area_code] = {
            'state': st or None,
            'stateRpp': state_val,
            'msaRpp': msa_val,
            'year': 2024,
        }

    db.close()
    print(f'  Matched {matched_msa}/50 MSAs to BEA RPPs')

    out['_meta'] = {
        'year': 2024,
        'source': 'BEA Regional Price Parities, 2024',
        'stateBaseline': 'US=100',
        'note': 'Higher RPP = costlier area. Use to convert nominal to real wages.',
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(out, f, indent=2)
    print(f'  Wrote {OUT_PATH} ({len(out)-1} areas + meta)')


if __name__ == '__main__':
    main()
