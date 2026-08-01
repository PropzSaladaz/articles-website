---
status: "draft"
date: "2026-07-31"
summary: "Derive 2D Perlin noise from lattice gradients, dot products, and the quintic fade curve used for smooth interpolation."
---


In the previous article form this collection, we saw that usually for simulations, we need something that appears random but still changes smoothly.

Consider procedural terrain. If the terrain height at one point is $5$ meters, moving a few centimeters should usually produce a similar height. We do not want the surface to jump unpredictably from $5$ meters to $-20$ meters simply because we moved to the next coordinate.

Perlin noise solves this by producing a **smooth, deterministic, pseudorandom scalar field**.

You can think of it as an infinite landscape of smoothly connected hills and valleys:

$$
N(x,y) \rightarrow \text{one scalar value}
$$

Given a position $(x,y)$, the function returns a number. Nearby positions tend to return similar numbers.

Perlin noise does not assign an independent random value to every coordinate. Instead, it places pseudorandom **gradient directions** on a regular grid and uses them to construct the values between grid points.

> [!NOTE]
> This article describes the commonly used **improved Perlin noise** formulation. It uses the quintic fade curve introduced in Ken Perlin's improved noise algorithm.

# The central idea

Imagine placing small arrows at every intersection of an infinite square grid.

Each arrow points in a pseudorandom direction:

* one may point right;
* another may point diagonally upward;
* another may point left.

These arrows are the **gradients**.

When we sample the noise at some position, we:

1. locate the grid cell containing the sample;
2. retrieve the gradient arrow at each corner;
3. measure how the sample is positioned relative to each arrow;
4. smoothly blend the four resulting contributions.

The sketch below shows the whole calculation at once. The moving black point is the sample position $p=(u,v)$ within the highlighted cell. Each coloured dashed line runs from one corner to that sample point.

The four values beginning with $d$ are the corner contributions. Their subscripts identify the corner: $00$ is bottom-left, $10$ bottom-right, $01$ top-left, and $11$ top-right. Each $d$ value comes from comparing that corner's gradient arrow with its dashed displacement vector.

$f(u)$ and $f(v)$ are the smoothed horizontal and vertical positions of the sample. They are used to form two intermediate horizontal blends:

$$
a=\operatorname{lerp}(d_{00},d_{10},f(u))
$$

$$
b=\operatorname{lerp}(d_{01},d_{11},f(u))
$$

Here, $a$ blends the bottom pair and $b$ blends the top pair. The final value, $N$, is the vertical blend between them:

$$
N=\operatorname{lerp}(a,b,f(v))
$$

The later sections derive every part of this readout. For now, follow the moving point and notice that its values change continuously.

<iframe src="simulations/perlin-gradient-cell.html" width="100%" height="620px"></iframe>

The gradients provide variation. The smooth blending prevents visible seams between cells.

# 1. Locate the lattice cell

Perlin noise is built over a regular integer grid, also called a **lattice**.

For a sample point $(x,y)$, first find the integer cell containing it:

$$
i = \lfloor x \rfloor
$$

$$
j = \lfloor y \rfloor
$$

The cell has four corners:

$$
(i,j)
$$

$$
(i+1,j)
$$

$$
(i,j+1)
$$

$$
(i+1,j+1)
$$

For example, consider:

$$
(x,y)=(3.25,7.6)
$$

The containing cell begins at:

$$
(i,j)=(3,7)
$$

Its corners are therefore:

$$
(3,7),\quad (4,7),\quad (3,8),\quad (4,8)
$$

We also compute the sample's local coordinates inside the cell:

$$
u=x-i
$$

$$
v=y-j
$$

For the example above:

$$
u=3.25-3=0.25
$$

$$
v=7.6-7=0.6
$$

Therefore, the sample is $25%$ of the way across the cell horizontally and $60%$ of the way vertically.

Because the cell has unit size:

$$
u,v\in[0,1)
$$

# 2. Assign a gradient to each corner

Each lattice point is assigned a small gradient vector.

For example, a gradient might be:

$$
g=(1,0)
$$

which points to the right, or:

$$
g=\left(\frac{1}{\sqrt{2}},\frac{1}{\sqrt{2}}\right)
$$

which points diagonally upward and to the right.

The gradients should appear random, but they must also be deterministic.

This means that asking for the gradient at lattice point $(3,7)$ must always return the same gradient for the same seed:

$$
g_{3,7}=\operatorname{gradient}(3,7,\text{seed})
$$

A different seed may produce a different gradient:

$$
\operatorname{gradient}(3,7,\text{seed}_A)
\neq
\operatorname{gradient}(3,7,\text{seed}_B)
$$

