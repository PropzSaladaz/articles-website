---
status: "draft"
summary: "How CPU, GPU, drivers, and APIs cooperate to turn draw calls into pixels."
coverImage: "./images/cover_hardware.png"
---

# The Division of Labor: CPU vs GPU

A real-time renderer operates across **two very different types of processors** working in concert: the **CPU** (Central Processing Unit) and the **GPU** (Graphics Processing Unit).  
Each is optimized for distinct styles of computation, and understanding their division of labor is fundamental to understand how modern rendering works.

---

## 1. Complementary Architectures

| Component | Strength | Execution Model | Typical Tasks |
|------------|-----------|----------------|----------------|
| **CPU (Central Processing Unit)** | Low-latency, flexible control flow | Sequential, branch-heavy, cache-sensitive | Scene management, physics, logic, command recording |
| **GPU (Graphics Processing Unit)** | High-throughput, data-parallel execution | SIMD/SIMT (Single Instruction, Multiple Threads) | Vertex processing, rasterization, shading, post-processing |

### 1.1 CPU — The Brains

The CPU’s architecture is designed for *decision-making*: executing complex, branching code with frequent memory access.

It's like your brain - you make decisions, and tell your muscles what to do.

#### Architectural Role

The CPU is built for **complex, branching logic** and fast reaction to changing conditions:
- **Excellent at sequential, branching code:** excels at sequential code, conditional branches, and control-heavy tasks. This means code with many *“if this, do that; otherwise do something else”* decisions. Games and simulations contain a lot of this.
- **Low-latency execution:** The CPU completes individual operations very quickly. This helps with tasks needing immediate responses.
- **Small number of powerful cores:** Typically 4–16 general-purpose cores, each capable of handling complex instructions.
In contrast, GPUs have thousands of simpler cores.
- **Large and smart caches:** CPUs have their own memory. Really. And it's large - keeps data close by predicting future needs to avoid delays when accessing memory.

#### Role in Rendering or Game Engine

The CPU prepares **what** should be rendered before the GPU executes it.
Its duties revolve around world logic, data preparation, and issuing instructions.

It performs four major catogires of work:

**A. Updating the World State**

Before the GPU can draw a frame, the CPU must decide what the frame represents.

This includes:
- Updating object movement and transformations - (e.g., a character walks forward, a camera rotates, the sun moves)

- Running game logic

- Rules determining what happens next in the world.

- Physics and interactions - For example, detecting that a character has collided with a wall.

This step ensures the next frame reflects the correct state of the virtual world.

**B. Preparing data for the GPU**

The CPU organizes data into structures that the GPU can consume efficiently.

This involves:
- Creating and updating geometry data - Such as vertex buffers (lists of 3D points making up models).

- Providing per-frame values - For example, the position of the camera or the color of a light.

- Transferring needed data to the GPU’s memory - When models or textures load, the CPU helps move them into the GPU’s storage.

This preparation step is similar to a director handing materials and instructions to a production team before filming begins.

**C. Configuring How Rendering Should Happen**

For each set of objects to draw, the CPU selects **which “rules” the GPU should follow**.

Examples include:

- Choosing a shader program - A shader is a small program the GPU runs to compute colors and lighting.

- Choosing rendering settings - Such as whether objects should blend with the background or whether depth comparisons are required.

This configuration defines the *style and method* of rendering for each group of objects.

**D. Recording and Scheduling GPU Commands**

The CPU doesn’t render directly. Instead, it **records commands** describing what the GPU should do, such as:

- “Draw this object using this shader”

- “Run this computation”

- “Copy this data from one place to another”

These commands are written into a **command buffer** (a list of GPU instructions), which is later submitted to the GPU for execution.

This step is the final planning stage — like preparing a full shot list and storyboards before filming.


#### Why the CPU Is Not Designed for High Throughput

The CPU is **not** a machine for doing a massive number of identical calculations.

- It may only run a few dozen operations at once, but each is highly sophisticated.

