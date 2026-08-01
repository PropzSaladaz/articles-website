---
status: "draft"
date: "2026-07-19"
summary: "Derive the view matrix from a camera's position and orientation. Learn how lookAt constructs a camera frame and why view space is the world expressed relative to that frame."
---

# World Space → View Space: The Camera Transform

The renderer receives vertices, directions, lights, and other data that describe a 3D scene. To show the scene on a screen, it first needs a single answer to a simple question:

> **Where is each vertex from the camera's point of view?**

That is the job of the **view transform**.

A mesh's vertices are usually authored and stored in model space. A model transform places the mesh in the scene, producing world-space vertex positions. From this point onward, every vertex that reaches the camera stage has a location in the shared world coordinate system.

For the rest of this article, we assume that work is already done. We need only two ingredients:

1. A world-space vertex we may want to display.
2. A camera with a position and a direction in the same world.

The camera does not need to point at each vertex individually. It has one position and one viewing direction; the view transform applies that camera's viewpoint to every vertex in the draw call.

> [!IMPORTANT]
> The view matrix does **not** move the camera through a fixed world. It re-expresses the world as if the camera were at the origin, aligned with the view-space axes.

## 1. What Enters and Leaves This Stage

The view transform receives a world-space position and produces the same geometric point written in view space:

$$
p_{view} = Vp_{world}
$$

| Input | Output | What changed? |
|---|---|---|
| A vertex position in world space | The same vertex position in view space | Its coordinates are now measured from the camera rather than from the world's origin. |
| A direction in world space | The same direction in view space | Its components are aligned with the camera's axes; it is not translated. |

We will use a right-handed convention in which the camera sits at the view-space origin and looks down the **negative Z axis**. Therefore:

* a point directly in front of the camera has a negative view-space Z value;
* the camera itself becomes $(0, 0, 0)$;
* the positive X and Y axes represent the camera's right and up directions.

> [!NOTE]
> Different graphics APIs and libraries choose different conventions. The derivation below is internally consistent; if an engine uses another convention, one or more signs or matrix layouts may differ. Always identify the source and destination spaces before copying a **lookAt** function.

<iframe src="simulations/view_transform.html" width="100%" height="600px"></iframe>


## 2. A Camera Is a Coordinate Frame

The world has its own origin and axes. A camera needs its own origin and axes:

* **Eye position** $E$: where the camera is in world space.
* **Forward direction** $f$: the direction the camera looks.
* **Right direction** $r$: the direction that appears to the camera's right.
* **Up direction** $u$: the direction that appears upward in the image.

For a right-handed view space that looks down negative Z, it is also useful to name the camera's positive-Z direction:

$$
b = -f
$$

We call $b$ the camera's **backward** direction. It is the third axis of the camera's local coordinate frame.

Use this table to read the convention:

| Camera direction in world space | Its view-space meaning |
|---|---|
| $r$ | Positive X: right |
| $u$ | Positive Y: up |
| $f$ | Negative Z: forward |
| $b = -f$ | Positive Z: backward |

The three axes $r$, $u$, and $b$ must be perpendicular and have unit length. Such a frame is called **orthonormal**.

> [!TIP]
> Think of view space as a tripod bolted to the camera. Instead of asking for a vertex's world coordinates, ask how far it lies along the tripod's right, up, and backward legs.

## 3. From a Target Point to Camera Axes

Most camera APIs offer a **lookAt** operation. It usually takes:

* an eye position $E$;
* a target point $T$ that the camera should face;
* a reference-up direction $u_{ref}$, often $(0, 1, 0)$.

The target gives us the initial viewing direction:

$$
f = \frac{T - E}{\lVert T - E \rVert}
$$

This points **from the eye toward the target**. It is normalized so that it has length one.

The supplied up vector is only a reference. It tells us which way should be “roughly up,” but it is not necessarily perpendicular to $f$. We use a cross product to construct a perpendicular right direction:

$$
r = \frac{f \times u_{ref}}{\lVert f \times u_{ref} \rVert}
$$

Finally, we recompute a true up direction from the two perpendicular directions we now trust:

$$
u = r \times f
$$

and define:

$$
b = -f
$$

The cross-product order matters. Under our convention, $f \times u_{ref}$ gives the camera's right direction. Reversing the operands changes the sign and mirrors the camera.

