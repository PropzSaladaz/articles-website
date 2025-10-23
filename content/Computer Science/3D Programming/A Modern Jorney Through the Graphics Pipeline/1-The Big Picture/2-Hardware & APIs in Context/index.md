---
status: "draft"
summary: "How CPU, GPU, drivers, and APIs cooperate to turn draw calls into pixels."
coverImage: "./images/cover_hardware.png"
---

# The Division of Labor: CPU vs GPU

A real-time renderer operates across **two very different types of processors** working in concert: the **CPU** (Central Processing Unit) and the **GPU** (Graphics Processing Unit).  
Each is optimized for distinct styles of computation, and understanding their division of labor is fundamental to grasping how modern rendering works.

---

## 1. Complementary Architectures

| Component | Strength | Execution Model | Typical Tasks |
|------------|-----------|----------------|----------------|
| **CPU (Central Processing Unit)** | Low-latency, flexible control flow | Sequential, branch-heavy, cache-sensitive | Scene management, physics, logic, command recording |
| **GPU (Graphics Processing Unit)** | High-throughput, data-parallel execution | SIMD/SIMT (Single Instruction, Multiple Threads) | Vertex processing, rasterization, shading, post-processing |

**CPU — the director and scheduler.**  
The CPU’s architecture is designed for *decision-making*: executing complex, branching code with frequent memory access.  
In a game engine or renderer, it’s responsible for:
- **Scene management:** updating object transforms, visibility culling, and sorting transparent/opaque objects.
- **Resource preparation:** building vertex/index buffers, uploading textures, and updating per-frame constants.
- **State setup:** selecting shaders, blend modes, and depth/stencil configurations for each draw.
- **Command recording:** issuing draw, dispatch, and copy commands into command buffers for the GPU.

The CPU emphasizes *control*, not *throughput*.  
It can rapidly change direction (handle interrupts, make per-object decisions), but it executes relatively few instructions per clock compared to the GPU.



**GPU — the factory floor.**  
Once the CPU packages up a frame’s work, the GPU takes over to perform *massively parallel computation*.  
Its architecture trades flexibility for sheer arithmetic density:
- Thousands of lightweight threads execute the same shader program on different data (vertices, fragments, compute groups).
- Specialized hardware blocks accelerate structured operations like **rasterization**, **texture sampling**, and **depth testing**.
- Shader cores (SMs, CUs, or EUs depending on vendor) handle the programmable stages — vertex, fragment, compute, etc.

The GPU’s power lies in *uniform workloads*: when thousands of fragments run the same program, the GPU can reach extraordinary throughput. But it struggles when forced to execute divergent code paths or frequent branching — tasks better suited to the CPU.

---

## 2. The Command Path: From CPU to GPU

When your application calls:

```cpp
DrawIndexed(...);
