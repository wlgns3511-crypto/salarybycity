# PSU Phase C Retrofit — salarybycity

작성일: 2026-05-10
상황: PSU 7-lens framework는 2026-05-09에 정립됨 (`_shared/docs/page-specific-utility-upgrade.md`).
Phase C는 그 이전(2026-04-25)에 `942d052`로 시작됐고, 후속 D2/D/E 사이클이 5월 초까지 이어짐.
Step 0 audit + Step 1 Plan-First 기록이 없었으므로 이 문서로 retrofit.

## Step 0 — Audit (회고)

### Site Profile
- 도메인: salarybycity.com
- 생성: 신생 6주 그룹 외 — older site, BLS OEWS 기반
- Server: s1 (DO SFO3, 64.23.131.250)
- Sitemap (HCU Phase C 후): ~570 URLs (16.3K → 570, -97%)
  - `/jobs/` + `/jobs/{occ}/` × 397 occupation hubs
  - `/state/` + `/state/{slug}/` × 51
  - `/state/{slug}/salary-ranges/` (where exists)
  - `/blog/`, `/guide/`, `/glossary/`, `/tools/col-calculator/`
  - `/about/`, `/contact/`, `/methodology/`, `/editorial-policy/`,
    `/corrections-policy/`, `/privacy/`, `/terms/`, `/disclaimer/`, `/search/`
- 데이터: BLS OEWS (May reference period, ~12-18 month publication lag)
- AdSense: pub-id 등록됨, low-value content concern → PSU 트리거
- Phase 6 v6.2: SSG 51 states + Vintage 4-layer + SOURCE_AUTHORITIES + AuthorBox source strip ✓
- HCU baseline: 5-청크 5/04 적용 ✓

### 주요 자산
- `lib/db.ts` — better-sqlite3 wrapper, 397 occupations × ~31 reporting metros
- `lib/rpp.ts` — BEA Regional Price Parities (US=100), getEffectiveRpp / nominalToReal / getStateRpp / adjustSalary
- `lib/cpi.ts` — BLS CPI-U historical inflation deflator
- `lib/authorship.ts` — BLS_DATA_YEAR/PUBLISHED, REVIEWER_ORG, SOURCE_AUTHORITIES, DB_UPDATED
- `lib/salary-commentary.ts` + `lib/salary-facts.ts` — narrative generation per occupation
- `lib/auto-faqs.ts` — derived FAQ pairs per occupation
- `lib/insights.ts` — `getJobInsights()` for InsightBlock
- `lib/format.ts` — `formatSalary`, `getDataYear`
- `components/SalaryTable.tsx` — SalaryOverview / SalaryBar / CityComparisonTable
- `components/SalaryChart.tsx` + `SalaryTrendChart.tsx`
- `components/tools/SalaryPercentile.tsx` — percentile-rank tool
- `components/TakeHomeCalculator.tsx` — federal + state take-home estimate
- `components/AuthorBox.tsx` — honest editorial strip (post-E0)

## Phase C → D2 → E Inventory

### Phase C (2026-04-25, commit `942d052`)
- 410 doorway kill: `/jobs/{occ}/{loc}/` 15,880 leaves + `/locations`, `/compare`, `/category`, `/rankings`, `/states`, `/sitemap`, `/embed`, `/es`
- Sitemap rewrite (~570 URLs)
- Layer 1/2 wire-up

### Phase D / D2 (2026-04-30, commit `35204ea`)
- depth expansion: `/tools/col-calculator/` rebuild
- glossary depth, RPP integration starter, CPI historical chart

### Phase 6 v6.2 (2026-05-?, commit `b333674`)
- SSG 51 states with `generateStaticParams` + `dynamicParams = false`
- Vintage 4-layer (data year / methodology / DB refresh / page review)
- SOURCE_AUTHORITIES split (3 SOURCE / 4 REFERENCE)
- AuthorBox source strip honest

