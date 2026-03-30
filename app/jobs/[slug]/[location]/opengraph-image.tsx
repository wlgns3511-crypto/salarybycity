import { ImageResponse } from 'next/og';
import {
  getOccupationBySlug,
  getAreaBySlug,
  getWage,
  getWagePagesChunk,
  countAllWagePages,
} from '@/lib/db';
import { shortAreaName } from '@/lib/format';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  // Match parent page subset
  const pages = getWagePagesChunk(0, 500);
  return pages.map((p) => ({ slug: p.occ_slug, location: p.area_slug }));
}

function formatK(amount: number | null): string {
  if (amount === null) return 'N/A';
  if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'K';
  return '$' + amount.toLocaleString('en-US');
}

function formatFull(amount: number | null): string {
  if (amount === null) return 'N/A';
  return '$' + amount.toLocaleString('en-US');
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; location: string }>;
}) {
  const { slug, location } = await params;

  const occ = getOccupationBySlug(slug);
  const area = getAreaBySlug(location);

  if (!occ || !area) {
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#1e3a5f',
          color: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700 }}>SalaryByCity</div>
      </div>,
      { ...size }
    );
  }

  const wage = getWage(occ.soc_code, area.area_code);
  const cityName = shortAreaName(area.area_title);

  const percentiles = [
    { label: '10th %ile', value: wage?.annual_p10 ?? null },
    { label: '25th %ile', value: wage?.annual_p25 ?? null },
    { label: 'Median',    value: wage?.annual_median ?? null },
    { label: '75th %ile', value: wage?.annual_p75 ?? null },
    { label: '90th %ile', value: wage?.annual_p90 ?? null },
  ];

  const validValues = percentiles.map((p) => p.value).filter((v): v is number => v !== null);
  const maxVal = validValues.length > 0 ? Math.max(...validValues) : 1;
  const BAR_MAX_WIDTH = 560;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        fontFamily: 'sans-serif',
        padding: '44px 56px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', letterSpacing: 2 }}>
          SALARYBYCITY
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#0f172a',
            marginTop: 6,
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          {occ.title}
        </div>
        <div style={{ fontSize: 22, color: '#475569', marginTop: 6, fontWeight: 600 }}>
          {cityName}
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', height: 3, backgroundColor: '#2563eb', borderRadius: 2, marginBottom: 28, width: 80 }} />

      {/* Bar Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        {percentiles.map((p) => {
          const barWidth =
            p.value !== null ? Math.round((p.value / maxVal) * BAR_MAX_WIDTH) : 0;
          const isMedian = p.label === 'Median';

          return (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Label */}
              <div
                style={{
                  width: 100,
                  fontSize: 17,
                  fontWeight: isMedian ? 700 : 500,
                  color: isMedian ? '#1d4ed8' : '#64748b',
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {p.label}
              </div>

              {/* Bar track */}
              <div
                style={{
                  display: 'flex',
                  width: BAR_MAX_WIDTH,
                  height: isMedian ? 44 : 36,
                  backgroundColor: '#e2e8f0',
                  borderRadius: 8,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: barWidth,
                    height: '100%',
                    backgroundColor: isMedian ? '#1d4ed8' : '#93c5fd',
                    borderRadius: 8,
                  }}
                />
              </div>

              {/* Value */}
              <div
                style={{
                  fontSize: isMedian ? 22 : 18,
                  fontWeight: isMedian ? 800 : 600,
                  color: isMedian ? '#1d4ed8' : '#334155',
                  width: 120,
                  flexShrink: 0,
                }}
              >
                {p.value !== null ? formatFull(p.value) : 'N/A'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid #e2e8f0',
          fontSize: 14,
          color: '#94a3b8',
        }}
      >
        <div>salarybycity.com</div>
        <div>Source: BLS Occupational Employment and Wage Statistics</div>
      </div>
    </div>,
    { ...size }
  );
}