Conceptually, we can imagine that every lattice point stores an arrow. In practice, we usually do not store an infinite grid of gradients. Instead, we derive each gradient when needed using:

* a permutation table;
* an integer hash;
* another deterministic coordinate-mixing function.

Adjacent cells refer to the same gradient when they share a corner. This is essential: the cells are not generated as independent patches.

# 3. Compute displacement vectors

For each corner, compute the vector pointing from that corner to the sample position.

For the bottom-left corner $(i,j)$, the displacement is:

$$
p_{00}=(u,v)
$$

For the bottom-right corner $(i+1,j)$:

$$
p_{10}=(u-1,v)
$$

For the top-left corner $(i,j+1)$:

$$
p_{01}=(u,v-1)
$$

For the top-right corner $(i+1,j+1)$:

$$
p_{11}=(u-1,v-1)
$$

These vectors describe where the sample lies relative to each corner.

For example, if:

$$
u=0.25,\qquad v=0.6
$$

then the displacement from the bottom-left corner is:

$$
p_{00}=(0.25,0.6)
$$

while the displacement from the top-right corner is:

$$
p_{11}=(-0.75,-0.4)
$$

The first vector points upward and to the right. The second points downward and to the left.

# 4. Compute each corner's contribution

Each corner contributes a value through a dot product:

$$
d_{00}=g_{00}\cdot p_{00}
$$

$$
d_{10}=g_{10}\cdot p_{10}
$$

$$
d_{01}=g_{01}\cdot p_{01}
$$

$$
d_{11}=g_{11}\cdot p_{11}
$$

The dot product measures how strongly the sample lies in the gradient's preferred direction.

For two vectors:

$$
a=(a_x,a_y)
$$

$$
b=(b_x,b_y)
$$

their dot product is:

$$
a\cdot b=a_xb_x+a_yb_y
$$

Geometrically:

$$
a\cdot b=|a||b|\cos(\theta)
$$

where $\theta$ is the angle between the vectors.

This gives three useful cases:

* **positive:** the sample lies roughly in the direction of the gradient;
* **negative:** the sample lies roughly opposite the gradient;
* **near zero:** the sample lies roughly perpendicular to the gradient.

## Concrete example

Suppose a corner gradient points to the right:

$$
g=(1,0)
$$

and the displacement toward the sample is:

$$
p=(0.7,0.2)
$$

Then:

$$
g\cdot p
========

# (1)(0.7)+(0)(0.2)

0.7
$$

The result is positive because the sample lies mostly in the direction of the gradient.

Now consider a sample on the other side:

$$
p=(-0.4,0.2)
$$

Then:

$$
g\cdot p
========

# (1)(-0.4)+(0)(0.2)

-0.4
$$

The result is negative because the sample lies opposite the gradient direction.

A useful analogy is to imagine that each gradient is a small wind arrow. The dot product asks:

> How far did we move in the direction of this wind?

Moving with the wind gives a positive contribution. Moving against it gives a negative contribution. Moving sideways gives a contribution near zero.

> [!IMPORTANT]
> The corner contributions are not heights stored at the corners. They are temporary values calculated for the current sample position.

In standard Perlin noise, the value at an exact lattice point is usually zero. At that point, the displacement from the corner to the sample is $(0,0)$, and therefore:

$$
g\cdot(0,0)=0
$$

The variation appears between lattice points.

# 5. Smooth the interpolation coordinates

We now have four corner contributions, but we still need to combine them.

A simple approach would use the local coordinates $u$ and $v$ directly as interpolation weights. However, direct linear interpolation would create noticeable changes in slope at lattice boundaries.

Instead, improved Perlin noise passes each coordinate through a **fade function**:

$$
f(t)=6t^5-15t^4+10t^3
$$

This transforms a linear movement through a cell into a smooth transition.

The curve satisfies:

$$
f(0)=0
$$

$$
f(1)=1
$$

Its first derivative is zero at both ends:

$$
f'(0)=f'(1)=0
$$

Its second derivative is also zero at both ends:

$$
f''(0)=f''(1)=0
$$

Near the beginning and end of the interval, the interpolation slows down smoothly.

An everyday analogy is a car moving between two positions:

* linear interpolation behaves like immediately starting and stopping at a fixed speed;
* faded interpolation behaves like smoothly accelerating, travelling, and then smoothly braking.

The car reaches the same destination, but without abrupt changes in motion.

We calculate:

$$
s=f(u)
$$

$$
t=f(v)
$$

These faded values become the interpolation weights.

