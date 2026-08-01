---
status: "draft"
date: "2026-07-31"
summary: "Combine multiple octaves of Perlin noise and learn how frequency, amplitude, persistence, and normalization shape a terrain signal."
---

# Fractal Brownian Motion

A single octave of Perlin noise gives one characteristic feature size. It can describe broad hills or small bumps, but not both at once. Fractal Brownian motion—usually shortened to **fBm**—adds several scaled copies of a base noise function:

$$
F(\mathbf{p}) = \sum_{k=0}^{m-1} a_k\,N(f_k\mathbf{p})
$$

Each octave changes the frequency $f_k$ and amplitude $a_k$. When the frequency increases while the amplitude decreases, broad structure is decorated with progressively finer detail.

## The four useful controls

An fBm implementation usually exposes these parameters:

| Parameter | Meaning | Typical effect |
|---|---|---|
| Octaves | Number of noise layers | More layers add smaller detail and more cost. |
| Lacunarity | Frequency multiplier between layers | Larger values separate feature scales more aggressively. |
| Persistence | Amplitude multiplier between layers | Higher values retain more high-frequency detail. |
| Base scale | Initial sampling frequency or feature size | Controls the size of the broadest features. |

The common recurrence is:

$$
f_{k+1} = \lambda f_k, \qquad a_{k+1} = p a_k
$$

where $\lambda$ is lacunarity and $p$ is persistence.

## Normalize the sum

If the first amplitude is $1$, the maximum possible sum of absolute amplitudes is:

$$
A = \sum_{k=0}^{m-1} a_k
$$

Divide the accumulated value by $A$ so changing the octave count does not silently change the output scale:

```js
function fbm(point, octaves, lacunarity, persistence) {
  let frequency = 1;
  let amplitude = 1;
  let value = 0;
  let amplitudeSum = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    value += amplitude * perlin(point * frequency);
    amplitudeSum += amplitude;
    frequency *= lacunarity;
    amplitude *= persistence;
  }

  return value / amplitudeSum;
}
```

This normalization assumes the base noise is itself reasonably centered and bounded. If the implementation has a different range, remap or calibrate it first.

## Interactive field explorer

The explorer starts in fBm mode. Add or remove octaves, then compare the result with the **billow** and **ridged** modes: those variants apply a simple shaping operation to the same Perlin primitive before the terrain stage interprets it.

<iframe src="../../simulations/noise-field-explorer.html?mode=fbm" width="100%" height="740px"></iframe>

## Why the result looks natural

The layers are correlated at different spatial scales:

- Low frequencies establish continents, valleys, or large mountain ranges.
- Middle frequencies shape slopes and regional variation.
- High frequencies add ridges, roughness, and small terrain variation.

The result is not “more random” simply because it has more octaves. It is a structured sum whose power is distributed across scales. The choice of persistence determines how much visual energy reaches the fine detail.

## Turning fBm into terrain

For a heightmap, sample the field in the horizontal plane and map it to elevation:

$$
h(x,z) = h_{base} + H\,R\left(F\left(\frac{x}{L},\frac{z}{L}\right)\right)
$$

Here $L$ controls the broad feature size, $H$ controls height range, and $R$ is a remapping function. A linear $R$ produces rolling terrain; a curve can flatten plains or emphasize peaks.

For a volumetric world, use the field as one term in a density function instead. For example, the signed distance from a terrain surface can be combined with another field for caves. The fBm signal remains a building block; the density equation decides what solid and empty mean.

> [!WARNING]
> Sampling a high-frequency field at too low a resolution causes aliasing: small features appear to flicker, disappear, or repeat unpredictably. Match the sample spacing and the highest octave frequency to the resolution of the mesh or voxel grid.
