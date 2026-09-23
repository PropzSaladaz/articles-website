# articles-website

Next.js static articles site. `content/` (markdown + per-article `simulations/*.html`)
is compiled into `public/` by `scripts/prepare-content.mjs` (runs on predev/prebuild);
`public/` is fully generated and gitignored. Simulations are self-contained HTML files
embedded via `<iframe>`, wrapped by `lib/markdown/rehype/iframe-window.ts`, with play/pause +
rAF interception injected by `components/MarkdownRenderer.tsx` (same-origin).

## Content loading, sitemap & RSS

`lib/content/content.ts`'s `ensureLoaded()` memoizes the whole corpus in a module-level
`cachePromise`. This matters: `loadAllFromDisk()` re-runs the full unified pipeline
(remark/rehype + Shiki + KaTeX) over all ~45 `index.md` files, and every page funnels
through it — `app/layout.tsx` alone pulls the nav tree on *every* page. It caches the
*promise*, not the resolved value, so parallel builds share one load. Dev deliberately
bypasses the cache (reload each request, paired with `watch-content.mjs`).

`app/sitemap.ts` and `app/rss.xml/route.ts` are static App Router routes. During a
production export, Next writes their responses directly to `out/sitemap.xml` and
`out/rss.xml`; neither route writes into `public/`. Both use the published
`getAllArticles()` / `getCollections()` projections, so draft URLs cannot leak into
the exported feeds. `lib/content/feeds.ts` only contains pure sitemap/RSS serializers
and may safely be reused by either route or tests.

A `persistCaches()` used to dump the walk result to `.cache/*.json` (5.1 MB/build).
Nothing ever read it back — it was removed along with the directory, and `feeds.ts`
was named `cache.ts` because of it.

## lib/ layout

`lib/markdown/` holds the unified pipeline: `index.ts` assembles it, `remark/` and
`rehype/` hold the custom plugins (all kebab-case). `lib/content/` is the disk-walk
layer, and only `lib/content/builders.ts` imports the markdown pipeline — the
dependency runs one way, content → markdown, and should stay that way.

**The top-level folder under `content/` is the *section*, and a page's URL is its slug.**
`notes/` is the knowledge base; `writing/` and `devlog/` are planned. A slug's first
segment is therefore its section, and `lib/content/urls.ts`'s `contentPath()` (plus the
`articlePath` / `collectionPath` wrappers) is the single source of truth for turning a slug
into a URL: `/${slug}/`. Everything builds its URLs through it — canonical URLs, sitemap,
RSS, image `src` rewriting, every component href, and the Worker's asset probe. It is
deliberately dependency-free (type-only imports) so client components and the
esbuild-bundled Worker can both import it. Nothing about a folder's *shape* (leaf vs.
collection) affects its URL, so adding a chapter to an article never moves it. One route,
`app/[...slug]/page.tsx`, serves every article and collection.

This used to be a `/articles` vs `/collections` split keyed off folder shape, written out in
nine places, and it drifted (images in collection pages pointed at nothing; the Worker
stopped recording collection views). `prepare-content.mjs` now writes `public/_redirects`
so links published under the old prefixes 301 to `/notes/…`.

**Never give a section folder an `index.md`.** A folder with one is a *collection*, and
`assertNoIndirectContentChildren` in `lib/content/tree.ts` throws on any child folder that
lacks its own `index.md` — so `content/notes/index.md` would take the whole knowledge base
out of the build. Sections are structural nodes; their landing pages are hand-written
`app/<section>/page.tsx`. Don't create empty section folders ahead of content either: a
childless node still renders as an empty entry in the sidebar tree.

**The one remaining copy of the URL rule is `scripts/prepare-content.mjs`'s
`canonicalPathForEntry`.** It decides where files are actually *copied*, and it is plain
`.mjs` running on `prebuild`, so it cannot import the TypeScript helper. These two must be
kept in agreement by hand — that constraint is the same one that keeps the content walk
duplicated between `lib/content/tree.ts` and that script. The script parses only `status`
frontmatter so it can mirror the production draft cascade when copying assets;
`predev`/the watcher pass `--include-drafts` so authors can preview drafts locally. All
other frontmatter remains the content loader's responsibility.

