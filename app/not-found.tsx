import Link from "next/link";

const POPULAR_OCCUPATIONS: [string, string][] = [
  ["registered-nurses", "Registered Nurses"],
  ["software-developers", "Software Developers"],
  ["general-and-operations-managers", "General Managers"],
  ["accountants-and-auditors", "Accountants"],
  ["elementary-school-teachers-except-special-education", "Elementary School Teachers"],
];

const POPULAR_STATES: [string, string][] = [
  ["california", "California"],
  ["texas", "Texas"],
  ["new-york", "New York"],
  ["florida", "Florida"],
  ["illinois", "Illinois"],
];

export default function NotFound() {
  return (
    <div className="py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">Page Not Found</h1>
      <p className="text-slate-600 mb-6">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. Try a search or
        pick from the suggestions below.
      </p>

      <form action="/search/" method="get" className="mb-8">
        <label htmlFor="nf-search" className="sr-only">
          Search occupations or states
        </label>
        <div className="flex gap-2">
          <input
            id="nf-search"
            name="q"
            type="search"
            placeholder="Search jobs or states (e.g. 'nurse', 'california')"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>

      <h2 className="font-semibold text-slate-800 mb-3">Popular occupations</h2>
      <ul className="space-y-1 mb-6">
        {POPULAR_OCCUPATIONS.map(([slug, label]) => (
          <li key={slug}>
            <Link href={`/jobs/${slug}/`} className="text-blue-600 hover:underline">
              {label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/jobs/" className="text-blue-600 hover:underline">
            Browse all 397 occupations &rarr;
          </Link>
        </li>
      </ul>

      <h2 className="font-semibold text-slate-800 mb-3">Top states</h2>
      <ul className="space-y-1 mb-6">
        {POPULAR_STATES.map(([slug, label]) => (
          <li key={slug}>
            <Link href={`/state/${slug}/`} className="text-blue-600 hover:underline">
              {label}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/state/" className="text-blue-600 hover:underline">
            Browse all 51 states &rarr;
          </Link>
        </li>
      </ul>

      <p className="text-sm text-slate-500">
        Or return to the <Link href="/" className="text-blue-600 hover:underline">homepage</Link>.
      </p>
    </div>
  );
}