- It excels at frequent decision-making, not raw numerical volume.

- It switches tasks quickly — useful for coordinating complex work.

If the GPU is a giant factory with thousands of workers assembling parts in parallel, the CPU is the director who plans, decides, coordinates, and gives the orders.

The CPU figures out what needs to happen each frame.
The GPU then takes that plan and performs the heavy computation.

---



### 1.2 GPU - The Muscle

The **GPU (Graphics Processing Unit)** is the machine that **executes the heavy numerical work of rendering**.
Where the CPU specializes in planning and decision-making, the GPU specializes in performing **vast amounts of similar calculations in parallel**.

Following the analogy, if **CPU** is the brain, the **GPU** is the muscle. It receives commands from the brain, and performs the heavy work.


#### Architectural Purpose and Strengths

GPUs are designed to process **large batches of data with the same instructions**.
Instead of having a few powerful cores, a GPU has **hundreds to thousands of small processing units** working together.

Key characteristics:

- **Massive parallelism** - Ideal for workloads where the same operation must be applied to many items (for example, shading millions of pixels).

- **High arithmetic throughput** - GPUs can perform an enormous number of math operations per second, far exceeding CPUs for numerical workloads.

- **Simpler cores, but in large numbers** - Each core is **less flexible** than a CPU core, but combined, they can process huge workloads in parallel.

This structure suits rendering, where many pixels and vertices must be processed in similar ways.

#### Role in the Rendering Pipeline

After the CPU prepares the instructions and data, the GPU executes the rendering for the frame.
Its responsibilities focus on mathematical computation, parallel processing, and image formation.

The GPU’s main work falls into three categories:

**A. Running Shader Programs in Parallel**

A shader is a small program executed on the GPU to compute visual results (such as color, lighting, or geometry).
The GPU runs thousands of copies of the same shader program at once, each handling different data.

Examples:

- A vertex shader runs once per vertex, adjusting its position on screen.

- A fragment shader runs once per potential pixel, computing its final color.

- A compute shader runs general-purpose parallel tasks (e.g., particle simulation or image processing).

This is where the GPU excels: applying the same logic to large amounts of data simultaneously.

**B. Dedicated Hardware Built for Rendering Tasks**

In addition to running programmable shaders, GPUs contain special-purpose hardware units designed for tasks common in graphics:

- **Rasterizer** - Converts triangles into the pixels that need to be drawn.

- **Texture units** - Efficiently read image data (textures) and filter them for sampling.

- **Depth and stencil units** - Quickly determine which surfaces are visible and should appear in the final image.

**C. Executing Commands Submitted by the CPU**

The GPU receives **command buffers** from the CPU that describe what to draw and how to draw it.

Once execution begins, the GPU:

- Processes the geometry

- Shades pixels

- Writes results into color buffers (images) ready for display

The GPU works through the commands with minimal branching or deviation.

---

## 2. The Command Path: From CPU to GPU

Rendering a frame is not a single action; it is a **pipeline of instructions flowing from the CPU to the GPU**.
A key concept to understand early is this: when your application issues a draw call, the **GPU does not execute it immediately**.
Instead, the command travels through several layers that prepare, validate, translate, and finally execute the work on the GPU.

This section explains what happens between the moment your code calls a function such as:

```
DrawIndexed(...);
```
…and the moment the GPU actually starts drawing.

### 2.1 Why Commands Need a Path

The CPU and GPU are separate processors with different responsibilities and memory spaces.
They cannot directly execute each other’s instructions, so several steps are required to convert an API call into actual GPU work.

#### Stage 1: CPU-Side Command Recording

**Location:** Your application + graphics API (Direct3D, OpenGL, Vulkan, Metal)

When you call something like `DrawIndexed()`, the **CPU does not execute the draw**.
Instead, it **records the command into a command buffer** — a list of GPU instructions to be executed later.

Key details:

- This recording step is fast and non-blocking.

- No rendering happens here; the CPU continues running and preparing further commands.

