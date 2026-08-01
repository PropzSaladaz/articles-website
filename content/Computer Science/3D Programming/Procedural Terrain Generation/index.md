---
status: "draft"
date: "2026-08-01"
summary: "A 3D terrain-generation path: build coherent noise fields, shape and combine them, then turn them into controllable terrain."
---

# Procedural Terrain Generation

This collection is about generating terrain from deterministic spatial fields. It is intentionally independent from a voxel renderer: the same terrain signal can drive a mesh heightmap, a displacement map, a signed density field, or an offline world-building tool.

The path is built around a useful boundary:

$$
\text{primitive field}
\longrightarrow
\text{shaping and composition}
\longrightarrow
\text{terrain interpretation}
$$

A Perlin sample is just a value at a coordinate. Fractal Brownian motion, billow, and ridged variants change the character of that value. Only the final interpretation decides whether it represents elevation, moisture, rock, snow, or something else.

## Reading order

1. **Noise Primitives** — understand a seeded continuous field and construct 2D Perlin noise.
2. **Noise Compositions and Transformations** — stack octaves with fBm, then shape the signal into billowy masses or ridged features.
3. **Terrain Synthesis** — map the resulting fields into a heightmap and material policy.

Future sections can build on this foundation with domain warping, multi-field biome selection, erosion-inspired passes, and volumetric terrain density functions.
