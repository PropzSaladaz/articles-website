---
status: "published"
date: "2026-06-11"
summary: "Build visual intuition for elliptic curves using real-number curves, Weierstrass form, smoothness, and curve points."
---

This is the first real introductory article on elliptic curves - In this article, we focus only on a smooth curve over the real numbers: which coordinate pairs belong to it, why it is symmetric, and why smoothness matters.


## What Is an Elliptic Curve?

<iframe src="simulations/ec_introduction.html" width="100%" height="600px"></iframe>

An elliptic curve is an algebraic curve: a set of coordinate pairs that satisfy a particular equation. It is not a function of $x$ in the usual sense, because one $x$ value can correspond to two $y$ values.

::: definition[The most common form used to introduce elliptic curves is the **Weierstrass form**:]
$$
y^2 = x^3 + ax + b
$$
:::

You can take a look at the animation above, showing different elliptic curves all using the same base **Weierstrass form**.
This equation describes a set of points. A point belongs to the curve if its `x` and `y` values satisfy the equation.

For example, if we have a point:

$$
P = (x, y)
$$

then `P` is on the curve if:

$$
y^2 = x^3 + ax + b
$$

is true for that point.

So an elliptic curve is not just a drawing. It is a set of valid points defined by an equation.

Let's make that concrete.

Suppose we use the curve:

$$
y^2 = x^3 - x + 1
$$

Now test the point:

$$
P = (0, 1)
$$

To check whether `P` is on the curve, we substitute `x = 0` and `y = 1` into the equation.

The left side is:

$$
y^2 = 1^2 = 1
$$

The right side is:

$$
x^3 - x + 1 = 0^3 - 0 + 1 = 1
$$

Both sides are equal, so:

$$
(0, 1)
$$

is a point on the curve.

But now test:

$$
(0, 2)
$$

The left side is:

$$
2^2 = 4
$$

while the right side is still:

$$
0^3 - 0 + 1 = 1
$$

The two sides are not equal, so `(0, 2)` is not on the curve.

This is the first important mental model:

::: definition[]
An elliptic curve is the set of all points that satisfy the curve equation.
:::


## Weierstrass Form

The equation:

$$
y^2 = x^3 + ax + b
$$

is useful because it gives us a curve with a very special structure. This structure allows us to define operations over the points of the curve.

The most important operation will be **point addition**, which we will introduce later. For now, the important idea is:

> ECC works with points that satisfy a specific curve equation.

- The curve equation defines which points are valid.
- Points that satisfy the equation are on the curve.
- Points that do not satisfy the equation are not part of the curve.


## Why the Curve Is Symmetric

You may already have noticed from the curve's graph that the curve is symmetric across the x-axis.

The reason is the left side of the equation:

$$
y^2
$$

If a value of `y` works, then `-y` also works, because squaring removes the sign:

$$
y^2 = (-y)^2
$$

So if:

$$
P = (x, y)
$$

is on the curve, then:

$$
(x, -y)
$$

is also on the curve.

Visually, this means the top and bottom halves of the curve mirror each other.

This symmetry becomes the inverse-point rule in [Point Addition and the Elliptic Curve Group](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/point-addition-and-the-elliptic-curve-group/). For now, the useful thing to remember is simple:

::: definition[]
For elliptic curves in Weierstrass form, points usually come in mirrored pairs: `(x, y)` and `(x, -y)`.
:::


## Curve Parameters: `a` and `b`

In the Weierstrass equation, the values `a` and `b` control the shape of the curve. Changing `a` and `b` changes how the curve bends and how its branches appear.

Look at the animation below. It shows how changing `a` and `b` affects the final curve:

<iframe src="simulations/ec_introduction.html" width="100%" height="600px"></iframe>

Watch the animation for a few seconds. You may notice some useful patterns:
- There is always some sort of vertical curve at the right side of the graph
- There is a continuous movement of a water droplet-like shape that:
  - Sometimes is connected to the curve on the right (curve turns blue)
  - Sometimes gets disconnected (curve turns green)

> [!WARNING]
> Not every choice of a and b gives a valid elliptic curve, as we will see later.


## Smooth vs. Singular Curves

A valid elliptic curve must be **smooth**. This means the curve must not have:

* sharp points
* cusps
* self-intersections
* singularities

For curves written in the form:

$$
y^2 = x^3 + ax + b
$$

a common smoothness condition is:

$$
4a^3 + 27b^2 \neq 0
$$

- If this **value is not zero**, the **curve is smooth**.
- If this **value is zero**, the **curve is singular**.

A singular curve may still be drawable, but it is not suitable for elliptic curve cryptography. Why? - You may ask:

> The reason is that ECC needs point operations to behave consistently. If the curve has a cusp, a crossing, or a sharp singular point, the geometric rules behind point addition break down.

At a cusp or crossing, the idea of drawing a tangent line or finding a clean third intersection can stop behaving predictably. Since point addition will depend on these geometric rules, we only want curves where those rules behave reliably.

A useful way to remember this is:

- valid elliptic curve = smooth curve + well-defined point operations
- invalid singular curve = broken shape + unreliable point operations


The animation below shows examples of valid and invalid curves. Feel free to go through the *Smooth*, *Cusp* and *Node* options to see what they look like:

<iframe src="simulations/ec_singularity.html" width="100%" height="600px"></iframe>

This distinction matters because ECC is not based only on the curve shape. It is based on the ability to perform reliable algebraic operations over the points of the curve.
So, as you can imagine, if the operations are not well defined for some curve, then ECC is also not well defined, which means we cannot use it for cryptography.

## Points on an Elliptic Curve

ECC does not work directly with arbitrary numbers. It works with **points on a curve**. So let's define what a point is. A point is written as:

$$
P = (x, y)
$$

The point belongs to the curve if it satisfies the curve equation.

For example, if the curve is:

$$
y^2 = x^3 + ax + b
$$

then a point:

$$
P = (x, y)
$$

is on the curve only if:

$$
y^2 = x^3 + ax + b
$$

is true.

This means the curve defines the set of valid points. A point that satisfies the equation is part of the curve. A point that does not satisfy the equation is not part of the curve. This is important because ECC operations are only defined over valid curve points. So: 

::: definition[The basic object in ECC is not just a number. The basic object is a **point**:]
$$
P = (x, y)
$$
:::

Once we understand these points, we can define operations over them. That is where elliptic curves start becoming useful for cryptography.



## Curves Over Real Numbers

All the elliptic curves we have seen so far are drawn over the real numbers. That means `x` and `y` can be:

* positive
* negative
* fractional
* decimal
* irrational

Visually, this gives us a smooth curve on the normal `x-y` plane. This version is useful because it lets us understand the geometry behind elliptic curves. However, real-number curves are mainly useful for intuition. They are not what cryptographic systems directly use. The reason is that cryptography needs exact and finite arithmetic.

Real numbers are continuous and include infinitely many possible values. Computers also cannot represent arbitrary real numbers exactly. So, in real cryptographic systems, elliptic curves are usually defined over **finite fields**, which we will introduce later. For now, real-number curves are useful because they make the geometry easier to see.

At this point, we know what the curve is, what a valid point is, why the curve has mirrored points, and why the curve must be smooth.

The next question is:

> Can we do arithmetic with these points?

The answer is yes. [Point Addition and the Elliptic Curve Group](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/point-addition-and-the-elliptic-curve-group/) turns this geometric picture into a complete addition rule.
