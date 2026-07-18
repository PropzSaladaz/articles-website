# articles-website

Next.js static articles site. `content/` (markdown + per-article `simulations/*.html`)
is compiled into `public/` by `scripts/prepare-content.mjs` (runs on predev/prebuild);
`public/` is fully generated and gitignored. Simulations are self-contained HTML files
embedded via `<iframe>`, wrapped by `lib/rehype-iframe-window.ts`, with play/pause +
rAF interception injected by `components/MarkdownRenderer.tsx` (same-origin).

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
  to the destination file, so they survive a deployment `basePath`.
- `watch-content.mjs` watches both `content/` and `sim-lib/` in dev.
- `injectSimLib` is exported and the pipeline only auto-runs when invoked as a script,
  so the injector is unit-testable without running the full build.

Rollout plan:
1. ✅ implement 2D renderer (no simulations touched)
2. ✅ build integration: copy sim-lib → public + opt-in script injection
3. migrate simulations one by one: add `<meta name="sim-paper" content="full">` and
   port draw calls to the Sketch API (12 of 13 are Canvas 2D; `face_culling.html` is
   CSS3DRenderer → CSS treatment instead; a future `sketch3d` variant is planned for
   WebGL sims). Migrated so far: `ec_introduction.html`, `ec_singularity.html`
   (both in .../2-Elliptic Curves Over Real Numbers/simulations/) and
   `ec_point_addition.html` and `ec_point_doubling.html` (both in .../3-Point
   Addition and the Elliptic Curve Group/simulations/) and `ec_3p_example.html`
   (.../4-Scalar Multiplication/simulations/).

`paper-ui.css` also has `.sk-row` (label+value content row) and a `pink` ink
(`--sk-ink-pink`/`.ink-pink`/`.bg-ink-pink`, mirrored in sketch.js's `theme.inks`)
added when `ec_point_addition.html` needed a 6th distinct semantic color. Add
new ink colors to *both* files by hand when a sim genuinely needs one — don't
reuse an existing color for two unrelated roles just to avoid the edit.

Shared iframe chrome (`lib/rehype-iframe-window.ts`) has no top bar and no border
at all now — the simulation content is the whole visible surface, not framed as an
"app window" (this went through two stages: first the macOS-style traffic-light
dots were removed from the top bar, then the top bar and border were removed
entirely). The play/pause button (injected by `components/MarkdownRenderer.tsx`)
now floats as an absolutely-positioned pill over the top-right corner of the
simulation itself, styled as a semi-transparent dark pill so it stays legible over
any simulation background (dark or paper-cream). `styles/markdown.css`'s
`.md-iframe-window` gets a soft box-shadow instead of a border for separation from
surrounding article text (light: `rgba(0,0,0,0.06)`, dark: `rgba(0,0,0,0.3)` — same
convention as `.md-details`). This affects every simulation (old dark ones and new
paper ones alike), not just migrated sims.
