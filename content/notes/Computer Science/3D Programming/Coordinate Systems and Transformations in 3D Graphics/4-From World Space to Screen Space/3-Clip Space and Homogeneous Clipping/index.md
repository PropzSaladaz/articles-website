---
status: "draft"
date: "2026-07-19"
summary: "Understand the homogeneous clip volume, why triangles are clipped before the perspective divide, and how clipping can create new vertices at a frustum boundary."
---

# Clip Space and Homogeneous Clipping

Clip space is the staging area between projection and NDC. The GPU tests primitives against a canonical homogeneous volume here, rejecting invisible geometry and splitting triangles that cross a frustum plane.

Clipping is not another matrix transform. It is an operation on a primitive whose vertices are already in clip space.

## Stage Contract

| Stage | Input | Output | Purpose |
|---|---|---|---|
| Homogeneous clipping | A primitive with clip-space vertices | Zero or more clipped clip-space primitives | Ensure that only the visible portion of each primitive proceeds to the perspective divide. |

## Planned Sections

1. The canonical clip-volume inequalities in homogeneous coordinates.
2. The six frustum planes and what “inside” means before dividing by $w$.
3. Why clipping after the perspective divide produces incorrect results.
4. How a triangle crossing a plane is split and how intersection vertices are generated.
5. The difference between per-primitive clipping and coarse frustum culling.
6. Guard bands and why hardware may postpone clipping in some cases.
7. Debugging: disappearing triangles, near-plane artifacts, and vertices behind the camera.

The surviving clip coordinates pass unchanged into the perspective divide.
