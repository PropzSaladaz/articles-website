---
status: "published"
date: "2026-06-11"
summary: "Learn the chord-and-tangent point addition rule, point doubling, inverse points, the point at infinity, and why curve points form a group."
---

The most important idea in ECC is that we can define an operation that behaves like addition, but over points.

This operation is called **point addition**.

Given two points `P` and `Q` on an elliptic curve, we can define another point:

$$
R = P + Q
$$

This may look strange at first. We are not adding numbers. We are adding **points**.

The useful part is that when we add two valid points on the curve, the result is also another valid point on the same curve. This gives elliptic curves a structure that we can use for cryptography.

Before discussing keys, signatures, or encryption, we first need to understand this point addition operation.



## Adding Two Different Points

Point addition is defined geometrically.

For now, consider two different points `P` and `Q` on the curve.

In the normal case, where `P` and `Q` are not vertically aligned, the rule is:

1. Draw a straight line through `P` and `Q`.
2. This line intersects the curve at one more point.
3. Reflect that third point across the x-axis.
4. The reflected point is defined as `P + Q`.

So if the third intersection point is `-R`, then:

$$
P + Q = R
$$

The reflection step may seem artificial, but it is what makes point addition behave like a proper addition operation.

Feel free to move points `P` and `Q` around in the simulation below to get an intuition on how addition works:

<iframe src="simulations/ec_point_addition.html" width="100%" height="600px"></iframe>

> [!EXERCISE]
> **Identifying special cases**
>
> Try moving `P` and `Q` around in the simulation.
>
> Two special cases are especially important:
>
> 1. Move `Q` closer and closer to `P`. As both points approach the same position, the line through them becomes the tangent line at `P`. This gives us **point doubling**.
> 2. Place `P` and `Q` at the same `x` coordinate, but with opposite `y` coordinates. The line through them becomes vertical. This gives us the **point at infinity**.
>
> Both cases are explained next.



## Point Doubling

Point doubling is the special case where we add a point to itself:

$$
P + P = 2P
$$

When the two points are different, we can draw a line through them.

But when both points are the same, there are not two distinct points to connect with a line. Instead, we use the **tangent line** at that point.

The rule for point doubling is:

1. Draw the tangent line at `P`.
2. The tangent line intersects the curve at another point.
3. Reflect that point across the x-axis.
4. The reflected point is defined as `2P`.

So:

$$
2P = P + P
$$

<iframe src="simulations/ec_point_doubling.html" width="100%" height="600px"></iframe>

Point doubling is important because scalar multiplication is built using repeated point addition and point doubling.



## Inverse Points

There is one important special case in point addition: adding a point to its opposite.

For every point `P` on the curve, there is another point called its **inverse point**, written as `-P`.

::: definition[**Inverse Point**]

The inverse point of `P` is the point that cancels `P` under elliptic curve addition.

That means:

$$
P + (-P) = \mathcal{O}
$$

where $\mathcal{O}$ is the **point at infinity**.
:::

Geometrically, over the real numbers, if:

$$
P = (x, y)
$$

then:

$$
-P = (x, -y)
$$

So `P` and `-P` have the same `x` coordinate, but opposite `y` coordinates.

They are reflections of each other across the x-axis.

Now consider adding them:

$$
P + (-P)
$$

The line through `P` and `-P` is vertical.

In the normal point addition rule, we draw a line through two points, find the third intersection with the curve, and reflect that point across the x-axis.

But a vertical line does not give us a normal visible third point on the 2D graph.

This is the case where the usual geometric picture needs one extra object.

That object is the **point at infinity**.


## The Point at Infinity

To make the addition rule complete, we define the result of adding a point to its inverse as a special point called the **point at infinity**, written as:

$$
\mathcal{O}
$$

So:

$$
P + (-P) = \mathcal{O}
$$

::: definition[**Point at Infinity**]

The point at infinity, written $\mathcal{O}$, is the special point that acts like zero in elliptic curve addition.

It is not a normal visible point on the 2D graph. It is an abstract point added to the curve so that point addition always has a valid result.

:::

Just like zero does nothing in normal addition:

$$
x + 0 = x
$$

the point at infinity does nothing in elliptic curve addition:

$$
P + \mathcal{O} = P
$$

and:

$$
\mathcal{O} + P = P
$$

So $\mathcal{O}$ is the identity element of elliptic curve addition.

At this point, we have the full basic point addition rule.

For normal point addition:

$$
P + Q = R
$$

For point doubling:

$$
P + P = 2P
$$

For inverse points:

$$
P + (-P) = \mathcal{O}
$$

For the identity point:

$$
P + \mathcal{O} = P
$$

These rules are not just separate tricks. Together, they form a consistent algebraic structure.

That structure is called a **group**.


