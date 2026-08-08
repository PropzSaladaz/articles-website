---
status: "published"
date: "2026-06-11"
summary: "Construct a finite-field elliptic curve point set, add its points with modular formulas, and connect the resulting group to cryptographic parameters."
---

The previous article established arithmetic in $\mathbb{F}_{11}$. We now use that arithmetic to construct the points of one elliptic curve over the field, then add those points directly.

Throughout this article, the running example is

$$
y^2 \equiv x^3 + x + 1 \pmod{11}.
$$

Before building it step by step, take a look at what the so called point cloud looks like:

<iframe src="simulations/finite_field_point_cloud.html" width="100%" height="500px" title="Finite-field elliptic curve shown as a cloud of points over F11"></iframe>

You don't need to understand it right now. This is the final result that we are aiming to achieve throughout this article. This animation is merely to build some intuition of what the final result should be - a point cloud.

Some preliminary things you may have already noticed:
- The axes list the field representatives $0$ through $10$. 
- Some $x$ values have no corresponding $y$ value, most valid $x$ values have two $y$ values related by $y \mapsto -y \bmod 11$, and the point $(2,0)$ has only one corresponding $y$.

The choice $p = 11$ keeps the field small enough to visualize while still defining a nonsingular elliptic curve. By the end of this article, we will reconstruct its 13 plotted affine points, add the point at infinity, and use the complete 14-element group for point addition.

> [!NOTE]
> Recall that $\mathbb{F}_{11}$ means arithmetic modulo $11$. Its elements are the representatives $0$ through $10$, and every operation is reduced modulo $11$.

Next, we go step by step from the elliptic curve equation we have been seing so far, until we end up with the exact same result as above.


## Start with an Elliptic Curve Over the Real Numbers

Consider the equation

$$
y^2 = x^3 + x + 1
$$

Over the real numbers, where $x$ and $y$ may take any real value. For each chosen $x$, we first compute the right side:

$$
x^3 + x + 1
$$

Whenever this value is non-negative, the corresponding real $y$-coordinates are

$$
y = \pm\sqrt{x^3 + x + 1}
$$

This produces two branches that are symmetric about the horizontal axis:

$$
(x,y)
\qquad\text{and}\qquad
(x,-y)
$$

The result is the familiar smooth elliptic-curve shape.

> The curve is continuous because the underlying coordinate system is $\mathbb{R}^2$. Between any two real coordinate values, infinitely many other real values exist.

<iframe src="simulations/real_curve_branches.html" width="100%" height="520px" title="Animated real-number elliptic curve with continuous upper and lower branches"></iframe>


## Replace the Infinite Coordinate Plane with a Finite Coordinate Set

Since we are primarily interested in elliptic curves over a finite field, we will want to convert the real number curve into a finite set of points.

So we first restrict the inputs $x$ and $y$ to **not come from real numbers**, but from **natural numbers over some modulo $p$ - giving us a finite field**:

$$
\mathbb{F}_p
$$

containing the $p$ values

$$
0, 1, 2, \ldots, p - 1
$$

For the running example,

$$
p = 11
$$

the possible coordinate representatives are

$$
0, 1, 2, \ldots, 10
$$

So both $x$ and $y$ must now come from this finite set. Visually, we can introduce a finite $11 \times 11$ coordinate grid:

$$
0 \le x < 11
\qquad
0 \le y < 11
$$

The real curve may remain visible in the background as a reference, but the square should not be interpreted as a literal crop of the real curve.

> The finite-field curve is not the part of the real curve that happens to lie inside this square. The square only represents the available coordinate values in $\mathbb{F}_{11}$.

<iframe src="simulations/finite_coordinate_window.html" width="100%" height="520px" title="Animation showing the finite F11 coordinate window over a faint real elliptic curve"></iframe>

## Restrict the Input $x$ to Field Elements

Over the real numbers, $x$ can vary continuously.

Over $\mathbb{F}_{11}$, there are only eleven possible values:

$$
x \in \{0, 1, \ldots, 10\}
$$

Define the right-hand-side polynomial

$$
f(x) = x^3 + x + 1
$$

