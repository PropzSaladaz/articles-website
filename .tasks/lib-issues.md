# `lib/` issues and high-ROI improvements

Review scope: the current `lib/` implementation, including the uncommitted draft-visibility and Markdown heading changes present when this review was performed.

The findings below are ordered by expected return on investment. They prioritize correctness, build reliability, and eliminating recurring classes of bugs over stylistic cleanup.

## 1. ✅ Fix the current Shiki TypeScript build failure

- **Status:** ✅ Complete
- **Severity:** High
- **Files:** `lib/markdown/index.ts`
- **Current location:** the `rehypeShiki` configuration passed around lines 90-111

### Problem

Running the installed TypeScript compiler directly fails with:

```text
lib/markdown/index.ts(90,23): error TS2345:
Argument of type '[{ themes: ...; langs: ...; fallbackLanguage: string; }]'
is not assignable to parameter of type '[boolean] | [RehypeShikiOptions]'.
```

The inline options object is widened in a way that does not satisfy the current `@shikijs/rehype` Unified plugin overload.

### Impact

A clean type-check or Next production build can fail even though Markdown rendering works at runtime.

### Fix direction

Import `RehypeShikiOptions`, extract the configuration into a typed constant, and validate it with `satisfies`:

```ts
const shikiOptions = {
  // ...
} satisfies RehypeShikiOptions;
```

Then pass `shikiOptions` to `.use(rehypeShiki, shikiOptions)`. Avoid suppressing the error with `as any`.

### Acceptance criteria

- [x] `./node_modules/.bin/tsc --noEmit --incremental false` passes.
- [x] A production build passes its type-check phase.
- [x] Unknown fenced-code languages still fall back to plain text.

### Resolution

The Shiki configuration now uses `satisfies RehypeShikiOptions`. The `text`
entry was removed from `langs` because Shiki treats it as a special language,
not a bundled grammar; `fallbackLanguage: 'text'` continues to provide the
intended plain-text fallback. Both the direct TypeScript check and
`./node_modules/.bin/next build` pass.

## 2. ✅ Generate sitemap and RSS as deterministic build outputs

- **Status:** ✅ Complete
- **Severity:** High
- **Files:** `lib/content/content.ts`, `lib/content/feeds.ts`
- **Current location:** `ensureLoaded()` calls `generateSitemap()` and `generateRss()` as a side effect

### Problem

Feed generation happens when the first page happens to load the content corpus. Next can copy `public/` into `out/` before that side effect runs.

This is not theoretical: stale exported feed files have already been observed, and the repository documentation records the ordering hazard.

`feeds.ts` also constructs XML through string concatenation without a centralized XML-escaping policy. CDATA values containing `]]>` or URLs containing XML-sensitive characters can produce invalid output.

### Impact

- `out/sitemap.xml` and `out/rss.xml` can be older than the article corpus.
- A normal page render unexpectedly performs filesystem writes.
- Feed correctness depends on callers remembering to filter drafts.
- Certain valid titles, summaries, or URLs could produce malformed XML.

### Fix direction

Generate these artifacts in a dedicated build phase, or expose them through deterministic static Next routes. The generator should:

1. Load content once.
2. Consume an explicitly published projection.
3. Escape XML/CDATA safely.
4. Write atomically if it writes files directly.
5. Complete before Next copies public assets.

### Acceptance criteria

- [x] Rendering a page does not write `public/sitemap.xml` or `public/rss.xml`.
- [x] A clean build always produces feeds from the same content revision.
- [x] Draft URLs are absent.
- [x] XML-sensitive fixture content produces valid XML.

### Resolution

`app/sitemap.ts` now uses Next's static sitemap convention, and
`app/rss.xml/route.ts` is a forced-static route. Both consume the published content
accessors, so drafts are filtered at the API boundary. `feeds.ts` now contains only
pure URL/RSS serialization; it safely escapes XML text and splits `]]>` inside CDATA
values. The tracked generated files were removed from `public/`. A production build
produces valid `out/sitemap.xml` and `out/rss.xml` without writing to `public/`.

## 3. ✅ Make draft visibility one coherent content projection

- **Status:** ✅ Complete
- **Severity:** High
- **Files:** `lib/content/content.ts`, `lib/content/visibility.ts`, `lib/content/tree.ts`, `lib/content/types.ts`, `components/TreeNavigation.tsx`, `scripts/prepare-content.mjs`

### Problem

The content API currently exposes several subtly different visibility policies:

- `getAllArticles()` filters drafts in production.
- `getArticleBySlug()` returns raw draft articles.
- `getCollections()` filters top-level draft collections.
- `getCollectionBySlug()` deliberately returns draft collections for parent context.
- `filterTreeNode()` keeps a draft collection with published descendants as `hasPage: false`.
- `visibleCollection()` removes draft child collections before recursing.

