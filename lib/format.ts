export function formatSalary(amount: number | null): string {
  if (amount === null) return 'N/A';
  return '$' + amount.toLocaleString('en-US');
}

export function formatSalaryCompact(amount: number | null): string {
  if (amount === null) return 'N/A';
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K';
  }
  return '$' + amount.toLocaleString('en-US');
}

export function formatNumber(num: number | null): string {
  if (num === null) return 'N/A';
  return num.toLocaleString('en-US');
}

export function formatHourly(amount: number | null): string {
  if (amount === null) return 'N/A';
  return '$' + amount.toFixed(2);
}

export function getDataYear(): number {
  return 2024; // BLS OEWS latest release
}

export function shortAreaName(areaTitle: string): string {
  // "San Jose-Sunnyvale-Santa Clara, CA" → "San Jose, CA"
  const parts = areaTitle.split(',');
  if (parts.length < 2) return areaTitle;
  const city = parts[0].split('-')[0].trim();
  const state = parts[parts.length - 1].trim();
  return `${city}, ${state}`;
}