# 6. Interpolate the four contributions

Linear interpolation between two values $a$ and $b$ is defined as:

$$
\operatorname{lerp}(a,b,t)=a+t(b-a)
$$

Equivalently:

$$
\operatorname{lerp}(a,b,t)=(1-t)a+tb
$$

When $t=0$, the result is $a$.

When $t=1$, the result is $b$.

When $t=0.5$, the result is halfway between them.

Perlin noise first interpolates horizontally.

For the bottom edge:

$$
a=\operatorname{lerp}(d_{00},d_{10},f(u))
$$

For the top edge:

$$
b=\operatorname{lerp}(d_{01},d_{11},f(u))
$$

It then interpolates vertically between those two results:

$$
N(x,y)=\operatorname{lerp}(a,b,f(v))
$$

Expanded:

$$
N(x,y)
======

\operatorname{lerp}
\left(
\operatorname{lerp}(d_{00},d_{10},f(u)),
\operatorname{lerp}(d_{01},d_{11},f(u)),
f(v)
\right)
$$

This produces the final noise value at $(x,y)$.

The interpolation can be understood as two stages:

```text
d01 -------- d11
 |             |
 |      b      |
 |             |
 |      N      |
 |             |
 |      a      |
d00 -------- d10
```

First, blend the two bottom contributions to obtain $a$.

Then, blend the two top contributions to obtain $b$.

Finally, blend $a$ and $b$ vertically to obtain $N$.

# Why neighboring cells connect smoothly

Two neighboring cells share the gradients along their common boundary.

For example, the right corners of one cell are the left corners of the next cell:

```text
cell A              cell B

g00 ---- g10 ---- g20
 |         |         |
 |         |         |
g01 ---- g11 ---- g21
```

The gradients at `g10` and `g11` belong to both cells.

Because both cells use:

* the same shared gradients;
* compatible displacement vectors;
* a fade curve with flat derivatives at its endpoints;

their values meet smoothly at the boundary.

This is why the final field behaves like one continuous surface rather than a collection of disconnected square patches.

# A compact implementation

The following pseudocode captures the main structure of 2D improved Perlin noise:

```js
function perlin2D(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);

  const localX = x - x0;
  const localY = y - y0;

  const fadedX = fade(localX);
  const fadedY = fade(localY);

  const g00 = gradient(x0,     y0,     seed);
  const g10 = gradient(x0 + 1, y0,     seed);
  const g01 = gradient(x0,     y0 + 1, seed);
  const g11 = gradient(x0 + 1, y0 + 1, seed);

  const d00 = dot(g00, localX,     localY);
  const d10 = dot(g10, localX - 1, localY);
  const d01 = dot(g01, localX,     localY - 1);
  const d11 = dot(g11, localX - 1, localY - 1);

  const bottom = lerp(d00, d10, fadedX);
  const top = lerp(d01, d11, fadedX);

  return lerp(bottom, top, fadedY);
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function dot(gradient, x, y) {
  return gradient.x * x + gradient.y * y;
}
```

The `gradient` function must return a deterministic gradient based on:

* the integer lattice coordinate;
* the world seed.

For example:

```js
function gradient(x, y, seed) {
  const hash = hashCoordinates(x, y, seed);
  return GRADIENTS[hash % GRADIENTS.length];
}
```

A small predefined gradient set might be:

```js
const GRADIENTS = [
  { x:  1, y:  0 },
  { x: -1, y:  0 },
  { x:  0, y:  1 },
  { x:  0, y: -1 },

  { x:  INV_SQRT_2, y:  INV_SQRT_2 },
  { x: -INV_SQRT_2, y:  INV_SQRT_2 },
  { x:  INV_SQRT_2, y: -INV_SQRT_2 },
  { x: -INV_SQRT_2, y: -INV_SQRT_2 }
];
```

where:

$$
\operatorname{INV_SQRT_2}=\frac{1}{\sqrt{2}}
$$

Normalizing diagonal gradients prevents them from having a larger magnitude than horizontal or vertical gradients.

# Determinism and seeding

Perlin noise is pseudorandom, not truly random.

For a fixed seed:

$$
N(x,y,\text{seed})
$$

always produces the same result for the same coordinates.

This is important for procedural world generation. The terrain does not need to be stored completely on disk. A chunk can be regenerated later by evaluating the same noise function with the same coordinates and seed.

For example:

```text
seed = 1234
chunk coordinate = (20, -7)
```

will always produce the same terrain, assuming the algorithm and configuration remain unchanged.

Changing the seed changes the gradient arrangement and therefore creates a different field.

A good coordinate hash should provide:

