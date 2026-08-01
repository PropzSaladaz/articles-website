---
status: "draft"
date: "2026-08-01"
summary: "Learn the deterministic, continuous noise fields that terrain generators use as their raw material."
---

# Noise Primitives

A noise primitive is a deterministic function that turns a coordinate into a smoothly varying value. It should be useful before we decide whether the value means height, temperature, density, or any other terrain attribute.

Start by understanding the properties a spatial signal needs, then derive a 2D Perlin implementation. Later primitive articles can add value noise, simplex-style noise, cellular fields, and periodic variants without changing the terrain pipeline built above them.

## Reading order

1. **Noise as a Spatial Signal** — determinism, continuity, sampling scale, and the distinction between a field and its terrain interpretation.
2. **Perlin Noise** — lattice gradients, dot products, fade curves, and smooth interpolation.