The last point still violates the non-cascading status invariant for nested collections. Given:

```text
published collection
└── draft collection
    └── published collection/article
```

the navigation tree preserves the published descendant, but `visibleCollection()` drops the draft intermediate collection and its entire subtree from the published parent model.

### Impact

Routes, navigation, collection listings, breadcrumbs, metadata, and sibling navigation can disagree about which content exists. Callers must also know whether a lookup is raw or visibility-filtered.

### Resolution

The content cache now creates one production projection when it loads the raw corpus.
Every public accessor, including single-item lookups and knowledge paths, reads from
that projection. A draft collection excludes its whole slug prefix from articles,
collections, tree navigation, static parameters, RSS, and sitemap output. The asset
prebuild script mirrors the rule and removes copied files for hidden entries.

`predev` and the content watcher explicitly pass `--include-drafts`, so local authoring
continues to show draft pages and assets. The `hasPage` non-linking-branch mechanism
was removed because draft collections no longer appear in the production tree.

### Acceptance criteria

- [x] No descendant beneath a draft collection is reachable in production.
- [x] No page, navigation entry, feed URL, or copied asset is reachable below a draft collection in production.
- [x] Public single-item lookups cannot accidentally return drafts or their descendants.
- [x] Development continues to expose drafts for authoring.

## 4. Centralize public URL construction, including `basePath`

- **Severity:** Medium
- **Files:** `lib/site.ts`, `lib/paths.ts`, `lib/content/feeds.ts`, `lib/content/content.ts`

### Problem

Internal navigation understands `REPO_NAME`/Next `basePath`, but absolute URLs do not consistently apply it:

- canonical article and collection URLs
- sitemap entries
- RSS item links
- the robots sitemap URL

For example, a site deployed beneath `/articles-website` can render internal navigation correctly while advertising canonical and feed URLs at the domain root.

### Impact

- Canonical metadata can point at a nonexistent or different page.
- Search engines and feed readers receive incorrect URLs.
- Base-path behavior is spread across multiple modules with an unclear `SITE_URL` contract.

### Fix direction

Define one helper such as `absoluteUrl(pathname)` or `getPublicBaseUrl()`. Clearly decide whether `SITE_URL` represents:

- an origin only, with `basePath` applied separately; or
- the complete public base URL, including a path prefix.

Route canonical, sitemap, RSS, and robots URL construction through that helper.

### Acceptance criteria

- URL tests cover empty and non-empty `REPO_NAME` values.
- Base paths appear exactly once.
- Internal routes, canonical URLs, feeds, and robots agree.

## 5. Validate frontmatter and filesystem invariants at load time

- **Severity:** Medium
- **Files:** `lib/content/builders.ts`, `lib/content/files.ts`, `lib/content/tree.ts`, `lib/content/utilities.ts`

### Problem

Most frontmatter is handled as `any`; only `status` has strict validation. Important failures are accepted or hidden:

- Missing or invalid dates silently fall back to filesystem `mtime`.
- A published article currently has no authored date and therefore changes date according to checkout/copy metadata.
- Duplicate or empty slugs are not rejected.
- Two folder names that normalize to the same slug can overwrite routes or make lookup order decide which item wins.
- An indexed folder only recognizes immediately indexed children. Content below an intermediate structural directory can be silently ignored.
- `isFile()` catches every filesystem error and converts permission or I/O failures into a misleading “missing file” result.

### Impact

Bad content can cause nondeterministic homepage/RSS ordering, overwritten routes, missing articles, or confusing errors late in the build.

### Fix direction

Introduce typed parsers for article and collection frontmatter. Validate at load time:

- `status`
- required dates for published/archived articles
- `featured`
- summary and cover field types
- non-empty normalized slug segments
- globally unique route slugs
- supported collection topology

Only treat `ENOENT` as “not a file”; rethrow other filesystem errors with the source path.

### Acceptance criteria

- Invalid frontmatter fails the build with a precise filename and field name.
- Published article dates are deterministic.
- Duplicate/empty slugs fail before static parameters or assets are generated.
- Unsupported nested directory layouts fail explicitly instead of dropping content.

## 6. Derive rendered HTML and TOC headings in one Markdown pass

- **Severity:** Medium
- **Files:** `lib/markdown/index.ts`, `lib/content/builders.ts`

### Problem

Moving `rehypeSlug` before KaTeX fixes the five current math-heading TOC failures, but HTML heading IDs and TOC entries are still derived independently:

- the main Unified pipeline creates rendered heading IDs;
- `extractHeadings()` performs a second Remark parse with a separate slugger.

The two passes process different heading sets. `rehypeSlug` advances for h1-h6, while `extractHeadings()` advances only for h1-h2. This still fails for cases such as:

