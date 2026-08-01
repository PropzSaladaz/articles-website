---
status: "draft"
date: "2026-07-31"
summary: "Build a terrain heightmap from fractal Brownian motion and see how scale, octaves, persistence, lacunarity, and sea level affect the result."
---

# From Noise to Heightmaps

A heightmap is one of the simplest useful world representations: every horizontal coordinate $(x,z)$ maps to one elevation $h$.

$$
h : (x,z) \mapsto y
$$

It is deliberately simpler than a full volumetric density field. That makes it a good first practical target: we can see the signal directly, inspect its parameters, and understand which parts belong to noise and which parts belong to terrain policy.

## 1. Sample in world coordinates

The generator should evaluate noise at world coordinates, not at coordinates local to the current screen or chunk. For a base feature length $L$:

$$
u = \frac{x}{L}, \qquad v = \frac{z}{L}
$$

Sampling the same world position again—perhaps after unloading and reloading a chunk—must return the same value. That is the combination of a stable seed and a stable coordinate mapping.

The feature length controls horizontal scale. Increasing it spreads the same broad pattern over more world units; it does not directly increase the elevation range.

## 2. Turn fBm into elevation

The simulation uses normalized fractal Brownian motion as its signal, then maps it into a height value:

$$
e(x,z) = \operatorname{clamp}\left(\frac{F(x/L,z/L)+1}{2},0,1\right)
$$

$$
h(x,z) = h_{min} + e(x,z)(h_{max}-h_{min})
$$

The clamping step is a practical guard for a noise implementation whose exact extrema may not be known. In a production generator, you may calibrate the range or use a remapping curve instead.

## 3. Add a terrain policy

Noise does not know what water or grass means. The heightmap becomes a world only after we choose thresholds:

| Elevation | Example material |
|---|---|
| Below sea level | Water |
| Just above sea level | Sand or beach |
| Low and middle elevations | Grass, soil, or forest |
| High elevations | Rock |
| Highest elevations | Snow |

These thresholds are intentionally separate from the noise function. The same field can produce a desert by changing the material policy, or a flatter world by changing the height remapping curve.

## Interactive heightmap

Change one parameter at a time. **Scale** changes the size of the terrain features, while **octaves**, **persistence**, and **lacunarity** change how much detail is layered onto them. The seed changes the field without changing the generation algorithm.

<iframe src="simulations/heightmap.html" width="100%" height="760px"></iframe>

## What comes next

This heightmap has one elevation for each horizontal coordinate, so it cannot create overhangs or caves. A volumetric terrain model replaces the height function with a density function:

$$
D(x,y,z) > 0 \Rightarrow \text{solid}, \qquad D(x,y,z) \leq 0 \Rightarrow \text{empty}
$$

The same noise ideas still apply, but the world policy becomes richer: one field can shape the surface, another can carve caves, and additional fields can choose materials or biome regions.
