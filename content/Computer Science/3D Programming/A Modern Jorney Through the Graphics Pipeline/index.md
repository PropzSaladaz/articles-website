---
status: "draft"          # draft | published | archived
summary: "A pragmatic route to 3–10× faster pipelines using caching and graph-aware jobs."
coverImage: "./images/cover.png"
---

# What's in it for me?

This mega-collection contains all information I came across when studying and learning 3D Programming, and how everything works.
You can find lots of articles and their summaries across this collection.

It is still under development, so if you find any mistake, please leave a comment pointing it out!


A Modern Journey Through the Graphics Pipeline
==============================================

Part I — The Big Picture
------------------------
1. Introduction: What Is the Graphics Pipeline?
   - From triangles to pixels.
   - Evolution: fixed-function → programmable → unified pipeline.
   - Overview diagram: CPU ↔ GPU ↔ Display.
   - Hardware insight: The pipeline exists to maximize parallelism — GPUs process thousands of primitives simultaneously to hide latency.

2. Hardware & APIs in Context
   - GPU architecture (front-end, shader cores, memory hierarchy).
   - Driver stack: KMD/UMD, runtime, shaders, queues.
   - The modern API landscape: OpenGL, Vulkan, Direct3D, Metal, WebGPU.
   - Hardware insight: GPUs are bandwidth-first, latency-second machines. Explicit APIs like Vulkan exist to give developers direct control over this bottleneck.

3. Coordinate Systems & Transform Hierarchies
   - Object, world, view, clip, NDC, screen space.
   - Homogeneous coordinates & matrix stacks.
   - Diagram: the transformation ladder.
   - Hardware insight: Transformations happen in vectorized pipelines that map cleanly to SIMD units in shader cores.

------------------------------------------------------------

Part II — The Geometry Pipeline
-------------------------------
4. Vertex Fetch & Input Assembly
   - Vertex buffers, attributes, layouts, instancing.
   - How the GPU fetches and caches vertex data.
   - Hardware insight: Data locality matters. Interleaved vertex layouts often improve cache coherence.

5. Vertex Shading
   - Programmable vertex processing.
   - Transformations, normals, skinning.
   - Example GLSL/HLSL snippets.
   - Hardware insight: Vertex shaders run in parallel, but vary widely in execution cost. Avoid divergent code paths.

6. Tessellation & Geometry Expansion
   - Tessellation control/evaluation shaders.
   - Patches, subdivision, displacement mapping.
   - Optional: tessellation in compute (modern technique).
   - Hardware insight: Tessellation amplifies geometry — powerful but bandwidth-hungry. GPUs schedule it carefully to avoid overdraw.

7. Geometry Shader & Mesh Shaders
   - Classic geometry shaders (and why they fell out of favor).
   - Mesh/task shaders: a 2020s approach to geometry generation.
   - Diagram: pipeline before and after mesh shading.
   - Hardware insight: Geometry shaders break batching; mesh shaders restore it by letting threads generate geometry cooperatively.

8. Clipping, Culling, and Primitive Assembly
   - Backface culling, frustum clipping, and guard bands.
   - How triangles become screen-space fragments.
   - Hardware insight: Early culling reduces bandwidth use — GPUs always try to reject invisible work as early as possible.

------------------------------------------------------------

Part III — The Rasterization Pipeline
-------------------------------------
9. Rasterization & Interpolation
   - Triangle setup and edge functions.
   - Perspective-correct interpolation math.
   - Multisampling (MSAA) overview.
   - Hardware insight: Rasterization is still largely fixed-function for performance reasons. It’s one of the most optimized blocks in silicon.

10. Fragment Shading
    - The programmable fragment stage.
    - Lighting models (Phong, Blinn, PBR intro).
    - Texturing and normal mapping.
    - GPU optimizations: derivative calculations, texture caches.
    - Hardware insight: GPUs hide texture latency by running other warps. Texture cache coherence is vital for performance.

