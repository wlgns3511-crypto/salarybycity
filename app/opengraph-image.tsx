import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SalaryByCity - US Salary Data by City';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 20 }}>
          SalaryByCity
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          US Salary Data by City
        </div>
      </div>
    ),
    { ...size }
  );
}