We now evaluate $f(x)$ once for every possible field element $x$.

For example:

$$
\begin{aligned}
f(0) &= 1 \\
f(1) &= 3 \\
f(2) &= 11 \\
f(3) &= 31 \\
f(4) &= 69
\end{aligned}
$$

At this stage, these are still ordinary integer results. Some lie inside the range $0$ to $10$, while others are much larger.

The important transition is that the continuous input axis has become a finite collection of discrete columns.

<iframe src="simulations/ordinary_polynomial_outputs.html" width="100%" height="500px" title="Animation showing ordinary polynomial outputs for discrete F11 input values"></iframe>

## Reduce the Right-Hand Side Modulo $p$

The coordinates and arithmetic now belong to $\mathbb{F}_{11}$, so every polynomial result must be reduced modulo $11$.

Define

$$
\operatorname{rhs}(x) = (x^3 + x + 1) \bmod 11
$$

For the previous values:

$$
\begin{aligned}
\operatorname{rhs}(0) &= 1 \\
\operatorname{rhs}(1) &= 3 \\
\operatorname{rhs}(2) &= 11 \bmod 11 = 0 \\
\operatorname{rhs}(3) &= 31 \bmod 11 = 9 \\
\operatorname{rhs}(4) &= 69 \bmod 11 = 3
\end{aligned}
$$

Modulo reduction replaces every integer with its representative in

$$
0, 1, \ldots, 10
$$

A useful visual model is to move each temporary polynomial value vertically by a multiple of $11$ until it enters the finite coordinate window.

The resulting markers are the points

$$
\bigl(x, \operatorname{rhs}(x)\bigr)
$$

These markers show the modular value of the **right-hand side** for every possible $x$.

They are not yet the elliptic-curve points.

> This is the only part that resembles “wrapping.” We are wrapping discrete polynomial outputs modulo $p$, not wrapping the continuous real curve itself.

<iframe src="simulations/modular_rhs_reduction.html" width="100%" height="520px" title="Animation reducing ordinary polynomial outputs modulo 11 into finite-field right-hand-side values"></iframe>

## Compute the Possible Values of $y^2$

The left-hand side of the elliptic-curve equation is

$$
y^2
$$

We must therefore evaluate

$$
\operatorname{lhs}(y) = y^2 \bmod 11
$$

for every possible value

$$
y \in \{0, 1, \ldots, 10\}
$$

The first few results are:

$$
\begin{aligned}
0^2 \bmod 11 &= 0 \\
1^2 \bmod 11 &= 1 \\
2^2 \bmod 11 &= 4 \\
3^2 \bmod 11 &= 9 \\
4^2 \bmod 11 &= 5 \\
5^2 \bmod 11 &= 3 \\
6^2 \bmod 11 &= 3 \\
7^2 \bmod 11 &= 5 \\
8^2 \bmod 11 &= 9 \\
9^2 \bmod 11 &= 4 \\
10^2 \bmod 11 &= 1
\end{aligned}
$$

The values mirror after $y = 5$:

$$
5^2 \bmod 11 = 6^2 \bmod 11 = 3
\qquad
4^2 \bmod 11 = 7^2 \bmod 11 = 5
\qquad
3^2 \bmod 11 = 8^2 \bmod 11 = 9
$$

These repeated values are why one right-hand-side residue can produce two valid $y$-coordinates.

This happens because

$$
(-y)^2 = y^2
$$

In modular arithmetic,

$$
-y \bmod p = p - y
$$

so $y$ and $p - y$ produce the same square.

The values that can be written as $y^2 \bmod p$ are called **quadratic residues modulo $p$**.

Not every field element is a quadratic residue. Therefore, not every right-hand-side value can correspond to a valid elliptic-curve point.

<iframe src="simulations/quadratic_residue_map.html" width="100%" height="520px" title="Animation mapping each y in F11 to its square modulo 11"></iframe>

## Match the Left-Hand Side with the Right-Hand Side

A coordinate pair $(x, y)$ belongs to the finite-field curve exactly when

$$
y^2 \equiv x^3 + x + 1 \pmod{11}
$$

Using the helper functions introduced above, this condition is

