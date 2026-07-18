/**
 * sketch.js — 2D hand-drawn ("paper & pencil") renderer for article simulations.
 *
 * Wraps rough.js with:
 *   - a notebook-paper theme (ink palette, paper background, handwriting fonts)
 *   - stable per-shape randomness across animation frames (no 60fps flicker)
 *   - an optional low-frequency "boil" (re-jitter at ~8fps, hand-drawn cartoon feel)
 *   - plotting helpers for function curves, axes and grids
 *
 * Load order (plain <script> tags, no bundler):
 *   <script src="/sim-lib/v1/vendor/rough.js"></script>
 *   <script src="/sim-lib/v1/sketch.js"></script>
 *
 * Typical simulation loop:
 *   const sk = Sketch.attach(canvas);
 *   function draw() {
 *     sk.clear();                                  // resets seeds + paints paper
 *     sk.axes({ originX, originY, step: zoom });
 *     sk.plot(x => f(x), { from, to, toX, toY, ink: 'blue' });
 *     requestAnimationFrame(draw);
 *   }
 *
 * IMPORTANT: call sk.clear() (or sk.frame()) exactly once at the start of every
 * frame. Seeds are derived from the draw-call order within a frame, so shapes
 * keep a stable wobble as long as they are drawn in a stable order.
 */
