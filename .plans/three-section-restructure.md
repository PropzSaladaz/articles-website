# Three-Section Restructure

**Decided:** 2026-09-21
**Status:** Phase 1 complete and verified on branch `three-section-restructure` (commits
`2bb1ae0`, `0271215`) against a real `next build` on 2026-09-22. Phase 2 is implemented
but was not verified against a real build. Phase 3 is partial (3.2–3.4 complete;
3.1 remains). Phase 4 is partial (4.2 complete; 4.1 is not implemented). Not yet merged
to `main`.
**Goal:** turn the site from a pure knowledge base into three editorial sections plus a
personal page, and collapse the `/articles` vs `/collections` URL split in the process.

---

## 1. Target shape

| Section | Folder | URL base | Ordering | Nav |
|---|---|---|---|---|
| A — Notes (the "mental cache") | `content/notes/` | `/notes/` | curriculum (numeric prefix) | sidebar tree |
| B — Writing (essays, opinions) | `content/writing/` | `/writing/` | reverse-chronological | list + tags |
| C — Devlog (per-project entries) | `content/devlog/` | `/devlog/` | reverse-chronological, grouped by project | list per project |
| About | *not content* — `app/about/page.tsx` | `/about` | — | header link |

The **top-level folder under `content/` is the section**. Section is therefore
`slugPieces[0]`, and the URL is just the slug.

---

## 2. Why the URL split goes away

Today `lib/content/urls.ts` picks `/articles` vs `/collections` from **folder shape**
(leaf vs. has-children), not editorial intent. Three concrete consequences that exist
in the code right now:

1. **The home page lies.** `SiteShell.tsx:159` says "Personal blog by Sidnei Teixeira"
   and `app/page.tsx:13` promises "standalone articles, thoughts, and essays", but
   `app/page.tsx:19` feeds it `articles.filter(a => !a.collectionSlug)`. That currently
   yields 5 arbitrary KB articles (*World Generation*, *Threshold Encryption Made SImple*,
   *The Helmholtz Resonator*, *Audio and DSP Basics*, *Noise and Jitter*) — articles that
   simply have no siblings yet.
2. **Reorganizing causes link rot.** Add one child folder to a leaf article and it becomes
   a collection: its URL moves from `/articles/x` to `/collections/x`.
3. **The worker has to guess.** `worker/index.ts:49` HEAD-probes *both* locations because
   a bare slug does not say which applies.

After this change: `contentPath(slug) === "/" + slug + "/"`. One rule, no shape-dependence.

---

## 3. Trap found while planning — read before touching `content/`

> Do **not** give a section folder an `index.md`.

`lib/content/tree.ts:106` treats any folder with an `index.md` as a *collection*, and a
collection only recurses into children that **also** have an `index.md`.
`content/notes/Computer Science/` has none, so `assertNoIndirectContentChildren`
(`tree.ts:75`) would throw `Unsupported content layout` and the entire KB would disappear
from the build.

**Sections are structural nodes** (`NodeKind.Node`, no `index.md`) with hand-written
landing pages at `app/<section>/page.tsx`. This is also the better design: section pages
want bespoke layout, and it keeps `collectionSlug` meaning "real editorial collection"
rather than "section".

---

## Phase 1 — Section folders + URL collapse

One commit, one redirect event. Do the move and the URL change **together** so readers,
subscribers and search engines see exactly one migration.

- [x] **1.1 Move content.** Paths contain spaces — quote them.
      ```
      git mv "content/Computer Science" "content/notes/Computer Science"
      ```
      **Deviation:** `content/writing/` and `content/devlog/` were *not* pre-created. Git does
      not track empty folders, and a childless folder renders as an empty entry in the sidebar
      tree. Create each with its first post.
- [x] **1.2 Collapse `lib/content/urls.ts`.**
      ```ts
      export function contentPath(slug: Slug): string {
        return slug ? `/${slug}/` : '/';
      }
      ```
      Keep `articlePath` / `collectionPath` as one-line wrappers — that leaves 5 of the 7
      importing files untouched.
- [x] **1.3 Fix the 4 call sites that pass options:**
      - `components/TreeNavigation.tsx:264`
      - `components/ArticleNavigation.tsx:26` and `:41`
      - `lib/markdown/rehype/production-images.ts:40`
      - `worker/index.ts:49`