$$
\operatorname{lhs}(y) = \operatorname{rhs}(x)
$$

Consider $x = 3$.

The right-hand side is

$$
\begin{aligned}
\operatorname{rhs}(3) &= \bigl(3^3 + 3 + 1\bigr) \bmod 11 \\
&= 9
\end{aligned}
$$

We now search for values of $y$ satisfying

$$
y^2 \equiv 9 \pmod{11}
$$

There are two solutions:

$$
3^2 = 9 \equiv 9 \pmod{11}
$$

and

$$
8^2 = 64 \equiv 9 \pmod{11}
$$

Therefore, the finite-field curve contains the two points

$$
(3,3)
\qquad\text{and}\qquad
(3,8)
$$

For another $x$, the right-hand-side residue may have:

* two corresponding $y$-values;
* one corresponding $y$-value in the special case $y = 0$;
* no corresponding $y$-value when the residue is not a quadratic residue.

:::outcomes[How a right-hand-side residue determines the number of curve points]
Right-hand-side residue $r$

- **Non-zero quadratic residue**: Two curve points, $(x, y)$ and $(x, p - y)$
- **$r = 0$**: One curve point, $(x, 0)$
- **Non-residue**: No curve point for this $x$
:::

<iframe src="simulations/match_lhs_rhs.html" width="100%" height="520px" title="Animation matching square residues with the right-hand-side value for x equals 3"></iframe>

## Repeat the Matching Process for Every $x$

The construction is now repeated for every possible value

$$
x \in \{0, 1, \ldots, 10\}
$$

For each $x$:

1. Compute

   $$
   r = (x^3 + x + 1) \bmod 11
   $$

2. Find every $y$ such that

   $$
   y^2 \bmod 11 = r
   $$

3. Add the corresponding coordinate pairs $(x, y)$.

Equivalently, the complete finite-field curve is

$$
E(\mathbb{F}_{11}) =
\left\{
  (x, y) \in \mathbb{F}_{11}^2
  \;\middle|\;
  y^2 \equiv x^3 + x + 1 \pmod{11}
\right\}
\cup \{\mathcal{O}\}
$$

Here, $\mathcal{O}$ is the point at infinity used as the identity element for elliptic-curve point addition. It is part of the mathematical group, but it does not appear as an ordinary point in the two-dimensional coordinate grid.

<iframe src="simulations/build_full_point_cloud.html" width="100%" height="520px" title="Animation building every point of the elliptic curve over F11"></iframe>

The plot contains $13$ ordinary, or **affine**, points. The full elliptic-curve group also includes $\mathcal{O}$, so

$$
\#E(\mathbb{F}_{11}) = 13 + 1 = 14.
$$

## The Final Finite-Field Elliptic Curve

After all matches have been collected, the continuous real curve has disappeared. What remains is a finite set of isolated points.

This point cloud is the affine part of the elliptic curve over $\mathbb{F}_{11}$ — the same 13-point cloud shown in the preview at the start of the article. Adding $\mathcal{O}$ gives the complete 14-element group used for point addition.

It looks unrelated to the smooth real curve because the underlying coordinate system and arithmetic have changed:

| Real-number curve                    | Finite-field curve                   |
| ------------------------------------ | ------------------------------------ |
| Coordinates belong to $\mathbb{R}$   | Coordinates belong to $\mathbb{F}_p$ |
| Infinitely many possible coordinates | Exactly $p$ possible values per axis |
| Ordinary arithmetic                  | Arithmetic modulo $p$                |
| Smooth and continuous                | Finite and discrete                  |
| Visual geometric curve               | Algebraically defined point set      |

The defining equation is structurally the same:

$$
y^2 = x^3 + ax + b
$$

What changes is the number system in which the equation is interpreted.

## Why the Points Appear in Symmetric Pairs

Suppose $(x, y)$ satisfies the curve equation:

$$
y^2 \equiv x^3 + ax + b \pmod{p}
$$

Because

$$
(-y)^2 = y^2
$$

the point

$$
(x, -y)
$$

also satisfies the equation.

Inside $\mathbb{F}_p$, the additive inverse of $y$ is represented by

