---
status: "draft"
date: "2026-08-01"
summary: "Fold a base noise field around zero to create the rounded, puffy structure known as billow noise."
---

# Billow Noise

Billow noise is a simple transformation of a centered base field. If $N(\mathbf{p})$ is approximately in $[-1,1]$, define:

$$
B(\mathbf{p}) = 2\lvert N(\mathbf{p}) \rvert - 1
$$

Taking the absolute value folds the negative half of the signal upward. Valleys and peaks from the base noise become similar rounded lobes, and the result remains centered near zero after the final remapping.

## Why the fold changes the terrain character

Ordinary Perlin noise crosses zero smoothly. Billow noise treats both sides of that crossing as positive distance from zero, so each crossing becomes a trough between two rising shapes. With several octaves, this tends to produce soft, puffy masses rather than directional ridges.

For a billow-style fBm, apply the fold at each octave before adding it to the sum:

$$
B_{fbm}(\mathbf{p}) = \sum_{k=0}^{m-1} a_k\left(2\lvert N(f_k\mathbf{p}) \rvert - 1\right)
$$

Normalize the amplitude sum just as you would for ordinary fBm.

## Interactive field explorer

Use the same seed and scale as the fBm mode, then switch to billow. The field is based on the same Perlin samples; only the post-processing operation has changed.

<iframe src="../../simulations/noise-field-explorer.html?mode=billow" width="100%" height="740px"></iframe>

> [!TIP]
> Billow is useful as a component, not necessarily as a complete terrain by itself. Blend it with a low-frequency landform field or use it as a mask when you want broad, rounded variation.