:::spoiler[Why is the supplied up vector not used directly?]
The viewing direction and the reference-up direction may not be perpendicular. If we used both without correction, the camera frame would be skewed: its axes would not meet at right angles, and the resulting view matrix could unintentionally shear the scene.

The first cross product produces a direction perpendicular to both the view direction and the reference up. The second cross product then gives an up direction perpendicular to the other two. The result is an orthonormal basis, as long as the reference up is not parallel to the viewing direction.
:::

> [!WARNING]
> **lookAt** is undefined when $E = T$: there is no viewing direction. It also becomes degenerate when $u_{ref}$ is parallel or nearly parallel to $f$, because their cross product has zero or near-zero length. A real camera controller must choose a different reference-up direction in that case.

> [!EXERCISE]
> Let $E = (0, 0, 5)$, $T = (0, 0, 0)$, and $u_{ref} = (0, 1, 0)$. Compute $f$, $r$, $u$, and $b$.
>
> You should obtain a camera whose right and up axes agree with the world axes, whose forward direction is $(0, 0, -1)$, and whose backward direction is $(0, 0, 1)$.

## 4. Change of Basis: Expressing a Vertex Relative to the Camera

Let $p_{world}$ be a world-space vertex. Before we can describe it using the camera's axes, we must put the camera at the origin:

$$
q = p_{world} - E
$$

The vector $q$ points from the camera to the vertex. Its coordinates in the camera frame are simply its projections onto the camera axes:

$$
\begin{aligned}
x_{view} &= r \cdot q \\
y_{view} &= u \cdot q \\
z_{view} &= b \cdot q
\end{aligned}
$$

Equivalently:

$$
p_{view} =
\begin{bmatrix}
r^T \\
u^T \\
b^T
\end{bmatrix}
(p_{world} - E)
$$

This is the essential derivation of the view transform:

1. subtract the eye position to make the camera the origin;
2. take dot products with the camera axes to change from world axes to camera axes.

> [!EXAMPLE]
> A vertex can be far from the world's origin yet close to the camera, or close to the world's origin yet behind the camera. World-space coordinates alone cannot tell us either fact. View space can.

## 5. Turning the Derivation into a View Matrix

Homogeneous coordinates let us combine the translation and change of basis in one matrix multiplication. With column vectors, the view matrix is:

$$
V =
\begin{bmatrix}
r_x & r_y & r_z & -r \cdot E \\
u_x & u_y & u_z & -u \cdot E \\
b_x & b_y & b_z & -b \cdot E \\
0   & 0   & 0   & 1
\end{bmatrix}
$$

Applied to a point,

$$
\begin{bmatrix}
x_{view} \\
y_{view} \\
z_{view} \\
1
\end{bmatrix}
=
V
\begin{bmatrix}
x_{world} \\
y_{world} \\
z_{world} \\
1
\end{bmatrix}
$$

The final column contains the translation terms. They are the dot products produced when we expand the earlier expression:

$$
r \cdot (p_{world} - E) = r \cdot p_{world} - r \cdot E
$$

The same expansion gives the Y and Z rows.

### Points and Directions Are Not the Same

A point has homogeneous coordinate $w = 1$, so it receives both rotation and translation:

$$
\begin{bmatrix}
p_{view} \\
1
\end{bmatrix}
=
V
\begin{bmatrix}
p_{world} \\
1
\end{bmatrix}
$$

A direction has $w = 0$, so the translation column has no effect:

$$
\begin{bmatrix}
d_{view} \\
0
\end{bmatrix}
=
V
\begin{bmatrix}
d_{world} \\
0
\end{bmatrix}
$$

This is exactly what we want. A direction has an orientation but no location: moving the camera should not move a light direction, normal direction, or velocity vector through space.

> [!IMPORTANT]
> Use the point form for vertex positions and the direction form for direction vectors. Treating a direction as a point makes it incorrectly respond to camera translation.

## 6. The Same Result as an Inverse Camera Transform

There is another powerful way to understand the view matrix. A camera has a pose in the world: it has a position $E$ and an orientation given by its local right, up, and backward axes.

The matrix that moves a point **from camera-local space into world space** is:

$$
C =
\begin{bmatrix}
r_x & u_x & b_x & E_x \\
r_y & u_y & b_y & E_y \\
r_z & u_z & b_z & E_z \\
0   & 0   & 0   & 1
\end{bmatrix}
$$

The view matrix must do the reverse conversion:

$$
V = C^{-1}
$$