11. Depth, Stencil, and Blending
    - Z-buffering, stencil operations.
    - Early-Z, late-Z optimizations.
    - Color blending equations and transparency issues.
    - Hardware insight: Early-Z tests prevent wasted shading. Blending, however, is bandwidth-bound and limits parallelization.

------------------------------------------------------------

Part IV — Beyond the Fixed Path
-------------------------------
12. Compute Shaders and GPGPU
    - How compute fits in or replaces parts of the pipeline.
    - Tile-based vs. immediate rendering.
    - Example: GPU-based culling or particle update.
    - Hardware insight: Compute shaders expose the raw GPU — no fixed-function shortcuts, but total freedom and responsibility.

13. Post-Processing & Frame Composition
    - HDR, tone mapping, bloom, motion blur, DOF.
    - Full-screen passes & render targets.
    - Temporal techniques and reconstruction.
    - Hardware insight: Bandwidth is king — post-processing is often limited by texture fetch/write bandwidth, not ALU work.

14. Presentation & Synchronization
    - Swapchains, vsync, triple buffering.
    - Frame pacing, stutter, tearing.
    - The journey from framebuffer → display scanout.
    - Hardware insight: The display engine operates asynchronously — stutters come from sync mismatches between GPU completion and display refresh.

------------------------------------------------------------

Part V — The Modern Era
-----------------------
15. Vulkan / D3D12 / Metal: The Explicit Age
    - Command buffers, synchronization, memory management.
    - Render passes, descriptor sets, and barriers.
    - Pipeline objects and shader reflection.
    - Hardware insight: Modern APIs expose what drivers used to hide — you manage synchronization, batching, and memory manually for maximum efficiency.

16. GPU Architecture Deep Dive
    - SMs / CUs, wavefronts, warps, SIMD vs SIMT.
    - Scheduler, caches, register pressure.
    - Performance metrics (occupancy, bandwidth, latency).
    - Hardware insight: The GPU is a latency-hiding machine — performance is about keeping thousands of threads busy, not making one go fast.

17. Ray Tracing Pipelines
    - BVHs, traversal, intersection shaders.
    - Hybrid rendering: raster + ray tracing.
    - DXR, Vulkan RT, and RTX hardware.
    - Hardware insight: Ray tracing relies on specialized acceleration structures and hardware RT cores for traversal and intersection tests.

18. Future of Graphics Pipelines
    - Path tracing in real time.
    - Neural rendering & differentiable graphics.
    - The convergence of graphics and compute.
    - Hardware insight: The GPU is slowly becoming a general-purpose parallel machine optimized for both graphics and AI.

------------------------------------------------------------

Appendices
----------
A. Glossary of GPU Terms
B. Common Pitfalls & Debugging
C. Comparison Tables (OpenGL vs Vulkan vs D3D12)
D. Suggested Reading and Papers

------------------------------------------------------------

Conceptual vs. Hardware vs. Practical Layers
--------------------------------------------
Your articles should run on three intertwined tracks:

1. Conceptual Layer (the "clean" view)
   - The mathematical, API-level understanding.
   - What each stage conceptually does: e.g., vertex shading transforms geometry.

2. Hardware Layer (the “messy” view)
   - How GPUs make it fast.
   - Topics: throughput vs latency, bandwidth bottlenecks, warp scheduling, batching, cache behavior, etc.
   - Example insights:
     * GPUs are throughput machines, not low-latency ones.
     * Bandwidth dominates performance.
     * Batching draw calls and minimizing state changes is crucial.

3. Practical Layer (the “developer’s view”)
   - How to design renderers around constraints.
   - Instancing, indirect draws, explicit synchronization, profiling tools.

Structure example for each section:
> Concept → Hardware Insight → Practical Takeaway

Example:
> Fragment Shading — lighting models, texture sampling, and how GPUs hide texture latency through warp scheduling.

That rhythm — concept → hardware → practice — keeps the reader grounded and makes the series both educational and directly useful.