### PSU Phase E0 (2026-05-09, commit `432f1b3`)
- Honest reframing on AuthorBox + authorship.ts (HCU trigger phrase removal: "no individual bylines", "verified by editorial team", "we don't fabricate")
- COL calculator depth + how-to-use surfaces
- `scripts/build-sitemap.ts` dirty-state aware lastmod + `latestGitLastModified()`
- `.gitignore` Excel lock files (`~$*`)

### PSU Phase E1 + E2 (2026-05-10, commit `e7a11da`)
- `components/PurchasingPowerComparison.tsx` (153L) — RPP-adjusted 5-row metro table, server component, no client JS
- Wire into `app/jobs/[slug]/page.tsx` after CityComparisonTable
- `lib/rpp.ts` add `getStateRpp(stateCode)`
- `app/state/[slug]/page.tsx` 3-card "Purchasing power" band (state RPP / real state median / Δ vs national real)
  - graceful omit when `stateRpp == null`

### PSU Phase E3 + E4 + E5 (2026-05-10, this commit)
- E3: KR-resident operator disclosure
  - `app/about/page.tsx` new "Who Operates SalaryByCity" section between "Our Mission" and "How We Verify BLS Data"
  - `app/methodology/page.tsx` new "Who runs this site" section before "Corrections and feedback"
  - 핵심 disclosure: KR-based independent operator, US public-domain sources only, no conflicts of interest with US employers/recruiters/payroll vendors, editorial scope = mapping/validation/presentation (not on-the-ground labor expertise)
- E4: `components/HowToReadSalaryData.tsx` (168L) — 5 common-mistake explainer
  1. Mean ≠ median (with per-occupation gap%)
  2. Individual occupational wage ≠ household income
  3. BLS publication lag 12-18 months
  4. OEWS = base wage only (no bonus/equity/benefits/healthcare/retirement)
  5. Nominal ≠ real (RPP adjustment needed)
  - Wire into `app/jobs/[slug]/page.tsx` after `PurchasingPowerComparison`
- E5: 이 문서

## Step 1 — Plan-First (회고)

PSU 7-lens가 Phase C 시점에 있었다면 plan은:

### Kill candidates (Step 2)
- `/jobs/{occ}/{loc}/` 15,880 leaves → killed via 410 ✓
  - GSC 3개월 데이터: 1 click + 17K 발견됨-색인X + 11K 404 → matrix가 crawl budget만 소비, ranking 무
- `/es/`, `/locations`, `/compare`, `/category`, `/rankings`, `/states`, `/sitemap`, `/embed` → killed ✓

### Improve candidates
- `/jobs/{occ}/` × 397 hubs: SalaryOverview + percentile bands + city table → 유지·개선 ✓
- `/state/{slug}/` × 51: SSG + Vintage + RPP band ✓
- `/tools/col-calculator/`: rebuild + how-to-use surfaces ✓
- `/about/`, `/methodology/`: honest tone (E0) + KR disclosure (E3) ✓

### Site-Specific Lever (Step 3) — 회고 식별
- **Data lever**: BEA Regional Price Parities (`lib/rpp.ts`) — nominal salary → real US-baseline 변환
  - PurchasingPowerComparison 으로 표면화 (E1)
  - 51 state pages 3-card band (E2)
  - col-calc tool (D2)
- **Analysis lever**:
  - take-home calculator (federal + state) — `components/TakeHomeCalculator.tsx`
  - SalaryPercentile tool — user wage → percentile rank for occupation
  - SalaryGuessGame quiz — engagement
  - HowToReadSalaryData (E4) — 5 misreading 방지 explainer
- **Authorship lever**: KR operator disclosure (E3) — 비-US 운영자 honest framing (HCU defense)

## Doorway Risk Status

