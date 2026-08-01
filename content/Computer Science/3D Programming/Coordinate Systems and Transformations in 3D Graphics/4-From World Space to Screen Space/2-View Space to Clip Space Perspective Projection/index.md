---
status: "draft"
date: "2026-07-19"
summary: "Derive how a camera frustum becomes homogeneous clip coordinates, including field of view, aspect ratio, near and far planes, and the role of w in perspective projection."
---

# View Space → Clip Space: Perspective Projection

View space tells us where geometry is relative to the camera. Projection answers a different question: how can that camera-relative 3D arrangement be represented so that a finite viewing frustum can become a canonical volume suitable for the GPU?

$$
p_{clip} = Pp_{view}
$$

The output is **not NDC**. It is a four-component homogeneous clip position, whose $w$ component is essential for clipping and for the later perspective divide.

## Stage Contract

| Stage | Input | Output | Purpose |
|---|---|---|---|
| Perspective projection | $p_{view}$ | $p_{clip}$ | Encode the view frustum, preserving the information needed for perspective and clipping. |

## Planned Sections

1. The pinhole-camera intuition and similar triangles.
2. Field of view, aspect ratio, and the near/far planes as a viewing frustum.
3. Deriving the projected X and Y coordinates.
4. Why clip-space $w$ is related to view-space depth.
5. Deriving a perspective projection matrix under this series' convention.
6. The role of near and far planes in depth precision, with reversed-Z as an advanced note.
7. Orthographic projection as a useful contrast.
8. Projection-matrix debugging: wrong aspect, incorrect FOV units, swapped near/far planes, and API depth-range mismatches.

The next chapter uses these homogeneous clip positions to decide what portions of each primitive can reach the screen.
