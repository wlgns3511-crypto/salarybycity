# salarybycity HCU 5-청크 patch directive (2026-05-02)

> **Tier S Depth Expansion** + **Salary Dictionary** + **COL-Adjusted Calculator** + **YoY Trends**
> Following oshapeek/taxdeductionpeek pattern. Veto #7 CLEAR, Veto #8 ADOPTED.

---

## §0 Veto #7 status + Veto #8 application

### Veto #7 (Synthetic data prevalence)
**STATUS: CLEAR.** All proposed additions use REAL primary-source data:
- BLS OEWS 2020-2024 (state + metro + national) → trends
- BEA Regional Price Parities (RPP) 2020-2023 → COL adjustment
- BLS Glossary + Investopedia/IRS public terminology → dictionary

No synthetic generation. No interpolation. No "estimated" placeholders.

### Veto #8 (data/raw/ check before declaring source blocked)
**APPLIED.** Pre-flight verified:
- `data/raw/bls-raw/` is EMPTY → all OEWS data must be re-downloaded
- `data/salary.db` (3.9 MB) contains ONLY 2024 metro+national → trends require 2020-2023 import
- `scripts/download-bls.ts` + `scripts/download_bls.py` exist (proven download paths)
- BEA RPP fetch path NOT yet exists → new script needed

---

## §1 Pre-flight gates (G1-G9)

| Gate | Check | Status | Action if FAIL |
|------|-------|--------|----------------|
| G1 | `git status` clean (or only intentional WIP) | check before Phase A | commit/stash WIP |
| G2 | `salary.db` has 2024 data (16,345+ rows) | ✅ verified | re-import if missing |
| G3 | BLS OEWS 2020-2023 download successful | ❌ NOT YET | Phase B-1 task |
| G4 | BEA RPP CSV download (state + metro) | ❌ NOT YET | Phase B-2 task |
| G5 | Glossary content drafted (50 terms) | ❌ NOT YET | Phase B-3 task |
| G6 | Existing routes (/jobs/, /state/) still 200 | ✅ verified (2,000~2,400w each) | smoke-test before deploy |
| G7 | Middleware kills working (/es/, /jobs/{occ}/{loc}/, /compare/) | ✅ verified (commit 942d052) | re-test if regressed |
| G8 | Disk free on s1 (DB will grow ~3.9MB → ~30MB) | check `df -h /` on s1 | warn user if <20% free |
| G9 | Tier S budget for ~120 new pages (50 glossary + 50 metro+state COL + tools) | confirm with user | DEFER glossary if too aggressive |

---

## §2 Asset audit (current state)

### Current sitemap composition (535 URLs)

| Bucket | Count | Status |
|--------|-------|--------|
| `/jobs/{slug}/` | 397 | ✅ ~2,000 words/page |
| `/jobs/list/{type}/` | 12 | ✅ curated rankings |
| `/state/{slug}/` | ~30 | ⚠️ only states with OEWS metro coverage |
| `/state/{slug}/salary-ranges/` | ~30 | ⚠️ same coverage |
| `/blog/{slug}/` | 48 | ✅ |
| `/guide/{slug}/` | 6 | ✅ |
| 정적 정책 페이지 | ~12 | ✅ |
| **Total** | **535** | |

### Current data depth (`salary.db`, 3.9 MB)

| Table | Rows | Coverage | Year |
|-------|------|----------|------|
| occupations | 397 | BLS SOC codes | n/a |
| areas | 51 | **50 metros + 1 national** | n/a |
| wages | 16,345 | metro × occupation × year | **2024 only** |
| comparisons | seeded only | empty/sparse | n/a |

**Critical gaps:**
1. ❌ NO state-level OEWS data (only 50 metros)
2. ❌ Only 2024 — no trend story
3. ❌ No COL adjustment (RPP missing)
4. ❌ No glossary/dictionary content
5. ❌ No salary distribution (P10-P90) visualization (data exists, not rendered)
6. ❌ comparisons table empty
7. ⚠️ 21 states with NO coverage trigger silent dropouts in sitemap

### Asset surplus (already present, underutilized)

