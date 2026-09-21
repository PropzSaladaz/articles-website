---
status: "draft"
date: "2026-07-19"
summary: "Map normalized device coordinates into viewport pixels and depth-buffer values, and distinguish window coordinates from fragments and final displayed pixels."
---

# NDC → Window Space: The Viewport Transform

NDC describes a canonical normalized volume. The viewport transform gives it a concrete destination: a rectangular region of a render target with a particular pixel width, height, origin, and depth range.

## Stage Contract

| Stage | Input | Output | Purpose |
|---|---|---|---|
| Viewport transform | $p_{ndc}$ | Window-space coordinates | Scale and translate normalized coordinates into the active render-target region. |

## Planned Sections

1. Mapping NDC X and Y into viewport pixel coordinates.
2. Mapping NDC depth into the configured depth-buffer range.
3. Viewport origin, dimensions, and Y-axis conventions across APIs.
4. Window space, framebuffer space, screen space, and high-DPI displays.
5. Viewport versus scissor rectangle.
6. Where rasterization begins: from transformed triangle to fragments.
7. Debugging: flipped output, stretched output, incorrect viewport size, and depth-range mistakes.

This completes the coordinate-transform sequence. The final chapter reconnects every stage in one worked vertex journey.
