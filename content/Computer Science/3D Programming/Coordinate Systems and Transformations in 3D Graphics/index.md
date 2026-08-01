---
status: "published"
date: "2025-12-15"
summary: "A practical route through the coordinate transformations that take a world-space vertex to its final screen position."
---

# Coordinate Systems and Transformations in 3D Graphics

This collection builds the language and mathematics used to move geometry through a renderer. It begins with object and world transforms, then follows a world-space vertex through the camera, projection, clipping, normalized-device-coordinate, and viewport stages.

## The Main Transformation Journey

The core sequence starts with a position already expressed in world space:

$$
p_{world}
\xrightarrow{V}
p_{view}
\xrightarrow{P}
p_{clip}
\xrightarrow{\text{clip}}
\text{clipped primitive}
\xrightarrow{/w}
p_{ndc}
\xrightarrow{\text{viewport}}
p_{window}
$$

Projection creates **clip coordinates**; clipping happens in that homogeneous space; and the perspective divide creates **normalized device coordinates (NDC)**. Keeping those operations separate is the key to understanding the rest of the rasterization pipeline.

## Reading Order

1. **Coordinate Spaces and Hierarchies** — local and world space, parent-child transforms, and the idea that coordinates are meaningful only relative to a frame.
2. **Transformation Matrices, Homogeneous Coordinates, and Composition** — the matrix tools behind affine transforms and transform chains.
3. **Rotation Representations: Euler Angles and Quaternions** — how orientations can be stored and manipulated.
4. **From World Space to Screen Space** — the focused camera-to-rasterizer journey:
   1. World Space → View Space: The Camera Transform
   2. View Space → Clip Space: Perspective Projection
   3. Clip Space and Homogeneous Clipping
   4. Clip Space → NDC: The Perspective Divide
   5. NDC → Window Space: The Viewport Transform
   6. Putting It Together: The Complete Vertex Journey

The world-to-screen collection deliberately treats model-to-world placement as already solved. Object transforms and scene hierarchies remain important, but they should not interrupt the more subtle camera and projection story.
