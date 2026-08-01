---
status: "draft"
date: "2026-07-19"
summary: "A high-level guide to the coordinate-space journey that turns a 3D world-space vertex into a location in a render target."
---

# From World Space to Screen Space

A 3D scene is not immediately an image. It is a collection of positions, directions, triangles, cameras, lights, and materials described in three dimensions. A monitor, on the other hand, can show only a rectangular grid of two-dimensional pixels.

The renderer must therefore answer a chain of questions for every visible triangle:

* Where is this vertex relative to the camera?
* How should that camera's 3D view be projected onto a flat image?
* Which parts of the triangle lie outside the camera's visible region?
* Where does the surviving geometry belong in the render target?

This series follows that journey. Each chapter explains one conversion and the reason it exists before introducing its mathematics in detail.

> [!IMPORTANT]
> A mesh is commonly stored in its own **model space**. After its model transform places it in the scene, its vertices are in **world space**. This series begins there: with a vertex whose location is already known in the shared world.

## The Journey at a Glance

### 1. World Space → View Space

World space is the shared coordinate system of the scene. The view transform re-expresses every vertex relative to the camera: the camera becomes the origin, and its orientation becomes the reference for “right,” “up,” and “forward.”

This is necessary because a renderer cannot decide what the camera sees from a world-space position alone. It needs to know where that position is **from the camera's point of view**.

### 2. View Space → Clip Space

The camera sees a pyramid-like region called a **view frustum**. Perspective projection turns that camera-relative volume into a standard representation that encodes the camera's field of view, aspect ratio, and near and far limits.

This is the stage that prepares distant geometry to appear smaller than nearby geometry.

### 3. Clip Space → Clipped Primitives

Some triangles lie completely outside the view; others cross its boundary. The renderer discards invisible primitives and trims triangles that are only partly visible.

This must happen before the perspective effect is finalized, otherwise geometry crossing the camera boundary can be distorted or disappear incorrectly.

### 4. Clip Space → Normalized Device Coordinates

The renderer then converts the surviving positions into a standard, normalized region. At this point, every visible position is described in a device-independent coordinate system rather than in camera units.

This common representation lets the rest of the graphics pipeline work consistently regardless of the scene's size or the target resolution.

### 5. Normalized Device Coordinates → Window Space

Finally, the viewport transform maps the normalized result onto a specific rectangle of the render target: its pixel width, height, origin, and depth-buffer range.

Only after this step can rasterization determine which pixel-sized fragments a triangle covers.

> [!TIP]
> Keep asking one question as you read: **“Relative to which coordinate system is this value written?”** Most transformation bugs become much easier to diagnose once every position is labeled by its space.

## Why These Stages Are Separate

It may seem tempting to map a world-space vertex directly to a pixel. Separating the work makes each stage solve one clean problem:

| Stage | The problem it solves |
|---|---|
| World → View | What does the scene look like from this camera? |
| View → Clip | What is inside this camera's perspective frustum? |
| Clip | Which pieces of each triangle are actually visible? |
| Clip → NDC | How do we express the surviving geometry in a standard normalized region? |
| NDC → Window | Which location in this render target does that normalized position correspond to? |

That separation is also practical: the GPU can apply the same well-defined operations to millions of vertices and triangles in parallel.

## Chapters

1. **World Space → View Space: The Camera Transform**
   - Build a camera frame and derive the **lookAt** view matrix that expresses world-space vertices relative to it.

2. **View Space → Clip Space: Perspective Projection**
   - Derive the perspective projection that turns the camera frustum into clip coordinates.

3. **Clip Space and Homogeneous Clipping**
   - See how the GPU rejects and trims primitives that cross the visible region.

4. **Clip Space → NDC: The Perspective Divide**
   - Understand the normalization step that produces perspective foreshortening and depth values.

5. **NDC → Window Space: The Viewport Transform**
   - Map normalized positions into pixels and depth-buffer values.

6. **Putting It Together: The Complete Vertex Journey**
   - Trace a vertex through all stages and connect the math to a vertex shader.

The next chapter begins with the first—and most important—change of viewpoint: turning a world into what one camera sees.
