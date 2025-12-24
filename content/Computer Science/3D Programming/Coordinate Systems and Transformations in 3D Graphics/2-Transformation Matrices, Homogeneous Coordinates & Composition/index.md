---
status: "published"
date: "2025-12-15"
summary: "Homogeneous coordinates unify translation, rotation, and scaling into matrix multiplication. Learn how 4x4 matrices enable elegant 3D transformations and why they're essential for graphics."
---

# 1. Homogeneous Coordinates

Strange name huh? We will see what it represents in a second. But first, let's start from the simplest case - 2D.

## 1.1 Starting with 2D: Rotation Using Matrices

In a 2D Cartesian plane, a point is represented as:

$$
p = \begin{bmatrix} x \ y \end{bmatrix}
$$

Certain transformations can be applied to this point using matrix multiplication. The first important example is **rotation**.

---

### 2D Rotation

To rotate a point around the origin by an angle (\theta), we use the following rotation matrix:

$$
R(\theta)=
\begin{bmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{bmatrix}
$$

:::spoiler[See explanation for that formula]

### Why the Rotation Formula Has This Form

#### 1. Represent a Point in Polar Form

Any point $(x, y)$ can be described using:

* its distance from the origin (r)
* its angle (\alpha) relative to the positive X-axis

$$
x = r\cos\alpha,\quad y = r\sin\alpha
$$

This is simply converting Cartesian to polar coordinates.

---

#### 2. Rotate the Point by an Angle $\theta$

Rotating the point counter-clockwise by $\theta$ increases its angle:

$$
\alpha' = \alpha + \theta
$$

The coordinates of the rotated point become:

$$
x' = r\cos(\alpha + \theta),\quad y' = r\sin(\alpha + \theta)
$$

---

#### 3. Expand Using Angle Addition Identities

Use the trigonometric identities:

$$
\cos(\alpha + \theta) = \cos\alpha\cos\theta - \sin\alpha\sin\theta
$$

$$
\sin(\alpha + \theta) = \sin\alpha\cos\theta + \cos\alpha\sin\theta
$$

Substitute $x = r\cos\alpha$ and $y = r\sin\alpha$:

$$
x' = x\cos\theta - y\sin\theta
$$

$$
y' = x\sin\theta + y\cos\theta
$$

---

#### 4. Convert to Matrix Form

Now express the transformation as a matrix multiplication:

$$
\begin{bmatrix}
x' \ y'
\end{bmatrix}
=

\begin{bmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{bmatrix}
\cdot
\begin{bmatrix}
x \ y
\end{bmatrix}
$$

This matrix is the **2D rotation matrix**.

---

### Key Insight

The rotation matrix is not arbitrary; it is the algebraic form of a geometric fact:

* Rotating a point increases its angle by $\theta$, but keeps its distance from the origin constant.
* The cosine and sine terms come from converting between polar and Cartesian coordinates.
* The structure of the matrix ensures that the point’s length does not change — only its orientation.

This is why **rotation fits perfectly into a matrix multiplication**, making it easy to apply and combine with other transformations.

:::

Applying this matrix to a point performs the rotation:

$$
p' = R(\theta) \cdot p
$$

This is a purely multiplicative operation, which is powerful because:

* It allows applying rotations consistently to any vector.
* It can be chained with other matrix-based transformations.
* It keeps the math compact and efficient.

**Example:** rotating the point $(1, 0)$ by $90^\circ$ counter-clockwise:

$$
R(90^\circ)=
\begin{bmatrix}
0 & -1 \\
1 & 0
\end{bmatrix}
\quad\Rightarrow\quad
p' = \begin{bmatrix}0\1\end{bmatrix}
$$

The point moves from the positive X-axis to the positive Y-axis, as expected:

![](./images/img4.svg)

---

## 1.2 Scaling in 2D

Scaling also fits naturally into matrix multiplication:

$$
S(s\_x, s\_y) =
\begin{bmatrix}
s\_x & 0 \\
0 & s\_y
\end{bmatrix}
$$

For example, scaling a point by 2 in both axes doubles its distance from the origin.

---

## 1.3 The Limitation: Translation Does Not Fit

Rotation and scaling can be expressed as matrix × vector operations.\
Translation cannot:

$$
p' =
\begin{bmatrix}
x + t\_x \\
y + t\_y
\end{bmatrix}
$$

There is no 2×2 matrix (T) such that:

$$
T \cdot p = p + t
$$

This creates a practical issue:

* Rotation and scaling can be chained through matrix multiplication.
* Translation requires addition.
* Mixing multiplication and addition complicates combining transformations.

If you want to scale, then rotate, then translate a point, you must apply each step separately.\
This makes it harder to **compose transforms** into a single reusable operation.

---

### Why This Matters

Game engines, animation systems, and GPU pipelines often need to apply **many transformations at once**, possibly hundreds per frame. Ideally, all transforms should be composable in the form:

$$
p' = M \cdot p
$$

where (M) represents the entire accumulated transformation.

The limitation in 2D — that translation requires addition — is the motivation for extending the coordinate system.\
The next step will show how adding a third component in 2D (homogeneous representation) solves this elegantly.

---

## 1.4 Solving Translation in 2D with Homogeneous Coordinates

As we saw, the limitation in standard 2D coordinates is that translation requires addition, not multiplication.\
To overcome this, we extend 2D points from 2 components to **3 components**:

* A 2D point $(x, y)$ becomes $(x, y, 1)$
* A 2D direction vector becomes $(x, y, 0)$

This extended representation is called **homogeneous coordinates**.

A point in 2D homogeneous form is written as:

$$
p\_h = \begin{bmatrix} x \ y \ 1 \end{bmatrix}
$$

The extra value `1` enables translation to be embedded inside a matrix.

---

### Translation as a Matrix

With homogeneous coordinates, translation can be expressed as a **3×3 matrix**:

$$
T(t\_x, t\_y) =
\begin{bmatrix}
1 & 0 & t\_x \\
0 & 1 & t\_y \\
0 & 0 & 1
\end{bmatrix}
$$

Applying a translation is now a matrix multiplication:

$$
p'\_h = T \cdot p\_h
$$

Expanding:

$$
\begin{bmatrix}
1 & 0 & t\_x \\
0 & 1 & t\_y \\
0 & 0 & 1
\end{bmatrix}
\cdot
\begin{bmatrix}
x \ y \ 1
\end{bmatrix}
=

\begin{bmatrix}
x + t\_x \ y + t\_y \ 1
\end{bmatrix}
$$

This produces the translated point using multiplication only.

---

### Rotation and Scaling Fit Too

Rotation in homogeneous 2D becomes:

$$
R(\theta)=
\begin{bmatrix}
\cos\theta & -\sin\theta & 0 \\
\sin\theta & \cos\theta & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

Scaling becomes:

$$
S(s\_x, s\_y) =
\begin{bmatrix}
s\_x & 0 & 0 \\
0 & s\_y & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

All transformations now have the same 3×3 structure.

\===

# 2. The Power of Composition

Since translation, rotation, and scaling are all matrices of the same size, they can be **combined into a single transform matrix**:

$$
M = T \cdot R \cdot S
$$

Then applied in a single step:

$$
p'\_h = M \cdot p\_h
$$

This allows chaining of multiple transformations without mixing operations.

By adding one extra component and using 3×3 matrices, **every 2D transformation becomes a matrix multiplication**.\
This solves the translation issue and gives a unified, composable system for building complex transformations — essential for graphics, animation, and game engines.

The same idea extends naturally to 3D, where we add one more component and use 4×4 matrices to gain the same benefits there.

## 2.1. Order of Transformations

One last thing to notice is that **transformations must be applied in the reverse order**. What this means is that if we want to:

1. Scale the object
2. Rotate the object
3. Translate the object

We build the combined matrix in the **reverse order**:

$$
M = T \cdot R \cdot S
$$

Since vectors are multiplied on the **right**:

$$
p' = M \cdot p = (T \cdot R \cdot S) \cdot p
$$

The transformation closest to the vector (**S**) is applied first, then **R**, then **T**.

This is because matrix multiplication is evaluated **right to left** when applied to vectors:

$$
p' = T \cdot R \cdot S \cdot p
$$

Execution flow:

1. $ S \cdot p $ → scales the point
2. $ R \cdot (S \cdot p) $ → rotates the scaled point
3. $ T \cdot (...) $ → translates the rotated point

Changing the order produces a different result. Example:

$$
R \cdot T \neq T \cdot R
$$

Translating then rotating yields a different final position than rotating then translating, because rotation would also rotate the translation vector.

![](./images/img5.svg)

\===

# 3. Transformation Matrices (4×4)

Now that we saw the 2D case, everything works pretty much the same for 3D. We extend it to **4D homogenous coordinates** to allow translation as a matrix transformation.

## 3.1 Translation

$$
T =
\begin{bmatrix}
1 & 0 & 0 & t\_x \\
0 & 1 & 0 & t\_y \\
0 & 0 & 1 & t\_z \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

## 3.2 Scaling

Uniform scale ( s ):

$$
S =
\begin{bmatrix}
s & 0 & 0 & 0 \\
0 & s & 0 & 0 \\
0 & 0 & s & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

Non-uniform ( (s\_x, s\_y, s\_z) ):

$$
S =
\begin{bmatrix}
s\_x & 0 & 0 & 0 \\
0 & s\_y & 0 & 0 \\
0 & 0 & s\_z & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

## 3.3 Rotation Matrices

Rotation about **x-axis**:

$$
R\_x(\theta) =
\begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & \cos\theta & -\sin\theta & 0 \\
0 & \sin\theta & \cos\theta & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

Rotation about **y-axis**:

$$
R\_y(\theta) =
\begin{bmatrix}
\cos\theta & 0 & \sin\theta & 0 \\
0 & 1 & 0 & 0 \\
-\sin\theta & 0 & \cos\theta & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

Rotation about **z-axis**:

$$
R\_z(\theta) =
\begin{bmatrix}
\cos\theta & -\sin\theta & 0 & 0 \\
\sin\theta & \cos\theta & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

## 3.4 Combined Transform

A full rigid transform with scaling, rotation, and translation is typically:

$$
M = T \cdot R \cdot S
$$

Order matters because matrix multiplication is **not commutative**.

\===

# 4. Transform Chains

We now understand local and world spaces, how hierarchies work conceptually, and how transformations are expressed as matrices. Transform chains show how these ideas come together to compute an object’s final placement in the world.

When an object has a parent, its **local transform matrix** does not directly tell us where it is in world space. Instead, it expresses the object’s position, rotation, and scale **relative to its parent’s coordinate space**. To obtain the object’s world transform, we must include the parent’s transform as well.

## 4.1 Local → World Space

Let an object define its local transform with matrix $M\_l$.\
Its parent’s world transform is already known, denoted $M\_p$.

To compute the object’s world transform, we compose both:

$$
M\_{world} = M\_p \cdot M\_l
$$

This multiplication applies the object’s local transform first, then brings the result into the parent’s world space. Any point expressed in the object’s local coordinates can now be converted to world coordinates using $M\_{world}$.

## 4.2 Multi-Level Hierarchies

Scene hierarchies often contain several levels. In that case, each parent contributes its own transform, and all must be applied in order — from the highest parent down to the object:

$$
M\_{world} =
M\_{root} \cdot
M\_{parent\_2} \cdot
M\_{parent\_1} \cdot
M\_l
$$

For example:

Arm → Forearm → Hand

The hand’s transform is defined in **forearm-local space** — it describes how the hand is positioned and oriented relative to the forearm, not the world.
To obtain the hand’s final position in world space, its local transform must inherit the transforms of all parents in the hierarchy:

the forearm’s transform (relative to the arm)

the arm’s transform (relative to the world)

Because of this chain, when the arm rotates, the forearm and hand follow automatically. Their world matrices already include the arm’s transformation, so there is no need to manually update the child objects — the hierarchy and matrix multiplication perform the propagation for us.

![](./images/img2.svg)

## 4.3 World → Local Space

Sometimes we need to convert a world-space position back into local space — for example, to compute an offset relative to the hand, or to attach another object correctly.

Since $M\_{world}$ converts local → world, the inverse reverses the process:

$$
p\_{local} = M\_{world}^{-1} \cdot p\_{world}
$$

This removes all inherited transformations, leaving the point expressed in the object’s own coordinates.