- Command buffers allow the CPU to **batch work**, reducing overhead and minimizing frequent GPU interruptions.

This stage is about describing the work, not doing the work.

#### Stage 2: User-Mode Driver (UMD)

**Location:** GPU vendor’s driver running in user space

The User-Mode Driver is responsible for **translating and validating** the commands recorded by the application.

Its role includes:

- Checking that parameters are valid and consistent.

- Translating high-level API state (e.g., “use this shader, with this blend mode”) into the GPU’s native command format.

- Building a proper **command stream** that the GPU understands.

For example, a single API draw call may expand into several low-level GPU commands.

This step exists because GPU vendors implement different hardware.
The UMD converts generic API instructions into vendor-specific instructions.


#### Stage 3: Kernel-Mode Driver (KMD)

**Location:** Operating System driver running in kernel space

Once the UMD prepares the command buffer, it hands it to the **Kernel-Mode Driver**, whose job is to safely manage the hardware.

The KMD is responsible for:

- **Submitting command buffers** to the GPU’s hardware queues.

- **Managing memory residency** — ensuring required data (textures, meshes) is present in GPU memory (VRAM).
If memory is full, the KMD may move data between system RAM and VRAM as needed.

- **Scheduling and preemption** — deciding which application’s commands run, and interrupting work if necessary (e.g., to keep the desktop responsive).

This layer exists for security and stability: only kernel-mode code is allowed to directly control hardware.


> Sidebar: Why Consoles Have Lower Driver Overhead than PCs
>
> On a PC, the Kernel-Mode Driver must follow the operating system’s strict rules for security, memory management, and multi-application fairness. This adds overhead to scheduling, validation, and memory residency.
>
> Consoles (PlayStation, Xbox, Switch) run games on fixed hardware in a closed environment, so they:
>
> Have extremely thin drivers with minimal safety checks.
>
> Allow much more direct access to the GPU.
>
> Remove large parts of the memory-management complexity found on PCs.
>
> Result:
>
> Console APIs are lower-level and closer to the metal.
>
> Less CPU time is spent in driver overhead.
>
> More predictable performance and less variability across devices.
>
> This is one reason the same GPU class can appear “faster” on a console than on a PC: fewer layers sit between the game and the hardware.

#### Stage 4: GPU Front-End

**Location:** GPU hardware

Once commands reach the GPU, they enter the **GPU front-end**, often called the command processor.

The front-end’s job is to:

- Dequeue commands from the GPU’s internal queue.

- Set up the correct GPU state (shaders, textures, buffers, rendering modes).

- Dispatch workloads to:

  - Shader cores for programmable stages

  - Fixed-function units for specialized stages (such as rasterization or depth testing)

At this moment, the commands **finally become real work performed on silicon**.



---


## 3. A Coordination Problem, Not a Hand-Off

A common misconception for beginners is to imagine the CPU “calling” the GPU like a function: the CPU issues a draw, the GPU executes it, and then both continue.
Modern graphics systems do not work like this.

The CPU and GPU are independent processors running in parallel. Their interaction is a coordination and scheduling problem, not a direct call-and-execute relationship. The two communicate through command queues that act as a buffer between work generation (CPU) and work execution (GPU).

This design introduces latency—because work waits in the queue—but it also unlocks far higher throughput and efficiency.

### 3.1 The Producer–Consumer Model

You can view the CPU and GPU as two workers in a pipeline:

- The CPU is the producer of work. It prepares and submits commands.

- The GPU is the consumer of work. It executes the commands.

A command queue exists between them. It stores pending GPU work.

This decoupling means that:

- The CPU can continue preparing future work even if the GPU is still busy.

- The GPU can keep executing commands without constantly waiting for the CPU.

It is similar to a bakery:

- The baker (CPU) prepares dough and lines it up on the table.

- The oven (GPU) bakes at a steady pace.

As long as the baker keeps dough ready and the oven keeps baking, the process stays efficient.