```md
### Same

## Same
```

The rendered h2 becomes `same-1`, while the TOC uses `same`.

`extractHeadings()` also deliberately removes math from TOC labels, so `Restrict the Input $x$` becomes `Restrict the Input`; a math-only heading is omitted entirely.

### Impact

New heading patterns can silently reintroduce broken anchors and active-section tracking. The extra parse also duplicates work and must stay behaviorally synchronized with the main pipeline.

### Fix direction

Add a HAST plugin after `rehypeRaw` and before KaTeX that:

1. Walks all headings in document order with one slugger.
2. Assigns rendered IDs.
3. Records h1/h2 TOC entries in `file.data.headings`.
4. Defines an explicit text representation for inline math.

Return `{ html, headings }` from the same compilation and remove `extractHeadings()`.

### Acceptance criteria

- Rendered IDs and TOC IDs always come from the same pass.
- Tests cover inline math, multiple math expressions, same-level duplicates, h3/h2 collisions, raw headings, and math-only headings.
- Math remains understandable in TOC labels.

## 7. Produce valid image markup and remove inline handlers

- **Severity:** Medium
- **Files:** `lib/markdown/rehype/image-wrapper.ts`

### Problem

Remark renders a standalone Markdown image as an image inside a paragraph. The plugin replaces that child image with a block-level figure, producing invalid HTML:

```html
<p class="md-p">
  <figure class="image-loading-wrapper">...</figure>
</p>
```

This invalid structure exists in the generated output today. Browsers repair it by implicitly closing and reopening paragraphs.

The plugin also injects inline `onload` JavaScript and does not clear or update the skeleton when an image fails.

### Impact

- The final DOM differs from the generated HTML.
- Browsers can insert stray empty paragraphs and CSS spacing.
- Inline event handlers conflict with a strict Content Security Policy.
- Broken images can leave loading UI stuck indefinitely.

### Fix direction

Transform an image-only paragraph into a figure at the paragraph level. Keep genuinely inline images inline, likely with a span-based wrapper or no wrapper. Move load/error behavior into delegated client code or a small component and handle both success and failure.

### Acceptance criteria

- Generated HTML never contains `<p><figure>`.
- Inline images remain valid phrasing content.
- Skeleton state handles cached loads and failures.
- No inline JavaScript handler is required.

## 8. Add invariant-focused automated tests for `lib/`

- **Severity:** Medium
- **Files:** `lib/content/*`, `lib/markdown/*`, `lib/site.ts`

### Problem

There is no automated test command despite the project having custom filesystem classification, draft visibility rules, URL routing rules, and numerous Remark/Rehype plugins.

The draft cascade and KaTeX heading mismatch both reached working content because their contracts existed mainly in comments rather than executable tests.

### Fix direction

Add a small test harness and prioritize behavior-level fixtures over implementation snapshots.

Minimum useful coverage:

- descendants hidden by draft collection ancestors
- draft children embedded in published collections
- duplicate and empty slugs
- article versus collection URL routing
- base-path absolute URLs
- math and duplicate heading IDs
- valid standalone and inline image markup
- feed visibility and XML escaping
- content-cache failure recovery

### Acceptance criteria

- The test command runs locally and in CI.
- Each documented content invariant has at least one regression test.
- Tests exercise the real installed Markdown libraries rather than hand-written mocks.

## 9. Make content ordering deterministic

- **Severity:** Low
- **Files:** `lib/content/content.ts`, `lib/content/tree.ts`

### Problem

The article date comparator currently returns `1` when dates are equal:

```ts
res.articles.sort((a, b) => (a.date > b.date ? -1 : 1));
```

This violates comparator expectations because equal values never return `0`. Several article groups currently share the same date.

Directory sorting also returns `0` for different folder names with the same numeric prefix, leaving their order dependent on filesystem enumeration.

### Impact

Homepage, archive, feed, and navigation ordering can vary across filesystems or refactors.

### Fix direction

Use deterministic secondary keys:

```ts
res.articles.sort(
  (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)
);
```

For directory entries, compare numeric prefixes first and then compare the complete folder names when the numeric values are equal.

### Acceptance criteria

- Equal-date articles have a documented stable order.
- Equal numeric prefixes have a stable name-based order.
- Ordering tests do not depend on `readdir` input order.

## Suggested implementation order

1. Fix the Shiki type-check blocker.
2. Move feed generation into a deterministic build phase.
3. Finish the visibility/read-model design.
4. Centralize base-path-aware public URLs.
5. Add content schema and filesystem validation.
6. Derive headings from the rendering pipeline.
7. Correct image AST transformation.
8. Add regression coverage alongside the changes above.
9. Make sorting deterministic.