Because the rotation part of $C$ is orthonormal, its inverse is its transpose. The inverse camera transform is therefore:

$$
C^{-1} =
\begin{bmatrix}
r_x & r_y & r_z & -r \cdot E \\
u_x & u_y & u_z & -u \cdot E \\
b_x & b_y & b_z & -b \cdot E \\
0   & 0   & 0   & 1
\end{bmatrix}
$$

This is the same matrix we derived from dot products.

:::spoiler[Why does an orthonormal rotation invert by transposing?]
The columns of an orthonormal rotation matrix are unit-length and mutually perpendicular. Their dot products form the identity matrix:

$$
R^T R = I
$$

By definition, a matrix whose product with $R$ is the identity is $R^{-1}$. Therefore:

$$
R^{-1} = R^T
$$

This shortcut is specific to pure rotation. A general transform with non-uniform scaling or shear cannot be inverted merely by transposing it.
:::

> [!TIP]
> If you already have a camera's world transform, do not use it directly as the view matrix. Invert it first. This is the source of the classic “my camera moves backward” bug.

## 7. A Complete lookAt Construction

Here is the full construction in pseudocode. It follows the right-handed, negative-Z-forward convention used throughout this article.

~~~text
forward  = normalize(target - eye)
right    = normalize(cross(forward, referenceUp))
up       = cross(right, forward)
backward = -forward

view =
| right.x     right.y     right.z     -dot(right, eye)    |
| up.x        up.y        up.z        -dot(up, eye)       |
| backward.x  backward.y  backward.z  -dot(backward, eye) |
| 0           0           0           1                   |
~~~

The first three rows change the basis from world axes to camera axes. The last column moves the camera's eye position to the view-space origin.

> [!NOTE]
> This notation describes how the matrix acts on column vectors. A library may store its numbers in row-major or column-major memory order, and may expose a lookAt function with a different convention. Memory layout and multiplication convention are related in code, but they are not the same mathematical idea.

## 8. Worked Example

Place the camera at:

$$
E = (0, 0, 5)
$$

and ask it to look at the world origin:

$$
T = (0, 0, 0)
$$

with reference up:

$$
u_{ref} = (0, 1, 0)
$$

The resulting camera axes are:

$$
\begin{aligned}
f &= (0, 0, -1) \\
r &= (1, 0, 0) \\
u &= (0, 1, 0) \\
b &= (0, 0, 1)
\end{aligned}
$$

So the view matrix becomes:

$$
V =
\begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 1 & -5 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

Now transform a world-space vertex:

$$
p_{world} = (1, 2, 0)
$$

The result is:

$$
p_{view} = (1, 2, -5)
$$

The vertex is five units in front of the camera, so its view-space Z coordinate is $-5$. The X and Y coordinates are unchanged because this camera is aligned with the world axes.

> [!EXERCISE]
> Using the same camera, transform the point $(0, 0, 5)$. Then transform $(0, 0, 10)$.
>
> The first point is the camera itself and should become the view-space origin. The second point is behind the camera and should have a positive Z value.

## 9. Debugging the View Transform

When a scene looks wrong, inspect a known point in both world and view space. The following symptoms narrow down the likely cause:

| Symptom | Likely cause |
|---|---|
| Moving the camera right makes the world move right | The camera transform was used instead of its inverse. |
| The scene is mirrored left-to-right | A cross product was reversed, or handedness was mixed. |
| The image rolls or stretches while moving | The camera basis is not orthonormal. |
| Looking straight up causes sudden spinning | The reference-up direction became parallel to the forward direction. |
| A directional light changes when the camera translates | The direction was transformed as a point with $w = 1$. |
| Objects in front of the camera have positive Z unexpectedly | The chosen forward-axis convention does not match the projection matrix. |

> [!WARNING]
> A view matrix, projection matrix, shader, and math library must agree on their conventions. A correct lookAt matrix paired with an incompatible projection matrix can still produce a flipped, mirrored, or depth-inverted image.

## Where We Go Next

At the end of this stage, every vertex is expressed relative to the camera. A vertex's X and Y values now describe its sideways and vertical position in the camera frame, while its negative Z value says how far in front of the camera it lies.

The next transformation—**View Space → Clip Space**—uses that camera-relative position to apply perspective: it encodes field of view, aspect ratio, and the visible near/far range so that the GPU can form a 2D image from the 3D view.
