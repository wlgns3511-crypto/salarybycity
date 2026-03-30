export function AuthorBox() {
  return (
    <div className="mt-10 flex gap-4 p-5 bg-violet-50 border-violet-200 border rounded-xl">
      <div className="flex-shrink-0 w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center text-2xl">
        <span>💼</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-slate-900 text-sm">Salary Research Team</span>
          <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-800 rounded-full font-medium">Labor Market Specialists</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">Our labor economists analyze Occupational Employment and Wage Statistics from the Bureau of Labor Statistics, cross-referenced with O*NET occupation data and professional salary surveys to deliver accurate, current wage data for 800+ occupations across 400+ US metro areas.</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded">✓ BLS OES Survey</span>
          <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded">✓ O*NET Occupation Data</span>
          <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded">✓ LinkedIn Salary Insights</span>
        </div>
      </div>
    </div>
  );
}
