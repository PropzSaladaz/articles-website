---
status: "draft"
date: "2026-07-31"
summary: "Define the properties a world generator needs from a noise function: determinism, continuity, locality, and controllable scale."
---

In many computer science simulations—whether 3D terrain generation, audio DSP, or other procedural systems—we often need some form of **randomness**, or more accurately, a function that *appears* random while remaining controlled and predictable.

For example, in procedural terrain generation we want a continuous, natural-looking landscape. We do **not** want complete randomness, where every terrain coordinate is independent of its neighbors. That is not how natural landscapes behave.

Instead, we want **layered randomness**, where each layer adds detail at a different scale:

1. Layer 1 determines large-scale features, such as where mountain ranges appear across an entire country.
2. Layer 2 adds smaller hills and peaks within the terrain defined by Layer 1.
3. Layer 3 adds fine details, such as rocky outcrops and small surface irregularities, on top of the terrain from Layer 2.

Each layer should also produce **smoothly varying values**. Nearby points should have similar outputs.

For example, if the terrain height at point $(1,2)$ is **5 meters**, then moving **1 meter** to the right might produce a height somewhere between **4 and 6 meters**. Moving only **0.5 meters** should produce an even smaller change, perhaps between **4.5 and 5.5 meters**.

It would not look realistic if moving just one meter suddenly changed the height from **5 meters** to **-5** or **12,500** meters.


# Defining Noise

Before talking about specific noise functions, it helps to define the problem precisely. A world generator wants a function that maps a coordinate and a seed to a value:

$$
n = N(\mathbf{p}, s)
$$

where $\mathbf{p}$ is a point in space and $s$ is the world seed. The same input must always produce the same output, but nearby points should usually produce nearby outputs.

# Randomness is not enough

Independent random samples are useful for rolling loot or choosing a spawn point, but they are a poor terrain signal. If every neighboring coordinate gets an unrelated value, a heightmap becomes noisy at the scale of individual pixels:

```text
random:  .9  .1  .8  .2  .7  .0
noise:   .4  .5  .5  .6  .7  .7
```

A noise function preserves some unpredictability while adding spatial correlation. Moving a small distance through the domain should cause a small change in the output. Moving farther should eventually reveal new structure.

<iframe src="simulations/random-vs-noise-terrain.html" width="100%" height="600px"></iframe>

## Useful properties

For terrain and other procedural fields, four properties matter most:

| Property | Why it matters |
|---|---|
| Deterministic | A seed can regenerate the same world without saving every tile. |
| Continuous or smooth | Neighboring samples form hills, valleys, and coherent regions instead of isolated pixels. |
| Bounded or normalizable | A generator can map the output to heights, thresholds, and blend weights. |
| Multi-scale | The same field can be sampled at different frequencies, and several frequencies can be combined. |

Determinism does not mean that a function must be globally random in a mathematical sense. It means that the apparent irregularity is stable and cheap to query.

