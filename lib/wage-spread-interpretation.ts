/**
 * Wage Spread Interpretation Strip (PSU 1차 2026-05-11)
 *
 * Composes two upstream decoders into a verdict + 4-paragraph branching prose
 * that a reader can act on without flipping between data cards:
 *
 *   1. CostAdjustedWageTier  (5-band real-wage tier — BLS OEWS × BEA RPP)
 *   2. decodePercentileSpread (4-band p90/p10 ladder band — BLS OEWS)
 *
 * The output is the "Interpretation Strip" the reader sees in the hero of
 * /jobs/[slug]/, /state/[slug]/, and /state/[slug]/salary-ranges/. Each strip
 * carries:
 *
 *   - verdict     : 1-line composite (always rendered)
 *   - tone        : tailwind color group keyed off the tier
 *   - paragraphs  : 4 paragraphs — band meaning, occupation-internal meaning,
 *                   metro/state comparison, reader action
 *
 * The strip is deterministic. Same inputs → byte-identical output.
 *
 * Sources cited in the prose:
 *   - BLS OEWS p10/p50/p90 (oews.bls.gov)
 *   - BEA Regional Price Parities (bea.gov)
 *
 * Suppression behaviour: if either decoder lacks data we still emit a verdict
 * line ("Insufficient BLS data for a real-wage verdict.") rather than hiding
 * the strip — the reader sees that the gap is honest, not an omission.
 */

import type { CostAdjustedWageTierResult, CostAdjustedWageTier, PercentileSpreadResult, PercentileSpreadBand } from './cost-adjusted-wage-tier';
import { tierLabel, tierToneColor, spreadBandLabel } from './cost-adjusted-wage-tier';

export interface InterpretationStripContext {
  /** "Software Developer" — occupation title for verdict line */
  occupationTitle: string;
  /** "Austin, TX" or "Texas" — geographic anchor for verdict line */
  areaName: string;
  /** "metro" | "state" | "national" — what the area unit is */
  areaKind: 'metro' | 'state' | 'national';
}

export interface InterpretationStrip {
  verdict: string;
  tierLabel: string | null;
  tierTone: { bg: string; ring: string; text: string };
  spreadLabel: string | null;
  paragraphs: {
    /** Band meaning — what TopReal/StrongReal/... and Compressed/Moderate/... combine to */
    bandMeaning: string;
    /** Occupation-internal meaning — what the ladder shape says about this job specifically */
    occupationMeaning: string;
    /** Metro/state comparison — anchored to the area in context */
    areaComparison: string;
    /** Reader action — concrete "what to do with this verdict" */
    readerAction: string;
  };
}

const TIER_HEADLINE: Record<CostAdjustedWageTier, string> = {
  TopReal: 'a top-decile real wage',
  StrongReal: 'a strong real-wage premium',
  ModerateReal: 'a typical real-wage tier',
  BelowMedianReal: 'a below-median real-wage tier',
  WeakReal: 'a weak real-wage tier where the cost of living erodes the nominal premium',
};

const SPREAD_HEADLINE: Record<PercentileSpreadBand, string> = {
  Compressed: 'a compressed pay ladder',
  Moderate: 'a typical pay ladder',
  Wide: 'a wide pay ladder',
  Extreme: 'an extreme pay ladder',
};