**Summary vs. Full view defaults by section.** `ViewPreferenceContext` opens `/notes/…` in
Summary (the review mode) and everything else in Full; a visitor's stored choice wins.

**`lib/format.ts` pins locale and time zone deliberately.** `formatDate` is called from
`'use client'` components, so an unpinned `toLocaleDateString` formats with Node's locale
on the server and the visitor's in the browser — a hydration mismatch for anyone outside
the build machine's locale.

**Typography: serif for reading, sans for UI.** `app/layout.tsx` loads Source Serif 4
via `next/font/google` (self-hosted at build, exposed as `--font-serif` / Tailwind
`font-serif`). It is applied to rendered markdown (`.md` in `styles/markdown.css`) and the
article title only; nav, sidebar, and buttons stay on the default sans. Inline code sets
its own monospace stack, so it is unaffected.

**Comments (Giscus) use a custom theme served by the site.** Giscus renders in a
giscus.app iframe the site's CSS can't reach, so `components/GiscusComments.tsx` passes it
an absolute theme URL, `/giscus/{light,dark}.css`. Those files live in the committed
`giscus/` folder (they `@import` Giscus's stock theme and override its GitHub color
variables with the site's greys, `--link` blue, and UI sans font — literal hex values,
kept in sync with `globals.css` by hand). `prepare-content.mjs` copies them into
`public/giscus/` and writes `public/_headers` with `Access-Control-Allow-Origin: *` for
`/giscus/*`, because giscus.app fetches them cross-origin; `next.config.js` adds the same
header in dev only (`headers` is unsupported under `output: 'export'`). Page-level
reactions are off by default and the comment box sits above the thread.

## sim-lib (hand-drawn simulation renderer)

`sim-lib/v1/` is a shared "paper & pencil" rendering kit for simulations:

- `vendor/rough.js` — vendored rough.js 4.6.6 UMD (global `rough`)
- `sketch.js` — 2D kit (global `Sketch`): notebook-paper theme tokens, ink palette,
  seeded stable wobble + ~5 Hz "boil", primitives, `plot()`/`axes()`/`grid()` helpers
- `paper-ui.css` — reusable DOM chrome for HUDs (`.sk-sticky`, `.sk-badge`, `.sk-hand`,
  `.ink-*`/`.bg-ink-*`) so a sim's equation/legend overlay doesn't hand-roll its own
  colors — same ink palette as `sketch.js`, kept in sync by hand (no build step)
- `demo.html` — standalone showcase/tuning page (open directly in a browser)

Seeds derive from draw-call order within a frame: sims must call `sk.clear()` (or
`sk.frame()`) once at the top of each draw loop, and keep draw order stable.

**Two separate grid concepts — don't mix them:**
- `paper({rules:'lines'})` is decorative page *texture* at a fixed pitch
  (`theme.paper.lineHeight`), with no notion of a math origin.
- `grid({originX, originY, step})` is a coordinate-aligned grid, meant to be
  called with the *same* originX/originY/step as `axes()`.
Passing `{rules:'grid'}` to `paper()` used to draw a second, differently-pitched
grid that visibly misaligned with the axes — that mode was removed. For a sim
with a coordinate system: `sk.clear({paper:false})` then `sk.grid(...)` then
`sk.axes(...)`, so there is exactly one grid on screen.

**Simulations render on a transparent canvas, not a paper-colored one.**
`paper()` used to `fillRect` a cream background (`theme.paper.bg`) before
drawing anything — that fill was also doing double duty as the per-frame
clear. It's gone now (replaced by `ctx.clearRect`, so animation loops still
clear correctly): the goal is for a sim to look drawn directly on the article
page, not on a card floating on top of it. `paper-ui.css`'s `body.sk-page`
background is `transparent` for the same reason (the `--sk-paper-bg` token
stays defined in case something wants to opt back in explicitly). The rule
lines / margin line / `grid()` squares are unaffected — those still draw,
just on transparent instead of cream.