* stable results;
* good distribution;
* strong mixing between coordinate bits;
* low correlation between nearby lattice coordinates;
* low correlation between similar seeds.

A weak hash may introduce visible patterns, repeated gradients, stripes, or directional artifacts.

# Feature scale

Perlin noise itself operates in coordinate space. To control the visible size of its features, scale the input coordinates:

$$
N(x\cdot f,y\cdot f)
$$

where $f$ is the frequency.

A low frequency changes slowly:

```js
const value = perlin2D(x * 0.01, y * 0.01, seed);
```

This produces broad features such as large hills.

A high frequency changes more rapidly:

```js
const value = perlin2D(x * 0.2, y * 0.2, seed);
```

This produces smaller features such as bumps and surface irregularities.

The important distinction is:

* **frequency controls horizontal feature size;**
* **amplitude controls output strength.**

For terrain height:

```js
const height =
  perlin2D(worldX * frequency, worldZ * frequency, seed)
  * amplitude;
```

Increasing `frequency` makes terrain features narrower and more frequent.

Increasing `amplitude` makes the resulting height differences larger.

# Interactive field explorer

The explorer below samples a seeded 2D Perlin field.

Change the feature scale to see the same kind of continuous field spread over a larger or smaller area. The additional composition controls become useful when combining several noise layers in later articles.

<iframe
  src="../../simulations/noise-field-explorer.html?mode=perlin"
  width="100%"
  height="740px">
</iframe>

# What Perlin noise gives you

Perlin noise provides:

* deterministic pseudorandom variation;
* smooth changes between nearby coordinates;
* controllable feature size;
* no seams between lattice cells;
* efficient sampling without storing an entire world;
* support for arbitrary coordinates.

This makes it useful for:

* procedural terrain heights;
* texture generation;
* cloud-like masks;
* animation offsets;
* wind variation;
* vegetation distribution;
* audio modulation;
* simulation parameter variation.

For example, terrain height might use:

$$
h(x,z)=20N(0.01x,0.01z)
$$

A wind field might vary its strength using:

$$
w(x,z,t)=W_0+A,N(f_xx,f_zz,f_tt)
$$

In the second case, a 3D noise function can treat time as an additional dimension, producing wind that changes smoothly both across space and over time.

# What Perlin noise does not give you

A single Perlin noise layer usually produces terrain with one dominant feature scale.

It may create smooth hills and valleys, but it does not automatically create:

* mountain ranges;
* rocky cliffs;
* erosion channels;
* distinct plains and highlands;
* geological strata;
* realistic river networks;
* terrain with detail at many different scales.

A single octave often looks smooth but visually uniform.

To create richer terrain, we usually combine several samples with different frequencies and amplitudes:

$$
F(x,y)
======

\sum_{k=0}^{n-1}
a_kN(f_kx,f_ky)
$$

This construction is commonly called **fractal Brownian motion**, or **fBm**.

A low-frequency layer may define broad hills. Higher-frequency layers then add progressively smaller details.

However, adding octaves only introduces detail at additional scales. It does not automatically create fundamentally different landforms. Mountains, plains, ridges, cliffs, and valleys generally require additional transformations or separate terrain fields.

# Output range

Perlin noise is often described as producing values in:

$$
[-1,1]
$$

In practice, the exact range depends on:

* the chosen gradient set;
* gradient normalization;
* dimensionality;
* interpolation details;
* implementation-specific scaling.

A particular implementation may only reach a smaller interval, such as:

$$
[-0.7,0.7]
$$

Do not assume the exact range without checking it.

For world-generation code, either:

1. measure the practical output range;
2. analytically normalize the implementation;
3. remap and clamp the values before assigning world meaning.

For example:

```js
const normalized = clamp(noise * scale, -1, 1);
const zeroToOne = normalized * 0.5 + 0.5;
```

This converts a normalized value from:

$$
[-1,1]
$$

to:

$$
[0,1]
$$

# Summary

Improved Perlin noise constructs a smooth scalar field through four main ideas:

1. Place deterministic pseudorandom gradients on an integer lattice.
2. Compute displacement vectors from nearby corners to the sample.
3. Use dot products to calculate each corner's contribution.
4. Blend those contributions using quintic-faded interpolation weights.

In compact form:

$$
\text{lattice gradients}
+
\text{dot products}
+
\text{smooth interpolation}
===========================

\text{Perlin noise}
$$

The gradients create variation, while the interpolation connects that variation into a continuous field.

Perlin noise is therefore not a collection of random heights. It is a deterministic method for generating smooth, spatially correlated variation.