$$
p - y
$$

Therefore, finite-field points usually occur in pairs:

$$
(x,y)
\qquad\text{and}\qquad
(x, p-y)
$$

For example, with $p = 11$,

$$
3 + 8 = 11 \equiv 0 \pmod{11}
$$

Thus $8$ is the modular additive inverse of $3$, and the points

$$
(3,3)
\qquad\text{and}\qquad
(3,8)
$$

form a symmetric pair.

The visual symmetry lies around the middle of the coordinate range, but its mathematical cause is modular additive inversion—not ordinary reflection geometry.


## What Modulo Does—and Does Not Do

It is useful to distinguish three different ideas.

### Modulo does

* restrict coordinates to the representatives $0, \ldots, p - 1$;
* reduce polynomial results into that range;
* define addition, subtraction, multiplication, and division inside $\mathbb{F}_p$;
* determine which coordinate pairs satisfy the elliptic-curve equation.

### Modulo does not

* crop the real elliptic curve;
* round real-valued curve points to integers;
* sample points directly from the real curve;
* fold the entire continuous curve into a square.

The real and finite-field plots are two visualizations of the same algebraic equation interpreted over different number systems.

The real curve provides useful geometric intuition, but the finite-field point set must be computed directly using modular arithmetic.


## Point Addition Over a Finite Field

The chord-and-tangent picture from the real-number curve is useful intuition, but it is not a literal construction over $\mathbb{F}_p$. There is no continuous curve or ordinary straight line to draw through the finite point cloud.

Instead, the same group law is defined algebraically with finite-field arithmetic. For a short Weierstrass curve over a prime field with $p > 3$, let

$$
P=(x_1,y_1)
\qquad\text{and}\qquad
Q=(x_2,y_2).
$$

When $P \ne Q$ and $x_1 \ne x_2$, calculate the slope using a modular inverse:

$$
\lambda = (y_2-y_1)(x_2-x_1)^{-1} \pmod p.
$$

Then the sum is $P+Q=(x_3,y_3)$, where

$$
\begin{aligned}
x_3 &= \lambda^2-x_1-x_2 \pmod p, \\
y_3 &= \lambda(x_1-x_3)-y_1 \pmod p.
\end{aligned}
$$

If $P$ and $Q$ have the same $x$-coordinate but are different points, then $Q=-P$ and:

$$
P+Q=\mathcal{O}.
$$

For point doubling, when $P=Q$ and $y_1 \ne 0$, use:

$$
\lambda=(3x_1^2+a)(2y_1)^{-1}\pmod p,
$$

followed by the same formulas for $x_3$ and $y_3$. If $y_1=0$, then $P=-P$, so:

$$
2P=\mathcal{O}.
$$

> [!IMPORTANT]
> Division in these formulas means multiplication by a modular inverse. The denominator must be non-zero; the exceptional cases above handle the times when it is zero.

> [!EXAMPLE]
> **Doubling a point in $E(\mathbb{F}_{11})$**
>
> On the running curve, $a=1$ and $P=(1,5)$. Because $10^{-1}\equiv10\pmod{11}$:
>
> $$
> \lambda=(3\cdot1^2+1)(2\cdot5)^{-1}
> =4\cdot10
> \equiv7\pmod{11}.
> $$
>
> Therefore:
>
> $$
> \begin{aligned}
> x_3&=7^2-1-1\equiv3\pmod{11},\\
> y_3&=7(1-3)-5\equiv3\pmod{11}.
> \end{aligned}
> $$
>
> So $2(1,5)=(3,3)$. Adding $(1,5)$ to $(3,3)$ with the distinct-point formula gives $3(1,5)=(8,2)$.

These formulas produce the same abstract group operation introduced earlier. Together with $\mathcal{O}$, the points of a nonsingular finite-field curve form an abelian group, even though the real-number geometric construction is no longer literal.

<iframe src="simulations/doubling_over_f11.html" width="100%" height="620px" title="Animated modular calculation of 2(1,5) equals (3,3) over the finite field F11"></iframe>

## Nonsingular Curves

