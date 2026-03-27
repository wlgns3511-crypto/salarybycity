"use client";

import { useState } from "react";

// 2024 Federal Tax Brackets (Single)
const FEDERAL_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

// State income tax rates (simplified - top marginal rate)
const STATE_TAXES: Record<string, { name: string; rate: number }> = {
  AL: { name: "Alabama", rate: 0.05 }, AK: { name: "Alaska", rate: 0 },
  AZ: { name: "Arizona", rate: 0.025 }, AR: { name: "Arkansas", rate: 0.044 },
  CA: { name: "California", rate: 0.0930 }, CO: { name: "Colorado", rate: 0.044 },
  CT: { name: "Connecticut", rate: 0.0699 }, DE: { name: "Delaware", rate: 0.066 },
  FL: { name: "Florida", rate: 0 }, GA: { name: "Georgia", rate: 0.0549 },
  HI: { name: "Hawaii", rate: 0.0825 }, ID: { name: "Idaho", rate: 0.058 },
  IL: { name: "Illinois", rate: 0.0495 }, IN: { name: "Indiana", rate: 0.0315 },
  IA: { name: "Iowa", rate: 0.06 }, KS: { name: "Kansas", rate: 0.057 },
  KY: { name: "Kentucky", rate: 0.04 }, LA: { name: "Louisiana", rate: 0.0425 },
  ME: { name: "Maine", rate: 0.0715 }, MD: { name: "Maryland", rate: 0.0575 },
  MA: { name: "Massachusetts", rate: 0.05 }, MI: { name: "Michigan", rate: 0.0425 },
  MN: { name: "Minnesota", rate: 0.0985 }, MS: { name: "Mississippi", rate: 0.05 },
  MO: { name: "Missouri", rate: 0.048 }, MT: { name: "Montana", rate: 0.059 },
  NE: { name: "Nebraska", rate: 0.0564 }, NV: { name: "Nevada", rate: 0 },
  NH: { name: "New Hampshire", rate: 0 }, NJ: { name: "New Jersey", rate: 0.0897 },
  NM: { name: "New Mexico", rate: 0.059 }, NY: { name: "New York", rate: 0.0685 },
  NC: { name: "North Carolina", rate: 0.045 }, ND: { name: "North Dakota", rate: 0.0195 },
  OH: { name: "Ohio", rate: 0.035 }, OK: { name: "Oklahoma", rate: 0.0475 },
  OR: { name: "Oregon", rate: 0.099 }, PA: { name: "Pennsylvania", rate: 0.0307 },
  RI: { name: "Rhode Island", rate: 0.0599 }, SC: { name: "South Carolina", rate: 0.064 },
  SD: { name: "South Dakota", rate: 0 }, TN: { name: "Tennessee", rate: 0 },
  TX: { name: "Texas", rate: 0 }, UT: { name: "Utah", rate: 0.0465 },
  VT: { name: "Vermont", rate: 0.0875 }, VA: { name: "Virginia", rate: 0.0575 },
  WA: { name: "Washington", rate: 0 }, WV: { name: "West Virginia", rate: 0.0512 },
  WI: { name: "Wisconsin", rate: 0.0765 }, WY: { name: "Wyoming", rate: 0 },
  DC: { name: "Washington D.C.", rate: 0.0875 },
};

const STANDARD_DEDUCTION = 14600; // 2024 single
const SS_RATE = 0.062;
const SS_CAP = 168600;
const MEDICARE_RATE = 0.0145;
const MEDICARE_SURTAX_RATE = 0.009;
const MEDICARE_SURTAX_THRESHOLD = 200000;