- ✅ wages.annual_p10/p25/p75/p90 columns exist → distribution chart possible NOW
- ✅ TakeHomeCalculator component (tax math)
- ✅ SalaryGuessGame quiz
- ✅ SalaryPercentile tool
- ✅ generateAutoFaqs library
- ✅ getOccupationCommentary + getStateNarrative (template-driven)
- ✅ TableOfContents, InsightBlock, RelatedEntities (HCU upgrades)

---

## §3 8 differentiator candidates (top 4 ⭐ for Phase C)

### ⭐ #1 — Salary Dictionary / Glossary (USER REQUESTED)

**What:** 50-100 reference entries covering BLS terminology, tax/HR concepts, salary stats methodology.

**Sample entries:**
- Annual Mean Wage vs Annual Median Wage (technical distinction + when to use)
- P90/P10 Ratio (inequality measure)
- COLA (Cost-of-Living Adjustment) vs Merit Increase
- BLS OEWS vs CPS vs ACS (3 federal salary sources, when each is right)
- W-2 vs 1099 net pay comparison
- Geographic Differential (BLS internal term)
- Total Compensation vs Base Salary
- Locality Pay Adjustment (federal jobs)
- Overtime Threshold (FLSA)
- Equity Compensation (RSU, ISO, NSO basics)

**Differentiator:** Most salary sites have FAQ blurbs. Dedicated glossary with primary-source citations (BLS Handbook, IRS Publication 17, FLSA text) is rare. Each term 200-500 words.

**SEO opportunity:** Long-tail (e.g., "what is annual mean wage vs median wage" — 50+ exact queries). Each entry is a distinct page.

**Cost:** ~2-3 days of content drafting (or LLM-assisted with strict citation requirements).

### ⭐ #2 — Cost-of-Living Adjusted Salary Calculator

**What:** "Make $80K in NYC = $X in Houston" using BEA Regional Price Parities (RPP).

**Data source:** [BEA RPP](https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area) (free CSV download, updated annually).
- State-level RPP: 51 entries
- Metro-level RPP: ~380 metros
- 2008-2023 history available

**Differentiator vs competitors:** Glassdoor, Salary.com show RAW salaries. NerdWallet has crude state COL. **Authoritative BEA-backed calculator with state+metro granularity** is uncommon outside paid tools.

