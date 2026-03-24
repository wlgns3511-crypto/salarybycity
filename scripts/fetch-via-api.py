"""
Fetch BLS OEWS salary data via API v2.
Builds SQLite database from API responses.

API limits:
- v1 (no key): 25 queries/day, 25 series/request
- v2 (with key): 500 queries/day, 50 series/request

We fetch the top occupations across top metro areas.

Usage: python3 scripts/fetch-via-api.py [--key YOUR_BLS_API_KEY]
"""

import json
import os
import sys
import time
import sqlite3
import urllib.request

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DATA_DIR, 'salary.db')
API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

# BLS API key (optional, increases limits from 25 to 500 queries/day)
API_KEY = os.environ.get('BLS_API_KEY', '')
for arg in sys.argv:
    if arg.startswith('--key='):
        API_KEY = arg.split('=', 1)[1]

MAX_SERIES = 50 if API_KEY else 25
MAX_QUERIES = 500 if API_KEY else 25

# Top 100 occupations by popularity/search volume
TOP_OCCUPATIONS = [
    ("11-1021", "General and Operations Managers"),
    ("11-3031", "Financial Managers"),
    ("11-9013", "Farmers, Ranchers, and Other Agricultural Managers"),
    ("11-9111", "Medical and Health Services Managers"),
    ("13-1111", "Management Analysts"),
    ("13-2011", "Accountants and Auditors"),
    ("13-2051", "Financial Analysts"),
    ("15-1211", "Computer Systems Analysts"),
    ("15-1232", "Computer User Support Specialists"),
    ("15-1241", "Computer Network Architects"),
    ("15-1243", "Database Administrators"),
    ("15-1244", "Network and Computer Systems Administrators"),
    ("15-1251", "Computer Programmers"),
    ("15-1252", "Software Developers"),
    ("15-1253", "Software Quality Assurance Analysts and Testers"),
    ("15-1254", "Web Developers"),
    ("15-1255", "Web and Digital Interface Designers"),
    ("15-1256", "Software Developers and Software Quality Assurance Analysts and Testers"),
    ("15-1299", "Computer Occupations, All Other"),
    ("15-2051", "Data Scientists"),
    ("17-2051", "Civil Engineers"),
    ("17-2061", "Computer Hardware Engineers"),
    ("17-2071", "Electrical Engineers"),
    ("17-2112", "Industrial Engineers"),
    ("17-2141", "Mechanical Engineers"),
    ("17-2199", "Engineers, All Other"),
    ("19-1042", "Medical Scientists, Except Epidemiologists"),
    ("21-1021", "Child, Family, and School Social Workers"),
    ("23-1011", "Lawyers"),
    ("23-2011", "Paralegals and Legal Assistants"),
    ("25-2021", "Elementary School Teachers, Except Special Education"),
    ("25-2031", "Secondary School Teachers, Except Special and Career/Technical Education"),
    ("25-3031", "Substitute Teachers, Short-Term"),
    ("25-9031", "Instructional Coordinators"),
    ("27-1024", "Graphic Designers"),
    ("27-3031", "Public Relations Specialists"),
    ("29-1141", "Registered Nurses"),
    ("29-1171", "Nurse Practitioners"),
    ("29-1215", "Family Medicine Physicians"),
    ("29-1228", "Physicians, All Other; and Ophthalmologists, Except Pediatric"),
    ("29-1292", "Dental Hygienists"),
    ("29-2010", "Clinical Laboratory Technologists and Technicians"),
    ("29-2052", "Pharmacy Technicians"),
    ("29-2061", "Licensed Practical and Licensed Vocational Nurses"),
    ("31-1120", "Home Health and Personal Care Aides"),
    ("31-9091", "Dental Assistants"),
    ("31-9092", "Medical Assistants"),
    ("33-3051", "Police and Sheriff's Patrol Officers"),
    ("33-3052", "Transit and Railroad Police"),
    ("33-2011", "Firefighters"),
    ("35-2014", "Cooks, Restaurant"),
    ("35-3023", "Fast Food and Counter Workers"),
    ("37-2011", "Janitors and Cleaners, Except Maids and Housekeeping Cleaners"),
    ("39-9011", "Childcare Workers"),
    ("41-1011", "First-Line Supervisors of Retail Sales Workers"),
    ("41-2031", "Retail Salespersons"),
    ("41-3021", "Insurance Sales Agents"),
    ("41-3031", "Securities, Commodities, and Financial Services Sales Agents"),
    ("41-4012", "Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products"),
    ("43-3031", "Bookkeeping, Accounting, and Auditing Clerks"),
    ("43-4051", "Customer Service Representatives"),
    ("43-6014", "Secretaries and Administrative Assistants, Except Legal, Medical, and Executive"),
    ("43-9061", "Office Clerks, General"),
    ("47-2031", "Carpenters"),
    ("47-2111", "Electricians"),
    ("47-2152", "Plumbers, Pipefitters, and Steamfitters"),
    ("49-3023", "Automotive Service Technicians and Mechanics"),
    ("49-9021", "Heating, Air Conditioning, and Refrigeration Mechanics and Installers"),
    ("51-4121", "Welders, Cutters, Solderers, and Brazers"),
    ("53-3032", "Heavy and Tractor-Trailer Truck Drivers"),
    ("53-3033", "Light Truck Drivers"),
]

