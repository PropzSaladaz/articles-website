---
status: "draft"
date: "2026-08-01"
summary: "Interpret composed noise fields as terrain: start with heightmaps, then add thresholds, materials, and richer density functions."
---

# Terrain Synthesis

Terrain synthesis gives the noise stack a role in a world. It chooses coordinate scales, remapping curves, material thresholds, and the combination rules between several fields.

The first article keeps that interpretation deliberately simple: map a 2D fBm field to elevation, choose a sea level, and classify the resulting height into materials. Subsequent articles can add multiple fields, biome masks, domain warping, and density-based terrain without changing the underlying noise articles.

## Reading order

1. **From Noise to Heightmaps** — turn a field into elevation and a first-pass terrain material policy.