function calcFederalTax(taxableIncome: number): number {
  let tax = 0;
  for (const b of FEDERAL_BRACKETS) {
    if (taxableIncome <= b.min) break;
    const taxable = Math.min(taxableIncome, b.max) - b.min;
    tax += taxable * b.rate;
  }
  return tax;
}

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function TakeHomeCalculator({ defaultSalary, defaultState }: { defaultSalary?: number; defaultState?: string }) {
  const [salary, setSalary] = useState(defaultSalary || 75000);
  const [state, setState] = useState(defaultState || "TX");
  const [filing, setFiling] = useState<"single" | "married">("single");

  const deduction = filing === "married" ? 29200 : STANDARD_DEDUCTION;
  const taxableIncome = Math.max(0, salary - deduction);

  const federalTax = calcFederalTax(taxableIncome);
  const stateTax = salary * (STATE_TAXES[state]?.rate || 0);
  const ssTax = Math.min(salary, SS_CAP) * SS_RATE;
  const medicareTax = salary * MEDICARE_RATE + (salary > MEDICARE_SURTAX_THRESHOLD ? (salary - MEDICARE_SURTAX_THRESHOLD) * MEDICARE_SURTAX_RATE : 0);

  const totalTax = federalTax + stateTax + ssTax + medicareTax;
  const takeHome = salary - totalTax;
  const monthlyTakeHome = takeHome / 12;
  const biweeklyTakeHome = takeHome / 26;
  const effectiveRate = salary > 0 ? (totalTax / salary) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 my-8 border border-blue-200">
      <h2 className="text-xl font-bold text-blue-900 mb-4">💰 Take-Home Pay Calculator</h2>
      <p className="text-sm text-slate-600 mb-4">
        Estimate your after-tax income. Compare your real purchasing power across different states and salary levels.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Annual Salary</label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={0}
            step={1000}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(STATE_TAXES)
              .sort((a, b) => a[1].name.localeCompare(b[1].name))
              .map(([code, s]) => (
                <option key={code} value={code}>{s.name} {s.rate === 0 ? "(No Income Tax)" : `(${(s.rate * 100).toFixed(1)}%)`}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Filing Status</label>
          <select
            value={filing}
            onChange={(e) => setFiling(e.target.value as "single" | "married")}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl p-5 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Annual Take-Home</p>
            <p className="text-2xl font-bold text-green-600">{fmt(takeHome)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly</p>
            <p className="text-2xl font-bold text-green-600">{fmt(monthlyTakeHome)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Bi-Weekly</p>
            <p className="text-2xl font-bold text-green-600">{fmt(biweeklyTakeHome)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Effective Tax Rate</p>
            <p className="text-2xl font-bold text-red-500">{effectiveRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Tax Breakdown</h3>
        <div className="space-y-2">
          {[
            { label: "Gross Salary", value: salary, color: "text-slate-800" },
            { label: `Federal Income Tax`, value: -federalTax, color: "text-red-600" },
            { label: `${STATE_TAXES[state]?.name || state} State Tax`, value: -stateTax, color: "text-red-600" },
            { label: "Social Security (FICA)", value: -ssTax, color: "text-red-600" },
            { label: "Medicare", value: -medicareTax, color: "text-red-600" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className={`text-sm font-medium ${item.color}`}>{fmt(Math.abs(item.value))}{item.value < 0 ? "" : ""}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
            <span className="font-bold text-slate-800">Take-Home Pay</span>
            <span className="font-bold text-green-600 text-lg">{fmt(takeHome)}</span>
          </div>
        </div>
        {/* Tax bar */}
        <div className="mt-4 h-6 rounded-full overflow-hidden flex bg-slate-100">
          <div style={{ width: `${(federalTax / salary) * 100}%` }} className="bg-red-400" title="Federal Tax" />
          <div style={{ width: `${(stateTax / salary) * 100}%` }} className="bg-orange-400" title="State Tax" />
          <div style={{ width: `${(ssTax / salary) * 100}%` }} className="bg-yellow-400" title="Social Security" />
          <div style={{ width: `${(medicareTax / salary) * 100}%` }} className="bg-amber-300" title="Medicare" />
          <div style={{ width: `${(takeHome / salary) * 100}%` }} className="bg-green-400" title="Take Home" />
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Federal</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> State</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> SS</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-300 inline-block" /> Medicare</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Take-Home</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        * Estimate only. Does not include local taxes, deductions, or credits.
        Need help with your finances? Consider consulting a <strong>certified financial planner</strong> or
        exploring <strong>high-yield savings accounts</strong> to maximize your take-home pay.
      </p>
    </div>
  );
}