- [x] **1.4 Merge the routes** into `app/[...slug]/page.tsx`.
      Base it on `app/collections/[...slug]/page.tsx` — it already resolves
      collection-first-then-article. Drop the `!article.collectionSlug` guard inherited
      from the articles route. `generateStaticParams` returns all articles + all collections.
      Delete `app/articles/` and `app/collections/`.
      *Static routes beat dynamic ones in Next, so `/about`, `/rss.xml` and `app/page.tsx`
      still win over the catch-all.*
- [x] **1.5 `scripts/prepare-content.mjs:82`** — `canonicalPathForEntry` becomes
      `slug ? '/' + slug : ''`; `type` and `parentCollectionSlug` params go away.
      This deletes the hand-sync hazard documented in CLAUDE.md.
- [x] **1.6 Worker** — `articleExists` drops from two HEAD probes to one.
- [x] **1.7 Redirects.** Every existing URL becomes `notes`, so the whole table is two rules:
      ```
      /articles/*     /notes/:splat   301
      /collections/*  /notes/:splat   301
      ```
      Emit `public/_redirects` from `prepare-content.mjs` (`public/` is already fully
      generated, and the static export copies it into `out/`, which is the assets dir).
      **Fallback** if Workers Assets does not pick it up: add `/articles/*`, `/collections/*`
      to `run_worker_first` in `wrangler.jsonc` and redirect inside the worker.
- [x] **1.8 Update CLAUDE.md.** The whole "`lib/content/urls.ts` owns the `/articles` vs
      `/collections` rule" section is now obsolete and would actively mislead later.

### Found during implementation — the original plan missed these

Everything below was discovered by grepping for hardcoded prefixes after the step list was
written, and is now handled in the Phase 1 commit:

- **`middleware.ts`** (dev only) matched `/(articles|collections)/…/images/…`. Now matches
  `/<slug>/images/…`.
- **`ViewPreferenceContext`** defaulted to Full view by sniffing `/articles/` in the URL.
  With that gone, *every* page would have silently defaulted to Summary — including future
  essays. Now: `/notes/…` → Summary, everything else → Full. **Behavior change** for the 5
  formerly-standalone articles (first-time visitors only; a stored choice still wins).
- **20 in-content links** across 12 markdown files pointed at `/collections/…` or
  `/articles/…`. Rewritten to `/notes/…` and all 20 verified against the real slug set.
- **`README.md`** documented the old URL patterns and directory layout. Updated.
- **Route merge fixed two latent bugs.** Only the old `/articles` route rendered
  `ArticleViewTracker` and `CopyCodeButtons`, so collection chapters (28 of 33 articles)
  recorded no views and had dead code-copy buttons. The merged route gives every article both.
  **Behavior change:** chapter views now count toward analytics.
- `ArticleNavigation`'s `collectionSlug` prop existed only to pick a URL base; removed.
  `parentCollectionSlug` / `isCollection` removed from the markdown pipeline options.

### Follow-ups that need a human (not code)

- **Giscus comments will be orphaned.** Mapping is `pathname` (the default; `.env` does not
  override it), so any existing discussion titled with an old `articles/…` or `collections/…`
  path will not match the new `notes/…` page. If any comments exist, rename those discussion
  titles in GitHub Discussions.
- **D1 view counts key on slug**, which now starts with `notes/`. Old rows stop matching, but
  `handlePopular` only reads the last 3 days, so the "popular" slot self-heals within ~3 days.
- **Sidebar shows a top-level "Notes" node** wrapping "Computer Science" until Phase 2.4
  scopes the sidebar to the notes subtree. Breadcrumbs likewise start with a plain-text
  "Notes" crumb (no `/notes/` page exists yet, so it is not a link).
- `/notes/` and `/notes/computer-science/` (structural nodes) 404 until Phase 2.3 adds a landing page.

**Verify before deploying** — confirmed 2026-09-22 against a real `next build` output
(28/28 static pages, clean `strict: true` type-check):
- [x] `out/` contains `out/notes/computer-science/.../index.html` and **no** `out/articles`
      or `out/collections`.
- [x] `out/_redirects` exists with both rules.
- [x] `out/sitemap.xml` and `out/rss.xml` contain only `/notes/...` URLs, no drafts —
      19 sitemap URLs + root, 15 RSS items; the 25 draft-status content folders (of 45
      total) are correctly excluded from both.
- [x] Images inside a collection chapter still resolve (this is the pair that drifted
      before) — verified `coordinate-spaces-and-hierarchies/images/img1.svg` is both
      referenced by the rendered page and present on disk at that exact path.