# Top 50 metro areas by population
TOP_AREAS = [
    ("0035620", "New York-Newark-Jersey City, NY-NJ-PA"),
    ("0031080", "Los Angeles-Long Beach-Anaheim, CA"),
    ("0016980", "Chicago-Naperville-Elgin, IL-IN-WI"),
    ("0019100", "Dallas-Fort Worth-Arlington, TX"),
    ("0026420", "Houston-The Woodlands-Sugar Land, TX"),
    ("0047900", "Washington-Arlington-Alexandria, DC-VA-MD-WV"),
    ("0033100", "Miami-Fort Lauderdale-Pompano Beach, FL"),
    ("0037980", "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD"),
    ("0012060", "Atlanta-Sandy Springs-Alpharetta, GA"),
    ("0014460", "Boston-Cambridge-Nashua, MA-NH"),
    ("0038060", "Phoenix-Mesa-Chandler, AZ"),
    ("0041860", "San Francisco-Oakland-Berkeley, CA"),
    ("0040140", "Riverside-San Bernardino-Ontario, CA"),
    ("0019820", "Detroit-Warren-Dearborn, MI"),
    ("0042660", "Seattle-Tacoma-Bellevue, WA"),
    ("0033460", "Minneapolis-St. Paul-Bloomington, MN-WI"),
    ("0041740", "San Diego-Chula Vista-Carlsbad, CA"),
    ("0045300", "Tampa-St. Petersburg-Clearwater, FL"),
    ("0019740", "Denver-Aurora-Lakewood, CO"),
    ("0041180", "St. Louis, MO-IL"),
    ("0012580", "Baltimore-Columbia-Towson, MD"),
    ("0036740", "Orlando-Kissimmee-Sanford, FL"),
    ("0016740", "Charlotte-Concord-Gastonia, NC-SC"),
    ("0041940", "San Jose-Sunnyvale-Santa Clara, CA"),
    ("0040900", "Sacramento-Roseville-Folsom, CA"),
    ("0038900", "Portland-Vancouver-Hillsboro, OR-WA"),
    ("0038300", "Pittsburgh, PA"),
    ("0012420", "Austin-Round Rock-Georgetown, TX"),
    ("0029820", "Las Vegas-Henderson-Paradise, NV"),
    ("0017460", "Cincinnati, OH-KY-IN"),
    ("0028140", "Kansas City, MO-KS"),
    ("0018140", "Columbus, OH"),
    ("0026900", "Indianapolis-Carmel-Anderson, IN"),
    ("0017140", "Cleveland-Elyria, OH"),
    ("0041700", "San Antonio-New Braunfels, TX"),
    ("0034980", "Nashville-Davidson--Murfreesboro--Franklin, TN"),
    ("0046060", "Tucson, AZ"),
    ("0027260", "Jacksonville, FL"),
    ("0036420", "Oklahoma City, OK"),
    ("0039300", "Providence-Warwick, RI-MA"),
    ("0040060", "Richmond, VA"),
    ("0032820", "Memphis, TN-MS-AR"),
    ("0031140", "Louisville/Jefferson County, KY-IN"),
    ("0040380", "Rochester, NY"),
    ("0039580", "Raleigh-Cary, NC"),
    ("0025540", "Hartford-East Hartford-Middletown, CT"),
    ("0035380", "New Orleans-Metairie, LA"),
    ("0041620", "Salt Lake City, UT"),
    ("0013820", "Birmingham-Hoover, AL"),
    ("0015380", "Buffalo-Cheektowaga, NY"),
]

# National area
NATIONAL_AREA = ("0000000", "National")

# Datatypes we want (annual wages + employment)
DATATYPES = {
    '01': 'employment',
    '04': 'annual_mean',
    '11': 'annual_p10',
    '12': 'annual_p25',
    '13': 'annual_median',
    '14': 'annual_p75',
    '15': 'annual_p90',
}