**This only reaches sims that actually delegate to the shared mechanism.**
A sim with `class="sk-page"` and no local `background` override gets all of
this automatically. `doubling_over_f11.html` used to hand-roll an unclassed
`<body>` with a hardcoded `background: #fbf6ea` — a plain `body {...}` rule the
shared `body.sk-page` selector never matched; it now carries `sk-page` and the
shared panel classes. Every sim-paper sim's HUD now goes through `paper-ui.css`,
but a sim can still add local CSS. **Don't assume a `sim-lib/` or `paper-ui.css`
edit reaches every sim** — grep the individual file for its own `background`
rules before trusting a shared fix landed there.

**The sim's own iframe box, not just its canvas, had to stop being opaque.**
Because the sim itself can now be transparent, `lib/markdown/rehype/iframe-window.ts`'s
wrapper div carries `bg-background` so a loading sim shows the page color
instead of a hardcoded dark fallback. In
*light* mode the `<iframe>` element itself (`styles/markdown.css`'s
`.md-iframe-window iframe`) is `background: transparent`, letting that
wrapper show through cleanly — no filter is involved there, so plain CSS
transparency behaves exactly as expected.

**Dark mode: invert the whole iframe, don't redesign the ink palette — but
don't trust transparency to survive the filter untouched.** `theme.inks`
(black, blue, green, purple, pencil, etc.) is tuned for contrast against
light paper and has no dark-mode variants — against the site's dark
background it would read as low-contrast, especially black and pencil.
Rather than a second ink palette, `.dark .md-iframe-window iframe` gets the
same `invert(0.9) hue-rotate(180deg) saturate(1.2) contrast(1.05)` filter
already used on `.dark .md img`: light paper + dark ink flips to dark paper +
light ink in one shot.

The first version of this left the iframe `background: transparent` in dark
mode too, reasoning that `invert()`/`hue-rotate()`/etc. only touch RGB, never
alpha, so a fully transparent pixel should pass through unchanged and reveal
the correctly-colored, unfiltered wrapper behind it. **That held up on paper
but not in the browser** — confirmed visibly darker than the page's actual
background. Rather than chase the exact cause (a GPU-compositing/color-space
quirk from stacking `filter` + `mask-image` on a cross-document `<iframe>`
is the leading suspect, but unconfirmed), `.dark .md-iframe-window iframe`
now paints an explicit `#fcfcfc` background instead of relying on
transparency. That value isn't arbitrary: solved backwards through the
invert(0.9)/contrast(1.05) formulas from the CSS Filter Effects spec so that
*after* the filter chain, it lands back on `hsl(0 0% 9%)` — this site's
actual dark `--background`. If the filter values above ever change, this
needs recomputing to match. Net effect: everything the sim renders (its own
backdrop included) now goes through one uniform filtered raster instead of
partly relying on cross-layer transparency, which is what made it fragile.

**Edge fade applies to the background grid only, and lives in sketch.js.**
`grid()` and `paper()`'s rule lines are fixed-pitch and boundary-unaware, so a
line can land right at the canvas edge and read as a stray cropped stroke. The
fix used to be a CSS `mask-image` fade on the whole `<iframe>`, which also faded
curves, points and HUD panels near the edges. Now those two helpers draw onto an
offscreen layer (`_edgeFaded()`), fade *that* layer's edges
(`theme.paper.edgeFade`, 32px; per-call `fade: false | <px>`), and composite it
in — everything else stays fully opaque to the edge. Sims that draw their own
grid with raw `line()`/ctx calls don't get the fade. With the mask gone, the
dark-mode iframe's `#fcfcfc` backdrop edge is no longer hidden either — if it
ever shows as a faint rectangle against the page, the filter math above has
drifted.

**`--sk-sticky-bg` (the HUD note-card background) is white, not yellow.**
It was `#fdf9b8` (a yellow sticky-note color) — changed because it read as
too much visual weight for what's usually a small equation/legend readout.
White also composes correctly with the dark-mode invert above (flips to a
near-black card) without any extra dark-mode-specific styling.

