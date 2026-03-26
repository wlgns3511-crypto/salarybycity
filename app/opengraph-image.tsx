import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SalaryByCity - US Salary and Wage Data by Occupation and City';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#1d4ed8', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 16 }}>SalaryByCity</div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>US Salary and Wage Data by Occupation and City</div>
      </div>
    ),
    { ...size }
  );
}