def slugify(text):
    import re
    text = text.lower()
    text = re.sub(r'[,()\']', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')


def build_series_id(area_code, area_type, soc_code, datatype):
    """Build BLS OES series ID."""
    soc_nodash = soc_code.replace('-', '')
    return f'OEU{area_type}{area_code}000000{soc_nodash}{datatype}'


def fetch_series(series_ids):
    """Fetch data for a batch of series IDs from BLS API."""
    payload = {
        'seriesid': series_ids,
        'startyear': '2023',
        'endyear': '2024',
    }
    if API_KEY:
        payload['registrationkey'] = API_KEY

    data = json.dumps(payload).encode()
    req = urllib.request.Request(API_URL,
        data=data,
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'salary-data/1.0',
        })

    resp = urllib.request.urlopen(req, timeout=60)
    result = json.loads(resp.read())

    if result.get('status') != 'REQUEST_SUCCEEDED':
        msgs = result.get('message', [])
        print(f'  API error: {msgs}')
        # Fatal errors - stop immediately
        for msg in msgs:
            if 'invalid' in str(msg).lower() or 'key' in str(msg).lower():
                raise RuntimeError(f'API key error: {msg}')
        return {}

    parsed = {}
    for series in result.get('Results', {}).get('series', []):
        sid = series['seriesID']
        for d in series.get('data', []):
            if d.get('period') == 'A01':  # Annual only
                val = d.get('value', '')
                if val and val not in ('*', '#', '**', 'N'):
                    try:
                        parsed[sid] = float(val.replace(',', ''))
                    except ValueError:
                        pass
    return parsed