| 시점 | 상태 |
|---|---|
| Phase C 이전 | HIGH — 16,092 `/jobs/{occ}/{loc}/` leaves, near-template per cell |
| Phase C 후 | MEDIUM — 397 occupation hubs + 51 states; hubs는 SalaryOverview/Bar/CityComparisonTable + commentary로 differentiation 있음 |
| E1+E2 후 | MEDIUM-LOW — RPP adjusted real salary가 모든 job hub + state page 에서 unique value 추가 |
| E3+E4 후 | LOW — KR operator disclosure + HowToReadSalaryData 5-mistake explainer가 AdSense Helpful Content signal 강화 |

## Step 5 — Validate (이번 deploy 진행 예정)
- `npm run build` — TypeScript + sitemap
- `mac-build-deploy.sh` → s1:?? PM2 reload
- Cloudflare zone purge
- Cold probes:
  - `/about/` — KR disclosure 섹션 보이는지
  - `/methodology/` — "Who runs this site" 보이는지
  - `/jobs/software-developers/` — HowToReadSalaryData 섹션 (mean vs median gap %) 보이는지
  - `/state/california/` — RPP 3-card band 보이는지

## Step 6 — Wait (outcome window)
- same day: ✅ live HTML / sitemap / robots
- 3-7 days: GSC crawl activity (`/about/`, `/methodology/` re-crawl)
- 2-4 weeks: GSC indexed count + impressions baseline
- 4-8 weeks: ranking 트렌드 + AdSense policy review (재신청 시)
- 8주 무 변화: PSU Step 2 다시, kill candidate 재평가

## Phase F (다음 단계 후보)

### F1: Job page commentary depth audit
- 397 occupation hubs 중 commentary가 generic-template 인 것 식별
- `lib/salary-commentary.ts` getOccupationCommentary 확장 (현재 facts → headline/fact/context/implication 4-layer)
- per-occupation labor-market context (예: nursing shortage, construction-trades aging, software offshoring) 추가

### F2: State page narrative
- 51 state hubs 에 cluster narrative (현재는 summary stat + cities + RPP band)
- BEA Personal Income by State 트렌드 추가 (현재 RPP만)
- state-specific tax landscape (TakeHomeCalculator 이미 존재 → 표면화)

### F3: TakeHomeCalculator 표면화 audit
- 현재는 `app/jobs/[slug]/page.tsx` 에 default `nationalWage.annual_median` 으로 prefill
- 51 state pages 에는 state median prefill 추가 검토
- col-calc tool과 cross-link 강화

### F4: AdSense 재신청 / 상태 확인
- E3+E4+E5 deploy 후 4주 outcome window
- low-value content rejection 패턴 (있다면 policy center) 확인
- KR disclosure + How-to-read 가 AdSense Helpful Content signal 충족하는지 검증

## Trap & Lesson (이 retrofit 사이클)

- **Trap**: `app/state/[slug]/page.tsx` 의 RPP 3-card band 추가 시 `getStateRpp(stateCode)` 가 null 반환할 수 있음 (state RPP는 MSA 행에 stored, MSA 가 없으면 state 없음)
  - **Fix**: graceful omit (`stateRpp ? <card/> : null`) — 51개 중 매핑 없는 주는 카드 생략
- **Trap**: zsh glob expansion 으로 `app/jobs/[slug]/page.tsx` 를 `git add` 할 때 `no matches found`
  - **Fix**: 경로 quoting (`git add 'app/jobs/[slug]/page.tsx'`)
- **Lesson**: HowToReadSalaryData 같은 site-wide explainer 는 server component 로 만들고 props 만 per-page 로 다르게 (occupationTitle + nationalMedian/Mean) 주는 게 PSU "Site-Specific Lever" 완수 + 800+ 페이지 개별화 동시 달성 — Trap #101 (AuthorBox default-layer leak) 회피 패턴
- **Lesson**: KR operator disclosure 는 "we don't have a US-based research team" 같은 negative phrasing 피하고, "what we do is build a presentation and navigation layer over public-domain releases ... what is outside our scope is X" 의 affirmative-bounded scoping 으로. (feedback-source-authorities-honest-20260506)