- [x] A view POST to `/api/article-views` still returns 202 for a collection chapter —
      verified `contentPath(slug)` for a real chapter slug matches its actual
      `out/.../index.html` location exactly, which is what the worker HEAD-probes before
      accepting the POST.

**Also found sound during this pass, beyond the original checklist:** simulation
`<iframe>` `src` values are relative (e.g. `simulations/ec_point_addition.html`), so they
were never part of the `/articles` vs `/collections` rewriting problem — they resolve
against whatever page renders them and only need the asset at the matching relative path,
which it is.

**Bug found and fixed during this pass (not in the original checklist):**
`scripts/prepare-content.mjs`'s `copyAssets()` only ever cleared the destination path it
was about to write, never a path a *previous* run wrote and this run no longer would.
Invisible while the URL scheme was stable; this migration changed every destination at
once and left the old `/articles`/`/collections` trees orphaned in `public/` (confirmed
on disk, including a `public/articles/notes/...` layer from a build run mid-migration),
exported straight into `out/` since `public/` is copied verbatim. Fixed by wiping the
whole `public/` directory at the start of the script — see commit `0271215`.

---

## Phase 2 — Section scaffolding

**Status:** implemented 2026-09-22 on branch `three-section-restructure`, not yet verified
against a real build (project rule: no builds/tests unless asked).

- [x] **2.1 `lib/content/sections.ts`** — dependency-free (type-only imports) like `urls.ts`,
      so the esbuild-bundled worker and client components can both import it.
      Holds per section: `id`, `label`, `tagline`, `order: 'curriculum' | 'chronological'`,
      `nav: 'tree' | 'list'`, `feed: boolean`. Plus `sectionOf(slug)` = first segment.
      **Note:** `sectionOf` is written to work on a raw pathname too (`/notes/x/`), not just
      a bare slug, since it strips leading/trailing separators before reading the first
      segment — `SiteShell` calls it directly on `usePathname()`.
- [x] **2.2 Reserved-slug guard** in `registerSlug` (`lib/content/tree.ts:64`) — reject
      `about`, `api`, `rss`, `sitemap.xml`, `robots.txt`, `sim-lib`, `_next`.
      It already throws on duplicate slugs; this reuses the same mechanism so a content
      folder can never silently shadow a real route.
      **Note:** checks the *whole* slug, not just its first segment — a nested slug always
      carries its parent's segments as a prefix, so only a genuine top-level folder can ever
      collide exactly. `sitemap.xml`/`robots.txt` can never actually be produced by `slugify()`
      (it strips dots), so those two entries are inert; kept for documentation/safety.
- [x] **2.3 Landing pages** — `app/notes/page.tsx`, `app/writing/page.tsx`, `app/devlog/page.tsx`.
      Notes lists its top-level topics (from the subject tree) plus a "Latest notes" strip;
      writing/devlog are a chronological card grid with an empty-state message (no content
      exists yet for either). Static routes, so they win over the `[...slug]` catch-all.
- [x] **2.4 Scope the sidebar.** `<TreeNavigation>` renders only under `/notes/*`
      (`components/SiteShell.tsx`), fed the `notes` subtree specifically (not the whole
      corpus root). Writing/devlog get the new `<SectionListNav>` (flat, dated link list) fed
      by `getLatestBySection`. Pages outside all three sections (home, and future `/about`)
      get **no sidebar at all** — the toggle button, mobile "Browse topics" bar, resizable
      `<aside>` and its drag handle are all conditionally rendered off, since neither a tree
      nor a list applies there. This is a visible layout change on `/` (previously showed the
      full KB tree) — flag if that's not the intended call.
- [x] **2.5 Header nav** — three section links + About, active-state highlighted via
      `sectionOf(pathname)` / `pathname === '/about'`. **Deviation:** dropped the "Personal
      blog by Sidnei Teixeira" tagline span to make room — it only showed at `sm:` and up,
      the same breakpoint the new nav needed. `/about` doesn't exist until Phase 3.4, so that
      link 404s until then (fine pre-merge; flag if this branch might ship before Phase 3).
- [x] **2.6 Latest-per-section projection** — `getLatestBySection(sectionId, limit?)` in
      `lib/content/content.ts`, sourced from `getAllArticles()` per the sorting gotcha below.
      Landing pages call it with a limit; `SiteShell`/`SectionListNav` call it unbounded (no
      pagination concept exists elsewhere in this codebase, so "unbounded" is fine at this
      corpus size).

