---
status: "draft"
date: "2026-07-19"
summary: "Trace a vertex from world space to a viewport position, connect the view and projection matrices in shader code, and see where model transforms fit into the complete chain."
---

# Putting It Together: The Complete Vertex Journey

This chapter reconnects the individual stages into one continuous calculation. Starting from a world-space point, we apply the view and projection transforms, clip the primitive, divide by $w$, and map the NDC result into a viewport.

$$
p_{clip} = PVp_{world}
$$

If the point begins in model space, the familiar complete form is:

$$
p_{clip} = PVMp_{model}
$$

## Planned Sections

1. One scene, one camera, and one triangle used throughout the calculation.
2. A numerical trace of a vertex through world, view, clip, NDC, and window space.
3. Minimal vertex-shader pseudocode and the role of `gl_Position` / position outputs.
4. Where model-to-world transforms fit without re-opening the hierarchy discussion.
5. Which quantities remain per-vertex, per-primitive, or per-fragment.
6. A space-by-space debugging workflow using temporary colors, wireframes, and matrix inspection.
7. A compact comparison of the conventions that change between graphics APIs.

The result is a durable mental model: every coordinate should be labeled by its space, and every matrix should state exactly which space it converts from and to.
