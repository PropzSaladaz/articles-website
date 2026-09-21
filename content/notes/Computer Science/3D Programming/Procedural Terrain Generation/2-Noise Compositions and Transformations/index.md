---
status: "draft"
date: "2026-08-01"
summary: "Stack and shape base noise fields with fBm, billow, and ridged transformations to create more useful terrain signals."
---

# Noise Compositions and Transformations

One Perlin octave has one characteristic feature size. Terrain needs a hierarchy of features: a broad landform, medium-scale slopes, and small local variation. This collection builds that hierarchy, then applies simple shaping passes that change the character of the same underlying field.

## Reading order

1. **Fractal Brownian Motion** — add several frequencies of a base primitive with decreasing amplitudes.
2. **Billow Noise** — fold a signal around zero to produce soft, puffy bands and rounded masses.
3. **Ridged Noise** — invert that folded distance to emphasize narrow crests and mountain-like features.

These are deliberately composable operations. In later terrain work, a generator may use an fBm field for continents, a ridged field for mountain masks, and a billow field for cloud-like or plateau variation.