**Implementation:**
- New tool page: `/tools/col-calculator/`
- Inline widget on `/state/{slug}/` and `/jobs/{slug}/` pages
- Server-rendered SVG result chart (no client recharts → Trap #34/#36 safe)
- Disclosure: "Based on BEA RPP {year} — does not reflect housing-only or job-specific costs"

### ⭐ #3 — Salary Distribution Charts (P10-P25-P50-P75-P90)

**What:** Server-side SVG chart showing the FULL salary spread, not just median.

**Why:** Data ALREADY exists in `wages` table (p10/p25/p75/p90) but only median is rendered.

**Visual:** Horizontal stacked bar OR ridgeplot:
```
P10    P25    P50    P75       P90
$48K   $58K   $72K   $89K      $115K
[████████░░░░░░░░░░░░░░░░░░░░░░]
        ↑ you're here ($72K = median)
```

**Differentiator:** "P90 makes 2.4× what P10 makes" framing — inequality story.
Each /jobs/{slug}/ page gets a distribution panel + 1-paragraph commentary based on P90/P10 ratio.

**Component:** New `<SalaryDistributionChart />` (server SVG, ~80 LOC).

### ⭐ #4 — YoY Salary Trends (2020-2024 5-year history)

**What:** Import BLS OEWS 2020, 2021, 2022, 2023 → existing 2024 → 5-year wage trend per occupation × metro.

**Data:** BLS releases annual OEWS XLSX. Each year ~50MB raw, ~3MB after filtering to top 50 metros + 397 occupations × p10/median/p90.

**Visualization:** Server SVG line chart per /jobs/{slug}/ + /state/{slug}/ page.

**Story angles:**
- "RN salaries grew 12% in TX vs 7% in CA over 4 years"
- "Tech jobs in Seattle plateaued 2022→2024 after 2020-2022 boom"
- "Inflation-adjusted: median software developer in 2024 = 2020 in real dollars"

**Component:** New `<SalaryTrendChart />` (server SVG, ~100 LOC).

**Cost:** Phase B-1 download ~250MB raw → process to ~12MB delta in salary.db.

---

### Other 4 candidates (NOT in Phase C, deferred or rejected)

#### #5 — State-level BLS OEWS import (HIGH VALUE but separate scope)

**What:** Add state-level wage data (not just metro) to cover the missing 21 states.

**Why deferred:** This is a CARDINALITY expansion (sitemap +21 state pages). Better as separate Phase E after #1-#4 quality is proven.

**If Phase E approved:** Adds ~21 state pages × ~30 well-covered occupations each = ~630 new high-quality URLs.

#### #6 — Curated Job × State Comparison Pages

**What:** `/compare/registered-nurses/california-vs-texas/` — top 50-100 popular comparisons.

**Why deferred:** GSC evidence (2026-04-25 commit message) showed `/compare/` cluster generated 11,551 404s + 17,226 not-indexed signals — clearly Google-rejected territory. Reviving needs careful rebrand (e.g., `/job/{slug}/state-pay-gap/` instead of `/compare/`).

**Verdict:** REJECT for this chunk. Re-evaluate after 6-month GSC recovery.

#### #7 — Career Path / Trajectory Data (ONet integration)

**What:** "Software developer → engineering manager: typical years, salary jump."

**Why deferred:** Requires ONet career-ladder API + crosswalk to BLS SOC. ~5 days work, separate chunk.

#### #8 — Salary vs Education (Bachelor's vs Master's vs PhD)

**What:** BLS Education-Earnings table integration.

**Why deferred:** Data is at occupation × education level (not metro). Smaller dimensional space than current OEWS. Better as content addition to existing /jobs/{slug}/ pages later.

---

## §4 Doctrine alignment

| Doctrine | Status | Note |
|----------|--------|------|
| **HCU 5-청크 playbook** | ✅ Phase A/B/C/D structure | matches taxded + oshapeek |
| **Veto #7 (synthetic prevalence)** | ✅ CLEAR | all data primary-source |
| **Veto #8 (data/raw/ check)** | ✅ APPLIED | bls-raw EMPTY confirmed |
| **Trap #16 (NoFallbackError)** | ⚠️ N/A this chunk | no middleware rewrite changes |
| **Trap #34 (Tailwind dynamic)** | ⚠️ AVOID | new charts use static color classes only |
| **Trap #36 (RSC SDC hex split)** | ⚠️ AVOID | charts use `style={{ fill: '#XXX' }}` not className |
| **Trap #59 (TS data modules)** | ✅ APPLIED | RPP + glossary as TS modules, not JSON |
| **Trap #73 (robots.txt parity)** | ✅ verified | only public/robots.txt + app/robots.ts both clean |
| **Soft-404 portfolio sweep (#88)** | ✅ N/A | no async layout changes |
| **AdSense thin escape** | ✅ TARGET | each new page 800+ words real-data narrative |

---

## §5 Phase A/B/C/D commit plans

### Phase A — Audit + light touch (1-2 hours)

**Scope:** Verify existing middleware/robots state. NO functional changes unless gaps found.

**Tasks:**
1. Smoke-test all kill patterns (`/es/`, `/jobs/{occ}/{loc}/`, `/compare/`, `/category/`, `/rankings/`, `/locations/`, `/states/`, `/sitemap/`, `/embed/`) — confirm 410 responses
2. Verify `app/robots.ts` ↔ `public/robots.txt` parity
3. Bump edge version: `2026-04-25-doorway-kill` → `2026-05-02-tier-s-expansion`
4. Add new safe routes to allow-list if needed (`/glossary/`, `/tools/`)

**Commit:** `HCU 5-청크 Phase A salarybycity: middleware audit + edge version bump`

**Deploy:** `_shared/docker/docker-build-deploy.sh salarybycity`

**Verify:** GET / → x-edge-version: 2026-05-02-tier-s-expansion

---

### Phase B-1 — BLS OEWS historical import (3-4 hours)

**Scope:** Download OEWS 2020, 2021, 2022, 2023 → extend `wages` table.

**Tasks:**
1. Extend `scripts/download-bls.ts` for years parameter
2. Run `bun scripts/download-bls.ts --years 2020,2021,2022,2023` → `data/raw/bls-raw/oesm{YY}.zip`
3. Extend `scripts/parse-bls.ts` to handle multi-year merge
4. Run `bun scripts/parse-bls.ts --reindex` → `salary.db.wages` grows from 16K → ~80K rows
5. Add index: `CREATE INDEX idx_wages_year ON wages(year);`
6. Verify: `SELECT year, COUNT(*) FROM wages GROUP BY year;` returns 2020-2024 each ~16K

**Commit:** `HCU 5-청크 Phase B-1 salarybycity: BLS OEWS 2020-2023 backfill (80K rows)`

**Risk:** Some occupations/metros have data gaps in older years. Handle gracefully in Phase C trend chart (skip null points, don't extrapolate).

---

### Phase B-2 — BEA RPP import (1-2 hours)

**Scope:** Download BEA Regional Price Parities → new `rpp` table.

**Tasks:**
1. New script: `scripts/download-bea-rpp.ts`
   - Fetch state RPP CSV from `apps.bea.gov/regional/zip/SARPP.zip`
   - Fetch metro RPP CSV from `apps.bea.gov/regional/zip/MARPP.zip`
2. New script: `scripts/parse-bea-rpp.ts`
   - Build table: `rpp(area_code, area_type, year, rpp_all_items, rpp_goods, rpp_services, rpp_rents)`
   - Crosswalk metro RPP area_code (BEA MSA) to OEWS area_code (BLS MSA) via FIPS
3. Verify: ~430 rows × 4 years (2020-2023) = ~1,720 rows

**Commit:** `HCU 5-청크 Phase B-2 salarybycity: BEA RPP import + MSA crosswalk`

**New TS module (Trap #59):** `lib/rpp.ts` — typed accessor

```typescript
export function getRppForArea(areaCode: string, year: number): {
  all_items: number;
  goods: number;
  services: number;
  rents: number;
} | null { ... }

export function adjustSalary(salary: number, fromArea: string, toArea: string, year: number): {
  adjusted: number;
  ratio: number;
  source: 'BEA RPP';
} { ... }
```

---

### Phase B-3 — Salary Glossary content (2-3 hours)

**Scope:** Draft 50 reference entries with primary-source citations.

**Tasks:**
1. New TS module: `lib/glossary-data.ts`
   ```typescript
   export interface GlossaryEntry {
     slug: string;
     term: string;
     short_def: string;       // 1-sentence (for cards)
     long_def: string;        // 200-500 words
     citations: { source: string; url: string }[];
     related_terms: string[]; // for cross-linking
     category: 'BLS' | 'IRS' | 'FLSA' | 'general';
   }
   export const GLOSSARY: GlossaryEntry[] = [...];  // 50 entries
   ```

2. Categories breakdown:
   - **BLS terminology** (15): Annual mean, median, percentile, OEWS, MSA, SOC, NAICS, employment estimate, mean RSE, etc.
   - **IRS / Tax** (10): W-2 vs 1099, FICA, withholding, AGI, marginal rate, take-home, FSA/HSA, etc.
   - **FLSA / Labor law** (10): Overtime, exempt vs non-exempt, minimum wage, prevailing wage, locality pay, etc.
   - **Compensation concepts** (15): Total comp, RSU, ISO/NSO, base vs bonus, COLA, merit increase, equity vest, profit-sharing, etc.

3. Each entry MUST cite primary source (BLS Handbook URL, IRS Pub 17, etc.) — Veto #7 compliance.

**Commit:** `HCU 5-청크 Phase B-3 salarybycity: 50-entry salary glossary (Trap #59 TS module)`

---

### Phase C — UX components + new routes (4-6 hours)

#### C-1: New components (server SVG, no client deps)

| Component | LOC | Purpose | Used by |
|-----------|-----|---------|---------|
| `SalaryDistributionChart.tsx` | ~80 | P10-P90 horizontal bar (server SVG) | /jobs/{slug}/ |
| `SalaryTrendChart.tsx` | ~100 | 5-year line chart (server SVG) | /jobs/{slug}/, /state/{slug}/ |
| `COLAdjustWidget.tsx` | ~120 | Form + result (uses `<form action>`, no JS) | /state/{slug}/, /jobs/{slug}/, /tools/col-calculator/ |
| `GlossaryTermCard.tsx` | ~40 | Term card for index page | /glossary/ |
| `GlossaryEntryBody.tsx` | ~60 | Full entry rendering with citations | /glossary/{slug}/ |

**Trap #34/#36 safety:** All chart fills via `style={{ fill: '#XXX' }}`, no `bg-${color}` patterns.

#### C-2: New routes

| Route | Source | Cardinality |
|-------|--------|-------------|
| `/glossary/` | GLOSSARY index | 1 |
| `/glossary/{slug}/` | GLOSSARY entries | ~50 |
| `/tools/col-calculator/` | static page + form action | 1 |
| `/tools/` | tools index | 1 |

#### C-3: Wire into existing hubs

- `/jobs/{slug}/`: insert `<SalaryDistributionChart />` after SalaryOverview, `<SalaryTrendChart />` after CityComparisonTable, link to `/tools/col-calculator/?from={topMetro}`
- `/state/{slug}/`: insert `<SalaryTrendChart />` for state aggregate, `<COLAdjustWidget />` inline

**Commit:** `HCU 5-청크 Phase C salarybycity: 5 components + glossary + col-calculator wire-up`

---

### Phase D — Sitemap + verify (1-2 hours)

**Scope:** Extend sitemap with new routes, verification script, IndexNow push.

**Tasks:**
1. Extend `scripts/build-sitemap.ts`:
   - Add `/glossary/` (1) + `/glossary/{slug}/` (50)
   - Add `/tools/` (1) + `/tools/col-calculator/` (1)
   - Total sitemap: 535 → ~590 URLs
2. New script: `scripts/verify-deploy-20260502.sh`
   - Test 5 random /jobs/{slug}/ → expect new chart panels + 200
   - Test 5 random /state/{slug}/ → expect new trend + COL widget + 200
   - Test 10 random /glossary/{slug}/ → 200 + 200+ words
   - Test /tools/col-calculator/ → 200 + form present
   - Test /tools/col-calculator/ POST with sample input → 200 + result rendered
3. IndexNow push: ~55 new URLs to bing.com
4. Update `public/IndexNow.txt` if key rotated

**Commit:** `HCU 5-청크 Phase D salarybycity: sitemap +55, verify script, IndexNow push`

---

## §6 Files manifest

### New files
```
data/raw/bls-raw/oesm20.zip                     ~50 MB (Phase B-1)
data/raw/bls-raw/oesm21.zip                     ~50 MB (Phase B-1)
data/raw/bls-raw/oesm22.zip                     ~50 MB (Phase B-1)
data/raw/bls-raw/oesm23.zip                     ~50 MB (Phase B-1)
data/raw/bea-rpp/SARPP.zip                       ~2 MB (Phase B-2)
data/raw/bea-rpp/MARPP.zip                       ~3 MB (Phase B-2)

scripts/download-bea-rpp.ts                                (Phase B-2)
scripts/parse-bea-rpp.ts                                   (Phase B-2)

lib/rpp.ts                                                 (Phase B-2)
lib/glossary-data.ts                                       (Phase B-3, ~50 entries × 200-500w)
lib/trends.ts                                              (Phase C-1, derive series from wages)

components/SalaryDistributionChart.tsx                     (Phase C-1)
components/SalaryTrendChart.tsx                            (Phase C-1)
components/COLAdjustWidget.tsx                             (Phase C-1)
components/GlossaryTermCard.tsx                            (Phase C-1)
components/GlossaryEntryBody.tsx                           (Phase C-1)

app/glossary/page.tsx                                      (Phase C-2, index)
app/glossary/[slug]/page.tsx                               (Phase C-2, entry)
app/tools/page.tsx                                         (Phase C-2, index)
app/tools/col-calculator/page.tsx                          (Phase C-2, calculator)
app/api/col-adjust/route.ts                                (Phase C-2, form POST handler)

scripts/verify-deploy-20260502.sh                          (Phase D)
docs/CHUNK5-PATCH-DIRECTIVE-20260502.md                    (this file)
```

### Modified files
```
middleware.ts                          edge version bump (Phase A)
scripts/download-bls.ts                add years param (Phase B-1)
scripts/parse-bls.ts                   multi-year merge (Phase B-1)
scripts/build-sitemap.ts               +55 URLs (Phase D)
lib/db.ts                              add getWageTrend(), getRppFor() (Phase C-3)
app/jobs/[slug]/page.tsx               wire 3 new components (Phase C-3)
app/state/[slug]/page.tsx              wire 2 new components (Phase C-3)
app/page.tsx (home)                    add Glossary + Tools nav links (Phase C-3)
app/layout.tsx                         add /glossary/ to header nav (Phase C-3)
public/IndexNow.txt                    rotate key if needed (Phase D)
```

### DB schema changes
```sql
-- Phase B-1: extend wages (no schema change, just more rows)
-- existing PRIMARY KEY (soc_code, area_code, year) handles multi-year

-- Phase B-2: NEW table
CREATE TABLE rpp (
  area_code TEXT NOT NULL,
  area_type TEXT NOT NULL,        -- 'S' (state), 'M' (metro), 'N' (national=100)
  year INTEGER NOT NULL,
  rpp_all_items REAL NOT NULL,
  rpp_goods REAL,
  rpp_services REAL,
  rpp_rents REAL,
  PRIMARY KEY (area_code, year)
);
CREATE INDEX idx_rpp_year ON rpp(year);
```

---

## §7 Rollout sequence

```
Phase A (1-2h)   → deploy → verify edge version + smoke tests
       ↓ 24h Cloudflare cache flush observation window
Phase B-1 (3-4h) → DB grows 3.9MB → ~12MB; verify wage row counts
Phase B-2 (1-2h) → +RPP table; verify crosswalk count
Phase B-3 (2-3h) → glossary TS module; verify 50 entries × citations present
       ↓ all data layer changes committed (no deploy yet)
Phase C (4-6h)   → 5 components + 4 routes + wire-ups; LOCAL build verify first
       ↓ deploy → verify all new routes 200 + 800+ words
Phase D (1-2h)   → sitemap +55, verify script 60/60 pass, IndexNow push
       ↓ 7-day GSC observation window
```

**Total estimated effort:** 12-19 hours (1-2 dev days). Can be split across 2-3 sessions.

**Parallelizable:** B-1, B-2, B-3 are independent — could run as 3 parallel agents if user requests.

---

## §8 Verification checklist

### Phase A verify
- [ ] `curl -sI https://salarybycity.com/` → `x-edge-version: 2026-05-02-tier-s-expansion`
- [ ] `curl -sI https://salarybycity.com/es/` → 410
- [ ] `curl -sI https://salarybycity.com/jobs/registered-nurses/los-angeles-long-beach-anaheim-ca/` → 410
- [ ] `curl -sI https://salarybycity.com/compare/foo/` → 410
- [ ] `curl -s https://salarybycity.com/robots.txt` matches `app/robots.ts` Disallow list

### Phase B verify (local, before deploy)
- [ ] `sqlite3 data/salary.db "SELECT year, COUNT(*) FROM wages GROUP BY year"` → 2020,2021,2022,2023,2024 each ~16K
- [ ] `sqlite3 data/salary.db "SELECT COUNT(*) FROM rpp"` → ~1,700
- [ ] `bun -e "import('./lib/glossary-data').then(m => console.log(m.GLOSSARY.length))"` → 50
- [ ] Each glossary entry has ≥1 citation

### Phase C verify (local, before deploy)
- [ ] `bun run build` succeeds (no Trap #16 / NoFallbackError)
- [ ] `bunx tsc --noEmit` clean
- [ ] `bunx eslint .` clean
- [ ] Sample `/jobs/registered-nurses/` includes `<svg class="salary-distribution">` and `<svg class="salary-trend">`
- [ ] Sample `/glossary/annual-mean-wage/` returns 200 + ≥200 words + ≥1 citation link

### Phase D verify (production)
- [ ] sitemap.xml contains 590±5 URLs
- [ ] 5 random /jobs/{slug}/ → all 200 + new charts visible
- [ ] 5 random /state/{slug}/ → all 200 + COL widget visible
- [ ] 10 random /glossary/{slug}/ → all 200 + ≥200 words
- [ ] /tools/col-calculator/ → 200 + POST form works
- [ ] IndexNow accepted ≥50/55 URLs

---

## §9 5 open questions for user (ExitPlanMode gate)

### Q1: Glossary scope — 50 vs 100 entries?
- 50 entries: 2-3 hours drafting, ships fast
- 100 entries: 5-6 hours, broader long-tail SEO catch
- **Recommendation:** Start with 50 (Phase B-3) → add 50 more as Phase E if traffic positive.

### Q2: COL Calculator — server-action POST vs client JS?
- Server-action `<form action>`: zero client JS, slower UX (full page refresh), AdSense-safe
- Client JS hydration: instant UX, +20KB bundle, hydration risk
- **Recommendation:** Server-action POST. Aligns with our SSG-first doctrine + Trap #34/#36 avoidance.

### Q3: Trend chart — display all 5 years OR just 2020+2024 endpoints?
- All 5 years: richer story, 5 SVG <line> points × 397 jobs × 2 pages = ~4K SVG renders at build time
- 2-point bookend: simpler, faster build, "5-year change" headline
- **Recommendation:** All 5 years (modern Mac builds in 60s anyway, polish > speed).

### Q4: BLS OEWS metro coverage gaps in 2020 — interpolate or skip?
- BLS sometimes suppresses occupation × metro cells when employment estimate < 50 (privacy)
- Some 2020 cells exist in 2024 but not 2020 → broken trend line
- **Recommendation:** SKIP missing points (gap in line, no extrapolation). Veto #7 — no synthetic fill.

### Q5: Phase E (state-level OEWS for 21 missing states) — same chunk OR separate?
- Same chunk: adds 1-2 days, +21 state pages with same depth
- Separate chunk (recommended): ship Phase A-D first, observe GSC for 1-2 weeks, then Phase E if Phase A-D positive

---

## §10 vs taxded / oshapeek (comparison)

| Dimension | taxdeductionpeek | oshapeek | salarybycity (this) |
|-----------|------------------|----------|---------------------|
| Data source | IRS SOI Historic Table 2 | DOL OSHA Enforcement v4 | BLS OEWS + BEA RPP + glossary |
| Pre-existing depth | 119 URLs (state hubs deep) | 7 URLs (very thin) | 535 URLs (already medium) |
| Phase target | +0 hubs (consolidate state) | 7 → 2,096 URLs (massive) | 535 → 590 URLs (selective +55) |
| Differentiator focus | state commentary | inspection narratives | charts + glossary + COL |
| Middleware approach | AXIS B advisory (header) | HARD 410 kill | already done (commit 942d052) |
| Veto #7 risk | low | medium-high (mitigated) | low |
| Veto #8 application | n/a | data/raw/ check key | data/raw/ EMPTY confirmed → re-import needed |
| Trap #16 risk | low | mitigated (410 page exists) | low (no middleware rewrite) |
| User-facing innovation | state commentary cards | inspection-level narrative | **3 visual + glossary + COL tool** |

**salarybycity is the most "polish" oriented chunk** — base infrastructure healthy, this is depth + uniqueness layered on top, NOT triage.

---

## Decision request

User please answer Q1-Q5 above (or just say "all defaults" to accept recommendations).

Once answered, recommended sequence:
1. **Phase A first** (1-2h, low risk, immediate verify)
2. **Phase B-1/B-2/B-3 in parallel agents** (saves 3-4h vs serial)
3. **Phase C** (LOCAL build verify before deploy)
4. **Phase D** + 7-day GSC observation

Or: defer entire chunk if user wants to focus on other sites first.

---

**End of directive.**
