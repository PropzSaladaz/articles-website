// Locale and time zone are pinned deliberately. These dates render inside 'use client'
// components, so an unpinned toLocaleDateString formats with Node's locale on the server
// and the visitor's in the browser — a hydration mismatch for anyone outside the build
// machine's locale. Pinning the zone likewise stops a UTC-midnight ISO date from
// rendering as the previous day for visitors west of UTC.
export function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