## Elliptic Curve as a Group

A **group** is a set of values together with an operation that combines two values and produces another value from the same set.

A simple example is normal integer addition:

| Component | Example  |
| --------- | -------- |
| Set       | Integers |
| Operation | Addition |

For example:

$$
3 + 5 = 8
$$

The result is still an integer.

Integer addition also has an identity element:

$$
0
$$

because adding zero does not change the value:

$$
x + 0 = x
$$

Every integer also has an inverse.

For example, the inverse of `5` is `-5`, because:

$$
5 + (-5) = 0
$$

So, at a high level, a group is a system where:

* values can be combined
* the result stays inside the same system
* there is an identity element
* every value has an inverse
* repeated operations behave consistently

Elliptic curve points behave in a similar way, except the values are not ordinary numbers:

* Values are **points**.
* The operation is **point addition**.

## The Elliptic Curve Group

For an elliptic curve, the group is made from all valid points on the curve, plus the point at infinity $\mathcal{O}$.

The operation is **point addition**.

So an elliptic curve group contains:

* normal curve points
* the special point at infinity $\mathcal{O}$
* the point addition operation

The group is usually written as:

$$
E
$$

or, when we want to be more explicit:

$$
E(\mathbb{R})
$$

This means the set of points on the elliptic curve over the real numbers. For now, we are still thinking geometrically, over real numbers.

Later, when we move to finite fields, we will write something like:

$$
E(\mathbb{F}_p)
$$

This means the set of points on the elliptic curve over the finite field modulo `p`.

> [!IMPORTANT]
> An elliptic curve group is the set of all valid points on an elliptic curve, together with the point at infinity, using point addition as the group operation.

So when we say that elliptic curve points form a group, we mean that the points can be added together in a complete and consistent way.


## Closure, Identity, Inverses, Associativity

Groups have some rules that we have not discussed directly. You have probably already built intuition for them, but it is useful to name them explicitly:

::: definition[**Group Rules**]
| Rule          | Meaning in elliptic curve addition                                  |
| ------------- | ------------------------------------------------------------------- |
| Closure       | If `P` and `Q` are valid points, then `P + Q` is also a valid point |
| Identity      | There is a point $\mathcal{O}$ such that $P + \mathcal{O} = P$    |
| Inverse       | Every point $P$ has an inverse $-P$ such that $P + (-P) = \mathcal{O}$ |
| Associativity | `(P + Q) + R = P + (Q + R)`                                         |
:::

The first three rules should now feel familiar.

**Closure** means point addition never leaves the curve.

If:

$$
P
$$

and:

$$
Q
$$

are points on the curve, then:

$$
P + Q = R
$$

where `R` is also a point on the same curve. So point addition does not produce some unrelated object. It produces another valid curve point.

**Identity** means the point at infinity behaves like zero:

$$
P + \mathcal{O} = P
$$

Adding $\mathcal{O}$ does not change the point.

**Inverse** means every point has another point that cancels it:

$$
P + (-P) = \mathcal{O}
$$

Over the real numbers, if:

$$
P = (x, y)
$$

then:

$$
-P = (x, -y)
$$

The inverse point is the reflection of `P` across the x-axis.

The least visible rule is **associativity**.

Associativity means that when we add several points, the grouping does not change the final result.

For example:

$$
(P + Q) + R = P + (Q + R)
$$

This matters because later we will repeatedly add the same point many times.

For example:

$$
3P = P + P + P
$$

Because of associativity, we do not need to worry about whether this means:

$$
(P + P) + P
$$

or:

$$
P + (P + P)
$$

Both give the same result. This is what makes repeated point addition well-defined.


## Why the Group Structure Matters

You may be asking - why is all this group stuff important? - The group structure matters because ECC is not based only on drawing curves - It is based on doing arithmetic with curve points.

Without the group structure, point addition would just be a geometric trick. With the group structure, point addition becomes a reliable algebraic operation. This lets us build more complex operations from simple ones.

The most important one is **scalar multiplication**. Scalar multiplication means adding a point to itself repeatedly:

$$
kP = P + P + \cdots + P
$$

This only makes sense because point addition is consistent.

The group structure guarantees that:

- Adding valid points produces valid points
- There is a zero-like point $\mathcal{O}$
- Every point has an inverse
- Repeated addition always gives the same result, regardless of how the additions are grouped

> [!IMPORTANT]
> Elliptic curve points form a group because point addition behaves like a complete and consistent addition system.

This group structure is what allows ECC to build public keys from repeated point addition:

$$
Q = kG
$$

where:

* `k` is a scalar
* `G` is a base point
* `Q` is another point in the same elliptic curve group

Next, [Scalar Multiplication](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/scalar-multiplication/) turns repeated point addition into the operation used throughout ECC.