export function getWageSpreadInterpretation(
  costAdj: CostAdjustedWageTierResult | null | undefined,
  spread: PercentileSpreadResult | null | undefined,
  ctx: InterpretationStripContext,
): InterpretationStrip {
  const tier = costAdj?.tier ?? null;
  const band = spread?.band ?? null;
  const ratio = costAdj?.ratio ?? null;
  const spreadRatio = spread?.spreadRatio ?? null;
  const tierTone = tierToneColor(tier);
  const tierName = tierLabel(tier);
  const spreadName = spreadBandLabel(band);

  if (tier == null && band == null) {
    return {
      verdict: `${ctx.occupationTitle} in ${ctx.areaName}: insufficient BLS OEWS data for a real-wage verdict.`,
      tierLabel: null,
      tierTone,
      spreadLabel: null,
      paragraphs: {
        bandMeaning:
          `BLS OEWS suppresses the small-cell estimates that would power either the real-wage tier or the percentile-spread band for this combination. The Bureau of Labor Statistics publishes p10/p50/p90 only when sample observations meet its reliability threshold.`,
        occupationMeaning:
          `Without a published p50, we cannot compute a nominal-to-real-wage ratio against the BEA Regional Price Parity for the area. Without a published p10/p90, we cannot compute a ladder band. The honest reading: BLS does not publish enough on this slice for the site to assign a tier — not that the occupation is missing.`,
        areaComparison:
          `Comparable readings may exist at a broader unit (state instead of metro, or national instead of state) where BLS sample sizes pass the reliability threshold. The site falls back through metro → state → national for the BEA RPP index where needed.`,
        readerAction:
          `Treat the absence as a data-availability signal, not a wage signal. The state-level page for the same occupation, or the national OES file at oews.bls.gov, will give a coarser but published number.`,
      },
    };
  }

  const ratioPct = ratio != null ? Math.round((ratio - 1) * 100) : null;
  const ratioDisplay = ratio != null
    ? (ratioPct == null
        ? ratio.toFixed(2) + '×'
        : (ratioPct > 0 ? `+${ratioPct}%` : `${ratioPct}%`) + ` vs national real median`)
    : 'real-wage tier suppressed';
  const spreadDisplay = spreadRatio != null
    ? `${spreadRatio.toFixed(1)}× p90/p10`
    : 'spread band suppressed';

  const verdict =
    `${ctx.occupationTitle} in ${ctx.areaName}: ${tierName ?? 'real-wage tier suppressed'}` +
    (ratio != null ? ` (${ratioDisplay})` : '') +
    `, ${spreadName ?? 'spread band suppressed'}` +
    (spreadRatio != null ? ` (${spreadDisplay})` : '') + '.';

  const tierHead = tier ? TIER_HEADLINE[tier] : 'no published real-wage tier';
  const spreadHead = band ? SPREAD_HEADLINE[band] : 'no published spread band';
  const rppLine = costAdj?.rppIndex && costAdj.rppLevel !== 'national'
    ? `The BEA Regional Price Parity used for the deflation is ${costAdj.rppIndex.toFixed(1)} (US=100, ${costAdj.rppLevel}-level).`
    : `The BEA Regional Price Parity for this area is the national 100 baseline.`;

  const bandMeaning =
    `Combining the two BLS-derived readings, ${ctx.occupationTitle} in ${ctx.areaName} sits at ${tierHead} on ${spreadHead}. The real-wage tier compares the area's nominal median against the national real-wage median for the same occupation after deflating by the BEA Regional Price Parity; the ladder band compares the area's own p90 against its own p10 to show how much room there is to climb inside the occupation. ${rppLine}`;

  const occupationMeaning = (() => {
    if (band === 'Compressed') {
      return `A compressed ladder (p90/p10 < 3×) means the top earners in ${ctx.occupationTitle} earn under three times what the bottom decile earns. That is characteristic of public-sector, unionized, or step-and-grade pay structures where experience and specialization buy limited premium. Career upside inside the occupation is bounded; if a reader needs a bigger jump, the path is usually a credential change or a move to an adjacent occupation, not seniority.`;
    }
    if (band === 'Moderate') {
      return `A moderate ladder (p90/p10 in 3.0–4.0×) is the typical mid-skill profile. Experience and a recognised credential buy a meaningful but not dramatic premium. ${ctx.occupationTitle} careers usually scale with years-in-role plus a sub-specialty, but the top decile is still reachable by a single career rather than a switch.`;
    }
    if (band === 'Wide') {
      return `A wide ladder (p90/p10 in 4.0–6.0×) means top earners make four-to-six times what entry-level earns. This is common in tech, legal, and finance where senior specialists, partnership tracks, or in-demand niches separate cleanly from the bottom decile. Career planning for ${ctx.occupationTitle} should treat the top of the ladder as a different role, not just a more-experienced version of the bottom.`;
    }
    if (band === 'Extreme') {
      return `An extreme spread (p90/p10 ≥ 6×) usually signals a bimodal distribution — two structurally different career paths inside one BLS occupation code (e.g. surgeon vs trainee; partner vs salaried associate). Median-level reasoning misleads here; the reader should look at the p25 and p75 separately to see which sub-population they are actually entering.`;
    }
    return `Without a published p10/p90, the within-occupation ladder cannot be characterized for ${ctx.occupationTitle} in ${ctx.areaName}. Cross-occupation comparisons should hold geography constant.`;
  })();

  const areaComparison = (() => {
    const kind = ctx.areaKind;
    if (tier === 'TopReal' || tier === 'StrongReal') {
      return `In real-wage terms, ${ctx.areaName} is above the national median for ${ctx.occupationTitle} even after the BEA RPP deflation. That is the meaningful signal: a metro with a high nominal wage but a high RPP can show as ModerateReal or even BelowMedianReal once cost-of-living is netted out. Treat this ${kind} as a stronger purchasing-power destination than its nominal salary alone would suggest.`;
    }
    if (tier === 'ModerateReal') {
      return `${ctx.areaName} pays within ±5% of the national real-wage median for ${ctx.occupationTitle}. Nominal salary differences against the US median are mostly absorbed by the local price level. Sub-area variation (specific metros inside this ${kind}, or specific industries inside the occupation) will still differ — read the metro and state subpages alongside this one.`;
    }
    if (tier === 'BelowMedianReal' || tier === 'WeakReal') {
      return `${ctx.areaName} sits below the national real-wage median for ${ctx.occupationTitle}. A higher nominal wage in a higher-RPP region can outperform the local nominal premium here; a lower-RPP region with a slightly lower nominal can beat it on real wage. Use the cross-${kind} CostAdjustedWageTier table to see which areas dominate this one in purchasing power for the same occupation.`;
    }
    return `Without a published p50 for this slice, the real-wage tier cannot be computed. The next-broader unit (state if this is a metro; national if this is a state) is the right comparison anchor while BLS suppression holds.`;
  })();

  const readerAction = (() => {
    const tierAction = (() => {
      if (tier === 'TopReal' || tier === 'StrongReal') {
        return `Negotiation: a competing offer in a different ${ctx.areaKind === 'state' ? 'state' : 'metro'} should be benchmarked on real wage (this site's tier label) and not just on nominal dollars — a 10% nominal raise into a 20% higher RPP is a real-wage cut.`;
      }
      if (tier === 'BelowMedianReal' || tier === 'WeakReal') {
        return `Relocation comparison: check the same occupation in a ModerateReal or StrongReal area before assuming the nominal raise covers the local price level. The CostAdjustedWageTier table on this page is anchored to the same BLS OEWS and BEA RPP vintage used here.`;
      }
      return `Read the area against its peers: the CostAdjustedWageTier table on this page ranks comparable ${ctx.areaKind === 'state' ? 'states' : 'metros'} on the same purchasing-power index used for this verdict.`;
    })();
    const spreadAction = (() => {
      if (band === 'Compressed' || band === 'Moderate') {
        return `Inside ${ctx.occupationTitle}, the ladder is bounded — a 10-year veteran will not earn 4× a year-1 hire in this band. Career upside usually requires moving categories, not just tenure.`;
      }
      if (band === 'Wide' || band === 'Extreme') {
        return `Inside ${ctx.occupationTitle}, the p90 is meaningfully separated from the median — career planning should target the sub-specialty or seniority track that lands inside the top quartile, not just "more years of the same".`;
      }
      return '';
    })();
    return `${tierAction} ${spreadAction}`.trim();
  })();

  return {
    verdict,
    tierLabel: tierName,
    tierTone,
    spreadLabel: spreadName,
    paragraphs: {
      bandMeaning,
      occupationMeaning,
      areaComparison,
      readerAction,
    },
  };
}
