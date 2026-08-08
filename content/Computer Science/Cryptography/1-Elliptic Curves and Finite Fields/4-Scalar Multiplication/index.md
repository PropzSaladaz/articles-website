---
status: "published"
date: "2026-06-11"
summary: "Understand scalar multiplication as repeated point addition and the efficient doubling methods that make large finite-field calculations practical."
---

In [Point Addition and the Elliptic Curve Group](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/point-addition-and-the-elliptic-curve-group/), we defined a reliable addition rule for curve points. The most important operation built from that rule is **scalar multiplication**.

::: definition[**Scalar Multiplication:**]
Scalar multiplication means adding the same point to itself repeatedly.

For example:

$$
3P = P + P + P
$$

and:

$$
5P = P + P + P + P + P
$$

More generally:

$$
kP = P + P + \cdots + P
$$

where:

* `P` is a point on the curve
* `k` is an integer
* `kP` is another point on the same curve

:::

The value `k` is called a **scalar**. So scalar multiplication does not mean multiplying the coordinates of the point by `k`. It means adding the point `P` to itself `k` times.

For example, if:

$$
P = (x, y)
$$

then:

$$
3P
$$

does **not** mean:

$$
(3x, 3y)
$$

That is not elliptic curve scalar multiplication.

Instead:

$$
3P = P + P + P
$$

where each `+` is elliptic curve point addition.

> [!IMPORTANT]
> Scalar multiplication is repeated point addition, not coordinate multiplication.

> [!EXAMPLE]
> **Computing 3P**
> 
> 
> Let us compute a simple example:
> 
> $$
> 3P
> $$
> 
> This can be written as:
> 
> $$
> 3P = 2P + P
> $$
> 
> So we compute it in two steps.
> 
> First, compute:
> 
> $$
> 2P = P + P
> $$
> 
> This uses point doubling.
> 
> We draw the tangent line at `P`, find the next intersection with the curve, and reflect it across the x-axis.
> 
> Then we compute:
> 
> $$
> 3P = 2P + P
> $$
> 
> This uses normal point addition.
> 
> We draw a line through `P` and `2P`, find the third intersection with the curve, and reflect it across the x-axis.
> 
> The final result is the point:
> 
> $$
> 3P
> $$
> 
> This example shows the basic idea behind scalar multiplication: we keep using point addition and point doubling to move from one curve point to another.
> 
> <iframe src="simulations/ec_3p_example.html" width="50%" height="400px"></iframe>



> [!TIP]
> **Efficient Scalar Multiplication**
> 
> Scalar multiplication is not computed by literally adding the same point one by one.
> 
> For example, to compute:
> 
> $$
> 5P
> $$
> 
> we do not usually compute:
> 
> $$
> P + P + P + P + P
> $$
> 
> Instead, we use point doubling to reduce the number of operations.
> 
> For example:
> 
> $$
> 5P = 4P + P
> $$
> 
> and:
> 
> $$
> 4P = 2P + 2P
> $$
> 
> and:
> 
> $$
> 2P = P + P
> $$
> 
> So we can compute `5P` like this:
> 
> 1. Compute `2P`
> 2. Compute `4P = 2P + 2P`
> 3. Compute `5P = 4P + P`
> 
> This takes fewer operations than adding `P` five times.
> 
> For very large values of `k`, efficient scalar multiplication uses **double-and-add**, an algorithm similar in spirit to repeated squaring. It reads the binary representation of the scalar from left to right: double the running point for each bit, then add $P$ when the bit is $1$.
>
> For example:
>
> $$
> 13 = (1101)_2
> $$
>
> Starting from $\mathcal{O}$, the steps are:
>
> 1. Read `1`: $\mathcal{O} + P = P$
> 2. Read `1`: double to $2P$, then add $P$ to get $3P$
> 3. Read `0`: double to $6P$
> 4. Read `1`: double to $12P$, then add $P$ to get $13P$
>
> After initializing the running point as $P$, this computes $13P$ with three doublings and two further additions, rather than twelve point additions.
> 
> The number of required operations grows roughly with $\log_2 k$, instead of growing linearly with $k$.
> 
> This is important because finite-field scalar calculations use very large numbers.
> 
> If scalar multiplication required `k` individual additions, ECC would be unusable in practice.
> 
> Efficient scalar multiplication makes it practical to work with large scalars even though they represent many repeated point additions.

## From Repeated Addition to Finite Arithmetic

The smooth real-number curve gives us a useful way to see point addition and doubling. The next step is to change the number system beneath the same ideas.

Cryptographic curves are interpreted over finite fields, where coordinates and arithmetic are discrete and exact. There, scalar multiplication still means repeated point addition, but the possible points form a finite set rather than a continuous curve.

Next, [Finite Fields and Modular Arithmetic](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/finite-fields-and-modular-arithmetic/) establishes the exact arithmetic that replaces the real-number geometry. The following article then constructs the resulting finite point set.
