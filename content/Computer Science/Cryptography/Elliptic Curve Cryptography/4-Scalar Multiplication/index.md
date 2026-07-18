---
status: "draft"
date: "2026-06-11"
summary: "Understand scalar multiplication as repeated point addition and why reversing Q = kG is the hard problem behind ECC."
---

# 1. Scalar Multiplication

The most important operation in ECC is **scalar multiplication**. 

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
> For very large values of `k`, efficient scalar multiplication uses algorithms similar in spirit to repeated squaring.
> 
> The number of required operations grows roughly with:
> 
> $$
> \log(k)
> $$
> 
> instead of growing linearly with `k`.
> 
> This is important because real ECC private keys are very large numbers.
> 
> If scalar multiplication required `k` individual additions, ECC would be unusable in practice.
> 
> But because scalar multiplication can be computed efficiently, cryptographic systems can work with very large private keys while still computing public keys, signatures, and shared secrets quickly.

# 2. Why Reversing kG Is Hard

Now we can state the main cryptographic idea.

Given:

$$
Q = kG
$$

where:

* `G` is a known base point
* `k` is a secret scalar
* `Q` is the resulting public point

it is easy to compute `Q` if we know `k` - This is simply scalar multiplication.

But if we only know `G` and `Q`, the hard question is:

$$
k = ?
$$

In other words, given `G` and `Q`, we want to know what scalar `k` was used to produce `Q`.

This is called the **Elliptic Curve Discrete Logarithm Problem**, or **ECDLP**. The important point is that a single point addition is not the hard part.

If we know:

$$
R = P + Q
$$

and we also know `P`, then we can recover `Q` by adding the inverse of `P`:

$$
Q = R + (-P)
$$

So **point addition itself is reversible**.

The hard problem appears when point addition is repeated many times.

Given:

$$
Q = kG
$$

there is no efficient known way to recover `k` from only `G` and `Q`, assuming the curve and parameters are chosen correctly.


> [!IMPORTANT]
> There is no efficient known way to reverse scalar multiplication and recover `k` from `Q = kG`. So there isn't any nice operation like division.

There is one important detail, though. For real cryptographic systems, this hardness is not based on smooth curves over real numbers.

Cryptographic ECC uses elliptic curves over **finite fields**. The real-number curve gives us the geometric intuition. The finite-field version gives us the exact, discrete, computer-friendly structure used in real cryptography.

That is what we introduce next.
