import Link from 'next/link';

export const runtime = 'nodejs';           // ensure Node runtime (fs available)
export const dynamic = 'force-static';     // keep SSG if you’re reading local files

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-lg text-muted-foreground">There&apos;s nothing at this address.</p>
      <Link href="/" className="text-primary underline-offset-4 hover:underline">
        Go to the home page
      </Link>
    </div>
  );
}
