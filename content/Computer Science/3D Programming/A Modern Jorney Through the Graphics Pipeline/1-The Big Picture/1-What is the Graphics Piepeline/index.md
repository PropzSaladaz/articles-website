---
status: "draft"          # draft | published | archived
summary: "A pragmatic route to 3–10× faster pipelines using caching and graph-aware jobs."
---

# The Pipeline, in one sentence

The graphics pipeline is a staged factory that **turns 3D scene descriptions** (meshes, materials, lights, camera) **into 2D images**, by transforming **vertices**, forming **primitives**, rasterizing them into **fragments** (potential pixels), shading those fragments, and merging the results into the **framebuffer** for display.

It basically converts 3D objects into a 2D image.

# 1. What the Piepline Is (and Isn't)

## What It Is

The graphics pipeline, in its standard modern form, is the hardware rasterization path implemented by virtually all modern graphics APIs - Direct3D, OpenGL, Vulkan, Metal, and WebGPU (don't worry about them - see them as just examples).
Its purpose is to **convert 3D geometry (triangles) into 2D pixels** on your display, handling everything from vertex transformations to per-pixel shading and blending.

At its simplest, you can think of it as a **flow of work from the CPU to the GPU**:

1. **CPU (Application)** – The CPU side of your program orchestrates the scene. It builds vertex buffers (memory holding vertex data, such as position, color, and so on), uploads textures, configures the pipeline state (which shaders to use, how blending works, etc.), and records rendering commands.

2. **Driver Stack** – The commands are processed by the user-mode driver (UMD) and kernel-mode driver (KMD) (We will cover these later on in more depth).
   - **UMD** validates resources and translates API calls into GPU-understandable command buffers.
   - **KMD** manages memory residency, synchronization, and submission of work to the GPU.

3. **GPU Execution** – The GPU consumes these command buffers. It begins at the front-end, pulling work from queues and feeding data into programmable stages:

    1. Vertex Processing (vertex shaders, tessellation, geometry)
    2. Rasterization (turning triangles into fragments)
    3. Fragment/Pixel Shading (computing the color of each pixel)
    4. Output Merging (writing final colors, applying blending and depth tests)

4. **Display Output** – Once the image is complete, it’s presented to the display, where scanout hardware reads pixels from the framebuffer and drives the monitor.

This is the core rasterization pipeline—the path responsible for drawing almost every image in games, simulations, and interactive 3D applications today.

I know there is a lot of new words thrown around, but this introductory article's goal is exactly that - throw a bunch of new information at you, so that you are at least slightly aware of them when you encounter them a second time later on.

Don't worry - everything in here will be explained in much more detail in later articles.


## What It Isn't

It’s **not a law of physics** or a fixed sequence dictated by nature—**it’s a convention**, a highly optimized system built over decades of GPU evolution. The output of hundreds of brilliant minds put together.

Many modern engines depart from or augment this classical pipeline:
    - Software rasterization in compute shaders (e.g., deferred decals or occlusion prepasses).
    - Hybrid ray tracing, where parts of the image (reflections, shadows) bypass rasterization and are computed via ray traversal.
    - GPU-driven pipelines, where the CPU is minimally involved, and most scene culling and draw submission happen on the GPU.

So while the “triangles → pixels” path is the **default** and still the backbone of real-time rendering, it’s increasingly surrounded by programmable, flexible alternatives. The hardware raster pipeline remains dominant because it’s hardware-accelerated, massively parallel, and deeply integrated into the display ecosystem.


## Analogy: The Factory Model

Imagine a large automated factory:

- **CPU = The Planning Office**

    It organizes the production schedule: what products to build (meshes), what materials to use (textures), and how to decorate them (shaders). It issues work orders to the rest of the system.

- **Drivers = Logistics & Dispatch**
    
    The logistics department translates plans into actionable tasks, ensuring materials are available, instructions are clear, and equipment (GPU memory) is ready.

- **GPU Front-End = Intake Dock**

    The GPU’s command processor reads job tickets (command buffers) and sets the machines in motion, feeding data into the production line.


- **Vertex Stage = Cutting & Shaping Department**

    Raw materials (vertices) are shaped into meaningful components—transformed from local to world and screen coordinates.

- **Assembly/Clipping/Divide = Quality & Fit Check**

    Workers make sure each piece fits within the bounds of the final product. Out-of-frame geometry is discarded, and parts are adjusted to fit within the viewport.

- **Rasterizer = Assembly Line**

    Triangles are disassembled into smaller components—fragments—each representing a pixel-sized piece to be painted and polished.

- **Fragment Shader = Paint Booth**
    
    Each fragment is colored, shaded, and textured, simulating how light interacts with materials.

- **Output-Merger = Quality Control & Packaging**

    Finished pixels are compared against existing ones for visibility (depth testing), combined if necessary (blending), and finalized into the framebuffer.

- **Post-Processing = Marketing Department**

    Effects like bloom, motion blur, or tone mapping polish the image—making it more cinematic and appealing.

- **Presentation = Shipping**

    The completed image is handed off to the display hardware, which delivers it to the viewer.


> Add diagram
> CPU → UMD → KMD → GPU Front-End → Vertex Stage → 
Assembly / Clip / Divide → Viewport → Rasterizer → 
Fragment Stage → Output-Merger → Post → Present
