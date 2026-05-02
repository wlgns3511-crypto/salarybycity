#!/usr/bin/env python3
"""
Build lib/generated/cpi-u.json from BLS CPI-U time-series.

Series:
  CUUR0000SA0 — CPI for All Urban Consumers, U.S. city average, all items,
  not seasonally adjusted (the standard series for wage deflation).

We capture:
  - annual averages (period M13) for 2015..latest
  - May value (period M05) for 2015..latest — this aligns with OEWS reference
    date and is what we use to deflate OEWS wages.

Source TSV: https://download.bls.gov/pub/time.series/cu/cu.data.0.Current
(48 MB, all CPI series concatenated; we filter to CUUR0000SA0 in stream.)

Usage: python3 scripts/build-cpi.py
"""
import csv
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / 'data' / 'cpi-raw' / 'cu.data.0.Current'
OUT = ROOT / 'lib' / 'generated' / 'cpi-u.json'

SERIES = 'CUUR0000SA0'
SERIES_TITLE = 'CPI-U, All Urban Consumers, U.S. city average, all items, NSA'
START_YEAR = 2015
UA = 'salarybycity-data-update/1.0 (wlgns3511@gmail.com)'


def fetch():
    if TMP.exists() and TMP.stat().st_size > 1_000_000:
        print(f'  SKIP fetch ({TMP.stat().st_size / 1024 / 1024:.1f} MB exists)')
        return
    TMP.parent.mkdir(parents=True, exist_ok=True)
    url = 'https://download.bls.gov/pub/time.series/cu/cu.data.0.Current'
    print(f'  Fetching {url}...')
    subprocess.run(
        ['curl', '-sL', '-H', f'User-Agent: {UA}', '-o', str(TMP), url],
        check=True,
    )
    print(f'  OK   ({TMP.stat().st_size / 1024 / 1024:.1f} MB)')


def parse():
    annual = {}     # year → CPI annual avg
    may = {}        # year → CPI May
    with open(TMP) as f:
        # File is whitespace-delimited; each row is series_id, year, period, value, ...
        next(f)  # header
        for line in f:
            parts = line.split()
            if len(parts) < 4:
                continue
            sid, y, period, val = parts[0], parts[1], parts[2], parts[3]
            if sid != SERIES:
                continue
            try:
                year = int(y)
                if year < START_YEAR:
                    continue
                v = float(val)
            except ValueError:
                continue
            if period == 'M13':
                annual[year] = round(v, 3)
            elif period == 'M05':
                may[year] = round(v, 3)
    return annual, may


def main():
    fetch()
    annual, may = parse()
    print(f'  Years (annual): {sorted(annual)}')
    print(f'  Years (May):    {sorted(may)}')

    out = {
        '_meta': {
            'series': SERIES,
            'title': SERIES_TITLE,
            'source': 'BLS CPI-U time-series',
            'sourceUrl': f'https://download.bls.gov/pub/time.series/cu/cu.data.0.Current',
        },
        'annual': annual,
        'may': may,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, 'w') as f:
        json.dump(out, f, indent=2)
    print(f'  Wrote {OUT} ({len(annual)} annual, {len(may)} May)')


if __name__ == '__main__':
    main()