> **Sorting gotcha:** `collection.articles` comes back in *folder* order (numeric prefix,
> then name). Chronological views must sort by frontmatter `date`. `getAllArticles()`
> already sorts date-desc at `lib/content/content.ts:78` — prefer it as the source.

### Bug found and fixed after Phase 2 landed (in the Phase 2 code, not a new phase)

`app/notes/page.tsx`'s "Topics" section originally linked straight to `notesNode.children`.
That's only safe one level deep — a structural `Node` has no page of its own, and the real
curriculum nests several levels before reaching a `Collection`/`StandaloneArticle`
(`notes` → `Computer Science` → `3D Programming` → `Procedural Terrain Generation` → ...).
So every one of those links 404'd. Fixed with `collapsePassThrough` (skips single-child
wrapper folders, e.g. the redundant "Computer Science" layer, since `notes` currently has
exactly one child) + `collectNavigable` (flattens a `Node`'s descendants down to the
nearest linkable ones) in `app/notes/page.tsx`, grouping by the first *branching* Node
(today: 3D Programming / Cryptography / DSP & Acoustic Fundamentals) — the same grouping
`<TreeNavigation>` shows one level into the sidebar.

---

## Phase 3 — New content types

- [ ] **3.1 `tags?: string[]`** in `lib/content/frontmatter.ts`, for writing and devlog.
      Notes does not need it — the tree is its taxonomy.
- [x] **3.2 Optional `title:` frontmatter.** Articles and collections use the trimmed
      `title:` value when present, falling back to `titleFromFolder` otherwise. Slugs and
      URLs still come from folder names, so changing a display title does not move a page.
- [x] **3.3 Devlog shape** — `content/devlog/<Project>/` is a real collection with an
      `index.md` (what the project is + current state); dated entries live inside it.
      `/devlog` groups entries under their direct project collections. The Unity Game
      collection and dated setup entry are intentionally kept as a draft boilerplate example.
- [x] **3.4 `/about`** as a hand-written `app/about/page.tsx`. Pulled forward to 2026-09-22
      (was 404ing, asked for by name). Structure only — Background / Professional experience
      / Past projects sections exist with "More to come here." placeholders; the bio line in
      the header is a first draft (see chat) pending Sidnei's real copy.

---

## Phase 4 — Feeds + landing page

- [ ] **4.1 Per-section feeds** at `/rss/notes.xml`, `/rss/writing.xml`, `/rss/devlog.xml`,
      keeping `/rss.xml` as the combined feed. `lib/content/feeds.ts` is already pure
      serializers, so this is mostly a filter argument.
      *Rationale: someone subscribing for the devlog does not want seven chapters of
      elliptic curves landing in their reader.*
- [x] **4.2 Landing page** — the front door in `app/page.tsx` has a bio line, three section
      cards, and a "Recent" strip. The strip includes the latest item from each populated
      section, then fills any remaining slots (up to six total) with the next-newest distinct
      articles overall. Empty sections are skipped and the selected entries are shown in
      date-descending order. Old `HomeArticleSections` / `ArchiveList` (latest+popular+by-year
      archive) are deleted — they only served the pre-restructure "standalone articles" home
      and had no equivalent in a 3-section front door. The `/api/article-views/popular` route
      itself was left alone (not Phase-2/4 code, not confirmed unused elsewhere).

---

## Risks and non-goals

**Phase 1 is the risky one.** It touches routing, the build script, the worker and every
URL at once. Everything after it is additive. Do Phases 1–2 *before* writing any new
posts — they are pure refactor, and strictly cheaper now (33 articles) than later.

**Still duplicated after this:** the content walk between `lib/content/tree.ts` and
`scripts/prepare-content.mjs`. This plan does not fix that. It only removes the *URL rule*
from the list of things kept in sync by hand.

**Editorial risk, not technical:** three streams is a lot of writing surface for one
person, and the failure mode is three half-dead sections. A devlog whose last entry is
eight months old signals abandonment more loudly than no devlog at all. Suggested order:
start with C (devlog) — you are doing the work anyway, so it has the lowest marginal cost —
and launch B only with a few posts banked.

**On topic choice for B:** opinions anchored to cryptography, graphics and DSP are ones
only you can write. Generic AI commentary is the most saturated topic on the internet.
