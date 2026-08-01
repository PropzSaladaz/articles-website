---
status: "draft"
date: "2026-07-19"
summary: "See how dividing homogeneous clip coordinates by w creates normalized device coordinates, perspective foreshortening, and the non-linear depth values used by the depth buffer."
---

# Clip Space → NDC: The Perspective Divide

Once clipping is complete, the GPU converts homogeneous clip coordinates into ordinary three-dimensional coordinates by dividing by $w$.

$$
p_{ndc} = \frac{p_{clip}.xyz}{p_{clip}.w}
$$

This deceptively small operation is where perspective foreshortening becomes visible: equal world-space distances do not occupy equal screen-space distances when they lie at different depths.

## Stage Contract

| Stage | Input | Output | Purpose |
|---|---|---|---|
| Perspective divide | A clipped position, $p_{clip}=(x_c, y_c, z_c, w_c)$ | Normalized device coordinates, $p_{ndc}$ | Convert the homogeneous clip volume into the canonical normalized volume used by the rasterizer. |

## Planned Sections

1. The divide itself: $x_c/w_c$, $y_c/w_c$, and $z_c/w_c$.
2. How this creates the visual effect of perspective.
3. The NDC cube and the chosen depth range.
4. Why NDC depth is non-linear and how that affects depth-buffer precision.
5. How clip-space $w$ supports perspective-correct interpolation after this stage.
6. Debugging: missing division, dividing too early, and incorrect depth assumptions.

The next stage maps this normalized volume into a concrete viewport measured in pixels.
