"""Download BLS OEWS flat files for salary data."""

import os
import sys
import urllib.request
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'bls-raw')
BASE_URL = 'https://download.bls.gov/pub/time.series/oe'

FILES = [
    'oe.data.0.Current',
    'oe.area',
    'oe.occupation',
    'oe.datatype',
    'oe.industry',
]

def download(url, dest):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'salary-data/1.0 (research project)'
    })
    resp = urllib.request.urlopen(req, timeout=120)
    data = resp.read()
    with open(dest, 'wb') as f:
        f.write(data)
    return len(data)

def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    for filename in FILES:
        url = f'{BASE_URL}/{filename}'
        dest = os.path.join(DATA_DIR, filename)

        if os.path.exists(dest):
            age_hours = (time.time() - os.path.getmtime(dest)) / 3600
            size = os.path.getsize(dest)
            if age_hours < 24 and size > 100:
                print(f'  SKIP {filename} ({size/1024/1024:.1f} MB, {age_hours:.1f}h ago)')
                continue

        print(f'  Downloading {filename}...')
        try:
            size = download(url, dest)
            print(f'  OK {filename} ({size/1024/1024:.1f} MB)')
        except Exception as e:
            print(f'  FAIL {filename}: {e}')

    print('\nDone. Run `npx tsx scripts/parse-bls.ts` to build the database.')

if __name__ == '__main__':
    main()