(function (global) {
  'use strict';

  if (typeof rough === 'undefined') {
    throw new Error('[sketch.js] rough.js must be loaded first (vendor/rough.js)');
  }

  // ── Theme tokens ──────────────────────────────────────────────────────────
  // Single source of truth for the paper look. Tune here → every sim changes.
  const theme = {
    paper: {
      bg: '#fbf6ea',        // cream page
      rule: '#bccfe3',      // printed rule lines (light blue)
      ruleFaint: '#d7e2ee', // grid minor lines
      margin: '#e2948d',    // red margin line
      lineHeight: 34,       // px between rule lines
      marginX: 64,          // px position of the margin line
    },
    // Ink palette. Names are the API ("ink: 'blue'"); values are what a pen
    // or pencil actually looks like on cream paper.
    inks: {
      blue: '#2f4f8f',      // ballpoint blue    (was #89b4fa in dark sims)
      black: '#2d2a26',     // fountain-pen black
      red: '#c34a3d',       // red pen           (was #f5c2e7)
      green: '#4a7c59',     // green pen         (was #a6e3a1)
      purple: '#6b4d9e',
      orange: '#c9762b',
      pink: '#b5548f',      // rose pen — distinct from red & purple, for a
                            // 6th semantic role (e.g. a "ghost"/intermediate
                            // point distinct from both an endpoint and a line)
      pencil: '#5f5b56',    // graphite
      pencilLight: '#a09b93',
      highlight: '#f2d95c', // highlighter (use as fill)
    },
    fonts: {
      hand: "'Caveat', 'Segoe Print', 'Bradley Hand', cursive",
      size: 18,
    },
    defaults: {
      roughness: 1,          // rough.js's own default; curve smoothness is
      bowing: 1,             // governed far more by sample count (see plot())
      strokeWidth: 2,
      fillStyle: 'hachure',  // hachure | cross-hatch | zigzag | dots | solid
      hachureGap: 6,
      boilHz: 5,             // re-jitter frequency; false disables globally.
      // 8 felt like the strokes were jumping to a different path each tick;
      // boil:false (no re-jitter at all) felt like a static sketch being
      // stretched as its geometry animates. This is the middle ground: the
      // wobble itself stays visibly alive over time without looking erratic.
    },
  };

  // Resolve "ink" names to colors; raw CSS colors pass through untouched.
  function inkColor(v, fallback) {
    if (v == null) return fallback;
    return theme.inks[v] || v;
  }

  // ── Sketch context ────────────────────────────────────────────────────────

  class SketchContext {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} [opts]
     * @param {number}  [opts.seed=7]      base seed for all wobble
     * @param {number|false} [opts.boil]   boil frequency in Hz, false = static
     * @param {number}  [opts.roughness]   default roughness for all shapes
     * @param {number}  [opts.bowing]      default bowing for all shapes
     * @param {number}  [opts.strokeWidth] default stroke width
     */
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.rough = rough.canvas(canvas);
      this.gen = this.rough.generator;
      this.theme = theme;

      this._base = (opts.seed == null ? 7 : opts.seed) >>> 0;
      this._boilHz = opts.boil === undefined ? theme.defaults.boilHz : opts.boil;
      this._defaults = {
        roughness: opts.roughness ?? theme.defaults.roughness,
        bowing: opts.bowing ?? theme.defaults.bowing,
        strokeWidth: opts.strokeWidth ?? theme.defaults.strokeWidth,
      };

      this._callIndex = 0;
      this._boilTick = 0;
      this.frame(0);
    }

    /** Logical drawing width/height in the context's current coordinate
     *  space — equals canvas.width unless the context is DPR-scaled
     *  (e.g. via Sketch.fit). paper()/axes()/grid() use these. */
    get width() {
      const t = this.ctx.getTransform();
      return this.canvas.width / (t.a || 1);
    }

    get height() {
      const t = this.ctx.getTransform();
      return this.canvas.height / (t.d || 1);
    }

    // ── Frame management ────────────────────────────────────────────────

    /**
     * Mark the start of a frame: resets the draw-call counter (which keeps
     * per-shape seeds stable) and advances the boil clock.
     * @param {number} [tMs] time in ms; defaults to performance.now()
     */
    frame(tMs) {
      const t = (tMs === undefined ? performance.now() : tMs) / 1000;
      this._callIndex = 0;
      this._boilTick = this._boilHz ? Math.floor(t * this._boilHz) : 0;
      return this;
    }

    /**
     * frame() + paint the notebook page. The usual first call of a draw loop.
     * @param {object} [paperOpts] forwarded to paper(); pass {paper:false} to
     *                             just clear to the plain cream background.
     */
    clear(paperOpts) {
      this.frame();
      this.paper(paperOpts);
      return this;
    }

    // Derive the seed for the current draw call. Stable across frames for a
    // stable draw order; shifted by the boil tick unless {boil:false}.
    _seedFor(o) {
      const idx = this._callIndex++;
      if (o && o.seed != null) return o.seed;
      const boil = o && o.boil === false ? 0 : this._boilTick;
      // Two large primes spread call index and boil tick across the seed space.
      return (((this._base % 65521) + 1) * 2654435761 + idx * 7919 + boil * 104729) % 2147483646 + 1;
    }

    // Merge per-call options with theme defaults into rough.js options.
    _ro(o = {}) {
      const stroke = inkColor(o.ink ?? o.stroke, theme.inks.black);
      const out = {
        seed: this._seedFor(o),
        stroke,
        strokeWidth: o.width ?? o.strokeWidth ?? this._defaults.strokeWidth,
        roughness: o.roughness ?? this._defaults.roughness,
        bowing: o.bowing ?? this._defaults.bowing,
      };
      if (o.fill != null) {
        out.fill = inkColor(o.fill);
        out.fillStyle = o.fillStyle ?? theme.defaults.fillStyle;
        out.hachureGap = o.hachureGap ?? theme.defaults.hachureGap;
        if (o.hachureAngle != null) out.hachureAngle = o.hachureAngle;
        if (o.fillWeight != null) out.fillWeight = o.fillWeight;
      }
      if (o.dash) out.strokeLineDash = Array.isArray(o.dash) ? o.dash : [8, 8];
      // rough.js draws every stroke as two independently-jittered overlapping
      // passes by default ("multi-stroke") — desirable texture on a curve,
      // but on a DASHED line it means two independently-jittered dash
      // patterns, so boiling (which reseeds both every ~200ms) makes the
      // line flicker between looking like one dash pattern and two offset
      // ones. Dashed lines are almost always precision/construction
      // references (e.g. "passes exactly through these two points"), so
      // default them to a single clean pass; pass disableMultiStroke:false
      // to opt back into the sketchy double-stroke look on purpose.
      if (o.disableMultiStroke != null) {
        out.disableMultiStroke = o.disableMultiStroke;
      } else if (o.dash) {
        out.disableMultiStroke = true;
      }
      return out;
    }

    // ── Paper background ────────────────────────────────────────────────

    /**
     * Paint the notebook page: cream background + rule lines.
     *
     * This is decorative page *texture* at a fixed pitch — it has no notion
     * of a math origin. For sims with a coordinate system, pair this with
     * {paper:false} (skip the texture) plus a separate grid() call using the
     * same originX/originY/step as axes(), so there is exactly one grid on
     * screen and it lines up with the axis ticks. Mixing this fixed-pitch
     * texture with a math-aligned grid is what caused visible misalignment
     * before this became two-mode: 'lines' (ruled paper) or nothing.
     *
     * @param {object} [o]
     * @param {'lines'|'blank'} [o.rules='lines']
     * @param {boolean} [o.margin]     red margin line (default true for 'lines')
     * @param {number}  [o.lineHeight] px between rules
     */
    paper(o = {}) {
      const w = this.width;
      const h = this.height;
      if (o.paper === false) {
        this.ctx.fillStyle = theme.paper.bg;
        this.ctx.fillRect(0, 0, w, h);
        return this;
      }
      const ctx = this.ctx;
      const rules = o.rules || 'lines';
      const lh = o.lineHeight || theme.paper.lineHeight;

      ctx.fillStyle = theme.paper.bg;
      ctx.fillRect(0, 0, w, h);

      // Printed rules are machine-straight on real paper — plain ctx lines.
      ctx.lineWidth = 1;
      if (rules === 'lines') {
        ctx.strokeStyle = theme.paper.rule;
        ctx.beginPath();
        for (let y = lh; y < h; y += lh) {
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(w, y + 0.5);
        }
        ctx.stroke();
      }
      const margin = o.margin ?? (rules === 'lines');
      if (margin) {
        ctx.strokeStyle = theme.paper.margin;
        ctx.beginPath();
        ctx.moveTo(theme.paper.marginX + 0.5, 0);
        ctx.lineTo(theme.paper.marginX + 0.5, h);
        ctx.stroke();
      }
      return this;
    }

    // ── Primitives (screen-space pixels) ────────────────────────────────

    line(x1, y1, x2, y2, o) {
      this.rough.line(x1, y1, x2, y2, this._ro(o));
      return this;
    }

    /**
     * A precise, non-sketchy straight line — plain canvas 2D, no roughness,
     * no boil, no jitter. For exact geometric/construction references where
     * the whole point is that the line passes exactly through given
     * coordinates (e.g. a secant/tangent line through two points) — hand-
     * drawn wobble there doesn't read as charming texture, it reads as the
     * line not actually being where the math says it is. Shares `line()`'s
     * ink/width/dash vocabulary so call sites feel consistent; think of it
     * as the ruler to line()'s freehand pen.
     */
    ruler(x1, y1, x2, y2, o = {}) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = inkColor(o.ink ?? o.stroke, theme.inks.black);
      ctx.lineWidth = o.width ?? o.strokeWidth ?? this._defaults.strokeWidth;
      if (o.dash) ctx.setLineDash(Array.isArray(o.dash) ? o.dash : [8, 8]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      return this;
    }

    rect(x, y, w, h, o) {
      this.rough.rectangle(x, y, w, h, this._ro(o));
      return this;
    }

    /** Circle takes a RADIUS (rough.js itself takes a diameter). */
    circle(cx, cy, r, o) {
      this.rough.circle(cx, cy, r * 2, this._ro(o));
      return this;
    }

    ellipse(cx, cy, rx, ry, o) {
      this.rough.ellipse(cx, cy, rx * 2, ry * 2, this._ro(o));
      return this;
    }

    polygon(points, o) {
      this.rough.polygon(points, this._ro(o));
      return this;
    }

    /** Sketchy open curve through [x,y] points (screen space). */
    curve(points, o) {
      if (points.length < 2) return this;
      this.rough.curve(points, this._ro(o));
      return this;
    }

    /** SVG path string, e.g. sk.path('M10 80 Q95 10 180 80'). */
    path(d, o) {
      this.rough.path(d, this._ro(o));
      return this;
    }

    /** Straight polyline (no spline smoothing), e.g. for signals/waveforms. */
    polyline(points, o) {
      if (points.length < 2) return this;
      this.rough.linearPath(points, this._ro(o));
      return this;
    }

    /**
     * A marked point: small solid-ish dot, optionally labeled.
     * sk.point(x, y, { label: 'P', ink: 'red' })
     */
    point(x, y, o = {}) {
      const r = o.r ?? 5;
      const color = inkColor(o.ink ?? o.stroke, theme.inks.black);
      this.rough.circle(x, y, r * 2, {
        ...this._ro({ ...o, fill: o.ink ?? o.stroke ?? 'black' }),
        fillStyle: 'solid',
        stroke: color,
      });
      if (o.label) {
        this.text(o.label, x + r + 4, y - r - 4, { ink: o.ink ?? o.stroke, boil: false, size: o.size });
      }
      return this;
    }

    /** Line with a hand-drawn arrowhead at (x2, y2). */
    arrow(x1, y1, x2, y2, o = {}) {
      this.line(x1, y1, x2, y2, o);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const len = o.headLength ?? 12;
      const spread = 0.45;
      this.line(x2, y2, x2 - len * Math.cos(angle - spread), y2 - len * Math.sin(angle - spread), o);
      this.line(x2, y2, x2 - len * Math.cos(angle + spread), y2 - len * Math.sin(angle + spread), o);
      return this;
    }

    /**
     * Handwritten text. Slight seeded rotation so labels sit "casually".
     * @param {object} [o] { ink, size, align, baseline, rotate, boil }
     */
    text(str, x, y, o = {}) {
      const ctx = this.ctx;
      const seed = this._seedFor(o);
      const size = o.size ?? theme.fonts.size;
      ctx.save();
      ctx.font = `${o.weight ? o.weight + ' ' : ''}${size}px ${theme.fonts.hand}`;
      ctx.fillStyle = inkColor(o.ink ?? o.stroke, theme.inks.black);
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = o.baseline || 'alphabetic';
      // ±1.2° pseudo-random tilt derived from the seed.
      const tilt = o.rotate ?? ((seed % 1000) / 1000 - 0.5) * 0.042;
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.fillText(str, 0, 0);
      ctx.restore();
      return this;
    }

    // ── Plotting helpers ────────────────────────────────────────────────

    /**
     * Plot y = fn(x). Sampling happens in math space; toX/toY map math → px.
     * fn may return null/NaN/undefined for gaps — the curve splits there
     * (essential for functions with restricted domains, e.g. elliptic curves).
     *
     * sk.plot(x => Math.sqrt(x*x*x + a*x + b), { from, to, toX, toY, ink: 'blue' })
     *
     * rough.js's curve() jitters every point you give it independently (fixed
     * ~1-2px magnitude per point, scaling with `roughness`), then fits a
     * spline through the jittered results — it does NOT sample-and-jitter
     * internally. This cuts both ways:
     *   - too many points (the original migration's mistake: 150-300) means
     *     lots of independent small offsets packed close together → "buzz".
     *   - too few points means the *same* fixed-magnitude jitter skews the
     *     spline's tangent estimate over a much longer arc → the curve reads
     *     as displaced from the true path, not merely textured.
     * `samples` in the 30-50 range is a reasonable middle ground; for a curve
     * that already animates on its own (morphing parameters, not just this
     * jitter), also pass `{roughness: 0.5-0.7, boil: false}` — boiling
     * re-jitters on a timer independently of the real motion, which reads as
     * the curve jumping rather than a hand-drawn wobble riding along with it.
     *
     * @param {(x:number)=>number|null} fn
     * @param {object} o { from, to, samples=36, toX, toY, ...style }
     */
    plot(fn, o = {}) {
      const from = o.from ?? 0;
      const to = o.to ?? 1;
      const samples = o.samples ?? 36;
      const toX = o.toX || ((v) => v);
      const toY = o.toY || ((v) => v);

      // A gap in the domain splits the plot into separately drawn segments,
      // but a plot() call must consume exactly one seed slot no matter how
      // many segments it produces — otherwise an animated curve whose branch
      // count changes would shift the wobble of everything drawn after it.
      const seed = this._seedFor(o);
      const callIndexAfterSeed = this._callIndex;
      const style = { ...o, seed };

      let segment = [];
      const flush = () => {
        if (segment.length >= 2) this.curve(segment, style);
        segment = [];
      };
      for (let i = 0; i <= samples; i++) {
        const x = from + ((to - from) * i) / samples;
        const y = fn(x);
        if (y == null || Number.isNaN(y) || !Number.isFinite(y)) {
          flush();
        } else {
          segment.push([toX(x), toY(y)]);
        }
      }
      flush();
      this._callIndex = callIndexAfterSeed;
      return this;
    }

    /**
     * Parametric curve t → [x, y] in math space.
     * sk.parametric(t => [Math.cos(t), Math.sin(t)], { from: 0, to: 2*Math.PI, toX, toY })
     */
    parametric(fn, o = {}) {
      const from = o.from ?? 0;
      const to = o.to ?? 1;
      const samples = o.samples ?? 36; // see plot() — too few is as wrong as too many, not just "smoother"
      const toX = o.toX || ((v) => v);
      const toY = o.toY || ((v) => v);
      const pts = [];
      for (let i = 0; i <= samples; i++) {
        const p = fn(from + ((to - from) * i) / samples);
        if (p) pts.push([toX(p[0]), toY(p[1])]);
      }
      return this.curve(pts, o);
    }

    /**
     * Hand-drawn coordinate axes with arrowheads and optional integer labels.
     * Everything is pencil-gray and non-boiling by default (a person draws
     * axes once, then draws the "content" on top).
     *
     * @param {object} o
     *   originX, originY  px position of the origin
     *   step              px per math unit
     *   labels            draw integer labels (default true)
     *   arrows            arrowheads on axis ends (default true)
     */
    axes(o = {}) {
      const w = this.width;
      const h = this.height;
      const ox = o.originX ?? w / 2;
      const oy = o.originY ?? h / 2;
      const step = o.step ?? 50;
      const style = { ink: o.ink ?? 'pencil', width: o.width ?? 1.5, boil: false, ...o.style };

      if (o.arrows === false) {
        this.line(0, oy, w, oy, style);
        this.line(ox, 0, ox, h, style);
      } else {
        this.arrow(0 + 6, oy, w - 6, oy, style);
        this.arrow(ox, h - 6, ox, 0 + 6, style);
      }

      if (o.labels !== false) {
        const labelStyle = { ink: 'pencilLight', size: o.labelSize ?? 15, boil: false };
        const every = o.labelEvery ?? 1;
        for (let x = Math.ceil(-ox / step); x * step + ox < w; x++) {
          if (x === 0 || x % every !== 0) continue;
          this.text(String(x), ox + x * step - 4, oy + 18, labelStyle);
        }
        for (let y = Math.ceil((oy - h) / step); y * step < oy; y++) {
          if (y === 0 || y % every !== 0) continue;
          this.text(String(y), ox + 8, oy - y * step + 5, labelStyle);
        }
      }
      return this;
    }

    /**
     * Faint pencil grid aligned to the axes (drawn with plain straight lines —
     * grid paper is printed, not sketched; use rough:true to hand-draw it).
     */
    grid(o = {}) {
      const w = this.width;
      const h = this.height;
      const ox = o.originX ?? w / 2;
      const oy = o.originY ?? h / 2;
      const step = o.step ?? 50;

      if (o.rough) {
        const style = { ink: o.ink ?? 'pencilLight', width: o.width ?? 0.7, boil: false };
        for (let x = ox % step; x < w; x += step) this.line(x, 0, x, h, style);
        for (let y = oy % step; y < h; y += step) this.line(0, y, w, y, style);
        return this;
      }
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = inkColor(o.ink, theme.paper.ruleFaint);
      ctx.lineWidth = o.width ?? 1;
      ctx.beginPath();
      for (let x = ox % step; x < w; x += step) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = oy % step; y < h; y += step) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();
      ctx.restore();
      return this;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  const Sketch = {
    /** Attach the sketch renderer to a canvas. */
    attach(canvas, opts) {
      return new SketchContext(canvas, opts);
    },

    theme,

    /**
     * Optional helper: size a canvas to its CSS box × devicePixelRatio and
     * scale the context accordingly. Call on init and on resize.
     */
    fit(canvas) {
      const dpr = global.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').scale(dpr, dpr);
      }
      return { width: rect.width, height: rect.height, dpr };
    },
  };

  global.Sketch = Sketch;
})(typeof window !== 'undefined' ? window : globalThis);