**Sample count is a two-sided tradeoff, not "fewer is always smoother."**
rough.js's `curve()` jitters every point you pass it *independently* (a fixed
~1-2px magnitude that scales with `roughness`), then fits a spline through the
jittered results — it does not sample-and-jitter internally.
- Too many points (the first migration's mistake: 150-300) → lots of
  independent small offsets packed close together → reads as buzz.
- Too few points → that *same* fixed-magnitude jitter skews the spline's
  tangent estimate over a much longer arc → the curve reads as *displaced*
  from the true path, not merely textured — a real regression, not a taste
  issue, since it makes the plotted function look wrong.
`plot()`/`parametric()` default to 36 samples as a middle ground.

**Boil is what keeps a stroke feeling hand-drawn over time — don't disable it
for animating curves, tune its magnitude instead.** A curve whose geometry
already animates (morphing parameters) still needs boil's periodic re-jitter;
turning boil off makes the seed fixed, so the *same* wobble pattern just
scales/stretches with the geometry — reads as a static sketch being expanded,
not a hand re-drawing it. Two separate dials, don't conflate them:
- `boilHz` (theme default 5, tuned down from an original 8 that felt like the
  stroke was jumping to a different path each tick) controls how *often* it
  re-jitters.
- per-call `roughness` (~0.5-0.7, lower than the theme default of 1) controls
  how *far* each jitter displaces — this is the right lever for "looks
  displaced/jumpy," not disabling boil.

**Dashed lines default to a single stroke pass, not rough.js's usual double.**
rough.js draws every stroke — `line()` and `curve()` alike — as two
independently-jittered overlapping passes by default (`disableMultiStroke`
gates it). That's desirable texture on a curve, but on a *dashed* line it means
two independently-jittered dash patterns; combined with boiling (which
reseeds both passes every ~200ms), the line flickers between reading as one
dash pattern and two visibly offset ones. Since a dashed line is almost always
a precision/construction reference (e.g. "this line passes exactly through
these two points"), `_ro()` now defaults `disableMultiStroke: true` whenever
`dash` is set — pass `disableMultiStroke: false` explicitly to opt back into
the sketchy double-stroke look. This is automatic for any `dash`-using call;
no per-sim changes needed.

**Not everything should be sketchy — precise construction lines get `ruler()`,
not `line()`.** A secant/tangent line, a reflection trace, any line whose whole
point is "this passes exactly through these coordinates," actively loses its
meaning if hand-drawn wobble makes its exact path ambiguous. `sk.ruler(x1,y1,x2,y2,o)`
draws a plain canvas 2D line — no roughness, no boil, no jitter, ever — sharing
`line()`'s `ink`/`width`/`dash` vocabulary so call sites read the same way.
Think of it as the ruler to `line()`'s freehand pen: reach for `line()`/`curve()`
for content that's meant to look drawn, `ruler()` for geometry that must look
exact regardless of how "papery" the rest of the scene is.

**Floating-point domain checks need an epsilon.** A domain boundary that should
evaluate to exactly 0 (e.g. `x³+ax+b` at a cubic's root) can land a hair below
0 from rounding / root-solver residual, and that hair flips sign frame to frame
under continuous animation — the visible symptom is the curve's tip flickering
in and out right at the boundary. Guard with `val >= -1e-6 ? sqrt(max(val,0)) :
null` rather than `val >= 0 ? sqrt(val) : null`. This bites harder at low
sample counts (fewer points near the boundary to mask one flickering away).

### Build integration (prepare-content.mjs)

- `copySimLib()` copies `sim-lib/` → `public/sim-lib/` on every run (verbatim).
- `injectSimLib(html, destFile)` injects the rough.js + sketch.js + Caveat-font
  tags into a simulation's HTML, **opt-in** via `<meta name="sim-paper" content="full">`.
  Sims without the meta tag are copied untouched. Script URLs are computed relative
  to the destination file, so they resolve wherever `out/` is mounted.
- `watch-content.mjs` watches both `content/` and `sim-lib/` in dev.
- `injectSimLib` is exported and the pipeline only auto-runs when invoked as a script,
  so the injector is unit-testable without running the full build.

Rollout plan:
1. ✅ implement 2D renderer (no simulations touched)
2. ✅ build integration: copy sim-lib → public + opt-in script injection
3. migrate simulations one by one: add `<meta name="sim-paper" content="full">` and
   port draw calls to the Sketch API (12 of 13 are Canvas 2D; `face_culling.html` is
   CSS3DRenderer → CSS treatment instead; a future `sketch3d` variant is planned for
   WebGL sims). This has moved fast enough that a hardcoded list of migrated
   filenames here has already gone stale twice — check the live count instead:
   `grep -rl 'name="sim-paper"' content/`.

`paper-ui.css` also has `.sk-row` (label+value content row) and a `pink` ink
(`--sk-ink-pink`/`.ink-pink`/`.bg-ink-pink`, mirrored in sketch.js's `theme.inks`)
added when `ec_point_addition.html` needed a 6th distinct semantic color, and an `amber`
ink for legible text next to `highlight`-colored marks (it replaced two sims'
hardcoded `#a56d18`). Add
new ink colors to *both* files by hand when a sim genuinely needs one — don't
reuse an existing color for two unrelated roles just to avoid the edit.

**HUD layout is shared too: build overlays from `paper-ui.css`'s panel classes, not
utility classes.** `.sk-sticky.sk-panel` (compact readout card, top-left by default —
the injected play/pause pill owns top-right), `.sk-panel-title`, `.sk-panel-section`,
`.sk-legend` (dot / label / value grid), `.sk-label`, `.sk-value`, `.sk-hint`, and
`.sk-toolbar` + `.sk-btn` for actions along the bottom edge. Before these existed,
~11 sims each hand-built a near-identical panel with Tailwind classes and drifting fixed
widths (`w-[218px]`, `w-[232px]`, `w-[258px]`…), so a style change meant editing every
file. Every sim-paper sim with an HTML HUD is now built from them; the only local
HUD CSS left is placement (e.g. a readout raised above a control bar) and
`doubling_over_f11.html`'s one-off step navigator. Other shared pieces: `.sk-panel-eq`,
`.sk-panel-note`, `.sk-readout` (label/value rows), `.sk-field` + `.sk-range`,
`.sk-control` + `.sk-input`, `.sk-tabs`/`.sk-tab` and `.sk-chip` (JS toggles
`.is-active`), `.sk-status`, `.sk-list`, `.sk-tag`, and the `--top`/`--bottom`/`--wide`
panel modifiers.

**A sim's local CSS loses ties with `paper-ui.css`.** `injectSimLib` inserts the shared
`<link>` just before `</head>`, i.e. *after* the sim's own `<style>`, so a local rule with
the same specificity as a shared one is silently overridden. Write local placement
overrides as `.sk-panel.my-card { bottom: 84px }`, not `.my-card { … }` — the latter is
how `doubling_over_f11`'s explanation card ended up pinned onto its step buttons.

Shared iframe chrome (`lib/markdown/rehype/iframe-window.ts`) has no top bar and no border
at all now — the simulation content is the whole visible surface, not framed as an
"app window" (this went through two stages: first the macOS-style traffic-light
dots were removed from the top bar, then the top bar and border were removed
entirely). The play/pause button (injected by `components/MarkdownRenderer.tsx`)
now floats as an absolutely-positioned pill over the top-right corner of the
simulation itself, styled as a semi-transparent dark pill so it stays legible over
any simulation background (an un-migrated sim's own opaque canvas, or a migrated
one's transparent canvas over the article page). `styles/markdown.css`'s
`.md-iframe-window` gets a soft box-shadow instead of a border for separation from
surrounding article text (light: `rgba(0,0,0,0.06)`, dark: `rgba(0,0,0,0.3)` — same
convention as `.md-details`). This affects every simulation (old dark ones and new
transparent ones alike), not just migrated sims.