def init_db():
    """Create SQLite database."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.executescript('''
        CREATE TABLE occupations (
            soc_code TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            major_group TEXT,
            major_group_title TEXT,
            slug TEXT UNIQUE NOT NULL
        );

        CREATE TABLE areas (
            area_code TEXT PRIMARY KEY,
            area_title TEXT NOT NULL,
            area_type TEXT NOT NULL,
            state TEXT,
            slug TEXT UNIQUE NOT NULL
        );

        CREATE TABLE wages (
            soc_code TEXT NOT NULL,
            area_code TEXT NOT NULL,
            employment INTEGER,
            annual_mean INTEGER,
            annual_median INTEGER,
            annual_p10 INTEGER,
            annual_p25 INTEGER,
            annual_p75 INTEGER,
            annual_p90 INTEGER,
            hourly_mean REAL,
            hourly_median REAL,
            year INTEGER NOT NULL,
            PRIMARY KEY (soc_code, area_code, year)
        );

        CREATE INDEX idx_wages_area ON wages(area_code);
        CREATE INDEX idx_wages_soc ON wages(soc_code);
        CREATE INDEX idx_occupations_slug ON occupations(slug);
        CREATE INDEX idx_areas_slug ON areas(slug);
    ''')
    conn.commit()
    return conn


def extract_state(area_title):
    import re
    m = re.search(r',\s*([A-Z]{2}(?:-[A-Z]{2})*)\s*$', area_title)
    if m:
        return m.group(1).split('-')[0]
    return ''


def main():
    print('=== BLS Salary Data Fetcher ===')
    print(f'API key: {"SET" if API_KEY else "NOT SET (using v1 limits)"}')
    print(f'Max series/request: {MAX_SERIES}')
    print(f'Max queries/day: {MAX_QUERIES}')

    conn = init_db()
    c = conn.cursor()

    # Insert occupations
    print(f'\nInserting {len(TOP_OCCUPATIONS)} occupations...')
    # Build major group mapping
    major_groups = {
        '11': 'Management',
        '13': 'Business and Financial Operations',
        '15': 'Computer and Mathematical',
        '17': 'Architecture and Engineering',
        '19': 'Life, Physical, and Social Science',
        '21': 'Community and Social Service',
        '23': 'Legal',
        '25': 'Educational Instruction and Library',
        '27': 'Arts, Design, Entertainment, Sports, and Media',
        '29': 'Healthcare Practitioners and Technical',
        '31': 'Healthcare Support',
        '33': 'Protective Service',
        '35': 'Food Preparation and Serving Related',
        '37': 'Building and Grounds Cleaning and Maintenance',
        '39': 'Personal Care and Service',
        '41': 'Sales and Related',
        '43': 'Office and Administrative Support',
        '45': 'Farming, Fishing, and Forestry',
        '47': 'Construction and Extraction',
        '49': 'Installation, Maintenance, and Repair',
        '51': 'Production',
        '53': 'Transportation and Material Moving',
    }

    for soc, title in TOP_OCCUPATIONS:
        prefix = soc[:2]
        mg_code = f'{prefix}-0000'
        mg_title = major_groups.get(prefix, 'Other')
        slug = slugify(title)
        c.execute('INSERT OR IGNORE INTO occupations VALUES (?, ?, ?, ?, ?)',
                  (soc, title, mg_code, mg_title, slug))

    # Insert areas
    all_areas = [NATIONAL_AREA] + TOP_AREAS
    print(f'Inserting {len(all_areas)} areas...')

    slug_counts = {}
    for code, title in all_areas:
        if code == '0000000':
            area_type = 'N'
        else:
            area_type = 'M'
        state = extract_state(title)
        slug = slugify(title)
        if slug in slug_counts:
            slug_counts[slug] += 1
            slug = f'{slug}-{slug_counts[slug]}'
        else:
            slug_counts[slug] = 1
        c.execute('INSERT OR IGNORE INTO areas VALUES (?, ?, ?, ?, ?)',
                  (code, title, area_type, state, slug))

    conn.commit()

    # Fetch wage data via API
    print('\nFetching wage data from BLS API...')

    # Build all series IDs we need
    all_series = []
    for soc, _ in TOP_OCCUPATIONS:
        for area_code, area_title in all_areas:
            area_type = 'N' if area_code == '0000000' else 'M'
            for dt in DATATYPES:
                sid = build_series_id(area_code, area_type, soc, dt)
                all_series.append((sid, soc, area_code, dt))

    total_series = len(all_series)
    total_requests = (total_series + MAX_SERIES - 1) // MAX_SERIES
    print(f'  Total series to fetch: {total_series}')
    print(f'  Requests needed: {total_requests}')

    if total_requests > MAX_QUERIES:
        print(f'  WARNING: Need {total_requests} requests but limit is {MAX_QUERIES}/day')
        print(f'  Will fetch first {MAX_QUERIES * MAX_SERIES} series only')
        all_series = all_series[:MAX_QUERIES * MAX_SERIES]

    # Process in batches
    wage_data = {}  # key: (soc, area) -> {datatype: value}
    queries_made = 0

    for i in range(0, len(all_series), MAX_SERIES):
        batch = all_series[i:i + MAX_SERIES]
        batch_ids = [s[0] for s in batch]

        queries_made += 1
        print(f'  Request {queries_made}/{min(total_requests, MAX_QUERIES)}: {len(batch_ids)} series...', end=' ', flush=True)

        try:
            results = fetch_series(batch_ids)
            found = 0
            for sid, soc, area_code, dt in batch:
                if sid in results:
                    key = (soc, area_code)
                    if key not in wage_data:
                        wage_data[key] = {}
                    wage_data[key][DATATYPES[dt]] = results[sid]
                    found += 1
            print(f'{found} values')
        except RuntimeError as e:
            print(f'FATAL: {e}')
            print('  Stopping. Check your API key and try again.')
            break
        except Exception as e:
            print(f'ERROR: {e}')

        # Rate limit: 50 requests per 10 seconds
        if queries_made % 45 == 0:
            print('  (rate limit pause...)')
            time.sleep(12)
        else:
            time.sleep(0.25)

        if queries_made >= MAX_QUERIES:
            print(f'  Reached daily limit ({MAX_QUERIES} queries)')
            break

    # Insert wage data into DB
    print(f'\nInserting {len(wage_data)} wage records...')
    for (soc, area_code), values in wage_data.items():
        median = values.get('annual_median')
        mean = values.get('annual_mean')
        if median is None and mean is None:
            continue

        c.execute('''INSERT OR REPLACE INTO wages
            (soc_code, area_code, employment, annual_mean, annual_median,
             annual_p10, annual_p25, annual_p75, annual_p90,
             hourly_mean, hourly_median, year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 2024)''',
            (soc, area_code,
             int(values['employment']) if values.get('employment') else None,
             int(values['annual_mean']) if values.get('annual_mean') else None,
             int(median) if median else None,
             int(values['annual_p10']) if values.get('annual_p10') else None,
             int(values['annual_p25']) if values.get('annual_p25') else None,
             int(values['annual_p75']) if values.get('annual_p75') else None,
             int(values['annual_p90']) if values.get('annual_p90') else None,
            ))

    conn.commit()

    # Summary
    occ_count = c.execute('SELECT COUNT(*) FROM occupations').fetchone()[0]
    area_count = c.execute('SELECT COUNT(*) FROM areas').fetchone()[0]
    wage_count = c.execute('SELECT COUNT(*) FROM wages').fetchone()[0]
    metro_wages = c.execute('''
        SELECT COUNT(*) FROM wages w
        JOIN areas a ON w.area_code = a.area_code
        WHERE a.area_type = 'M' AND w.annual_median IS NOT NULL
    ''').fetchone()[0]

    print(f'\n=== Database Summary ===')
    print(f'  Occupations: {occ_count}')
    print(f'  Areas: {area_count}')
    print(f'  Total wage records: {wage_count}')
    print(f'  Metro wage records: {metro_wages}')
    print(f'  DB size: {os.path.getsize(DB_PATH) / 1024:.1f} KB')
    print(f'  Potential pages: {metro_wages}')
    print(f'  Queries used: {queries_made}/{MAX_QUERIES}')

    conn.close()
    print('\nDone!')


if __name__ == '__main__':
    main()