Choosing a prime modulus does not mean that every curve is automatically suitable. The curve must also be nonsingular.

For a short Weierstrass curve

$$
y^2 = x^3 + ax + b
$$

over a field of characteristic greater than $3$, the nonsingularity condition is

$$
4a^3 + 27b^2 \not\equiv 0 \pmod{p}
$$

For the running example,

$$
a = 1, \qquad b = 1, \qquad p = 11
$$

we obtain

$$
4(1^3) + 27(1^2) = 31 \equiv 9 \pmod{11}
$$

which is nonzero. Therefore, the curve is nonsingular over $\mathbb{F}_{11}$.

## Complete Construction Algorithm

The full point set can be computed directly with the following procedure:

```text
points = []

for x in 0 .. p-1:
    rhs = (x^3 + a*x + b) mod p

    for y in 0 .. p-1:
        lhs = y^2 mod p

        if lhs == rhs:
            points.append((x, y))
```

## From This Toy Cloud to Production Curves

Our running example uses $p = 11$ so that every calculation and every point fits on the page. It is useful for learning, but it offers no security: anyone can enumerate its tiny field, list its curve points, and try every possible scalar.

Production ECC uses exactly the same ideas—evaluate an elliptic-curve equation over a finite field and add its points with finite-field arithmetic—but with a published parameter set and a much larger prime. The remaining public parameters that turn the group into a key system are introduced in the next article.

For example, the real-number graph of

$$
y^2 = x^3 + 7
$$

is a smooth curve. The production curve **secp256k1** uses that same polynomial over the finite field

$$
p = 2^{256} - 2^{32} - 977
$$

so its defining equation is

$$
y^2 \equiv x^3 + 7 \pmod{p}
$$

The construction is the same as our $p = 11$ point cloud, but the scale is completely different.

| Production curve | Field size | Equation form | Notes |
| --- | --- | --- | --- |
| [secp256k1](https://www.secg.org/sec2-v2.pdf) | $p = 2^{256} - 2^{32} - 977$ | $y^2 \equiv x^3 + 7 \pmod{p}$ | A short-Weierstrass curve, like the form used in this article. |
| [P-256 / secp256r1](https://www.secg.org/sec2-v2.pdf) | a 256-bit prime field | $y^2 \equiv x^3 - 3x + b \pmod{p}$ | Another standardized short-Weierstrass parameter set. |
| [Curve25519](https://www.rfc-editor.org/rfc/rfc7748.html) | $p = 2^{255} - 19$ | $v^2 \equiv u^3 + 486662u^2 + u \pmod{p}$ | Uses the Montgomery form rather than the short-Weierstrass form. |

With $p = 11$, the coordinate grid has only

$$
11^2 = 121
$$

possible coordinate pairs, and our curve has only $13$ ordinary points. For a roughly 256-bit production field, the coordinate grid has about $2^{512}$ possible locations and the curve has on the order of $2^{256}$ points. A literal point-by-point plot would therefore look like a dense square or noise, not like the sparse cloud above.

The graph below draws a tiny, genuine sample of secp256k1 points. The coordinates are scaled down for display; it is not the complete point cloud.

<iframe src="simulations/secp256k1_point_sample.html" width="100%" height="520px" title="Scaled sample of genuine points on the secp256k1 elliptic curve"></iframe>

The large modulus is not only about making the picture bigger. Together with a carefully selected curve and a large prime-order subgroup, it makes recovering a secret scalar from a public point computationally infeasible. A 256-bit field is commonly chosen to target roughly 128 bits of classical security.

> A large prime alone is not enough. Real systems use vetted, standardized curve parameters and must validate points and handle scalar arithmetic correctly.

## Summary

The path from the real elliptic curve to the finite-field point cloud is:

:::flow[The construction of a finite-field point cloud from a continuous real curve]
- Continuous real curve
- Finite coordinate set
- Discrete $x$ inputs
- RHS modulo $p$
- Quadratic residues
- Matching residues
- Finite point cloud
:::

The cloud is not a distorted image of the real curve.

It is the complete set of coordinate pairs in $\mathbb{F}_p^2$ that satisfy the same algebraic equation under modular arithmetic.
