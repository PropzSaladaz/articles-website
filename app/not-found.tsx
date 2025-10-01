import Link from 'next/link';
import { withBasePath } from '../lib/paths';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">404</h1>
      <p className="text-lg text-slate-600 dark:text-slate-300">Sorry, we couldn&apos;t find that page.</p>
      <Link
        href={withBasePath('/')}
        className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        Return home
      </Link>
    </div>
  );
}