### Why This Decoupling Exists

The CPU and GPU excel at very different workloads:
| CPU Strength    | GPU Strength     |
| --------------- | ---------------- |
| Control, Logic, decisions | High-volume math and parallel processing |

If the CPU waited for the GPU after every draw call, both processors would repeatedly become idle. 

A draw call represents a very small unit of work, so the CPU would finish issuing it quickly and then pause, doing nothing while the GPU processed it. 

Once the GPU completed that tiny task, it would then sit idle waiting for the CPU to send the next one. This stop-and-go pattern prevents either processor from working efficiently, creates constant gaps in execution, and severely limits how much useful work can be completed per frame.

To avoid this, the system allows **asynchronous** execution. Each processor runs continuously on different parts of the frame sequence.

This means that at any given moment:

- The GPU might be rendering frame N.

- The CPU is already preparing commands for frame N+1 or even N+2.

This overlap is one of the biggest reasons modern games can achieve high frame rates.

### 3.3 The Coordination Challenge

Because the processors run independently, neither should become idle.
The coordination problem is maintaining balance:

- If the CPU falls behind, the GPU runs out of commands and becomes idle.

- If the GPU falls behind, the CPU accumulates too many commands, forcing a stall to avoid overflowing buffers.

Both cases reduce performance, but in different ways:

#### A. When the GPU Starves (CPU Too Slow)

This happens when the CPU cannot prepare work fast enough.

Effects:

- The GPU finishes current tasks and has nothing to execute.

- Frame times become inconsistent, appearing as stuttering or hitching.

Typical causes include:

- Heavy game logic or physics calculations

- Too many draw calls issued individually (instead of grouped)

- Single-threaded CPU rendering code that becomes a bottleneck

In this scenario, improving CPU-side efficiency increases rendering smoothness.

#### B. When the CPU Must Stall (GPU Too Slow)

This happens when the GPU is overloaded with work.

Effects:

- The command queue fills up.

- The CPU must pause before submitting more commands.

- The game logic cannot advance until the GPU catches up.

Typical causes include:

- Extremely heavy shaders

- Very high resolution or too many pixels to shade

- Excessive post-processing or complex lighting

Here, optimizing the GPU workload is key: fewer effects, simpler shaders, or reducing resolution.


### 3.4 Tools for Keeping Both Sides Balanced

The industry has developed techniques to keep the producer (CPU) and consumer (GPU) in sync. At this stage, only the high-level ideas are introduced; they will be explored in detail later.

Some coordination methods include:

- **Batching:** Grouping multiple objects into a single draw to reduce CPU overhead.

- **Instancing:** Rendering many copies of an object with one command.

- **Multithreaded Command Recording:** Using multiple CPU threads to generate GPU work in parallel.

- **Frame Pacing:** Controlling frame timing so visual output remains smooth and consistent.

These techniques help maintain the “steady pipeline” model where both processors stay busy.















## 2.3 Asynchronous Execution and CPU–GPU Parallelism

Okay, so we've seen the pipeline. But when we talk about pipelines, different stages are working on different things... That's literally the 'line' part. When a line advances, people at the front at at a different stage from the people in the back.

This idea is also present in CPU-GPU:
> The CPU and GPU run in parallel on different frames.

- While the GPU is busy rendering frame N,
- The CPU is already preparing the commands for frame N+1.

This overlap keeps both processors busy at the same time and avoids stalls.

When well-managed:

- The GPU always has more work queued.

- The CPU never waits for the GPU to finish before continuing.

Poorly managed command flow leads to bubbles — idle time where one processor is waiting for the other and performance drops.


## 2.4 Why This Matters Before Diving Deeper

Understanding this command path builds an important mental model:

- The CPU does not draw; it describes work for the GPU.

- Drivers and the operating system translate and schedule that work.

- The GPU executes asynchronously, often one or more frames behind the CPU.

- Efficient rendering is about keeping both sides productive without blocking each other.

This foundation will make later topics much easier to understand.