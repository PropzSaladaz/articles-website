---
status: "published"
date: "2026-06-11"
summary: "Learn the prime-field arithmetic behind elliptic curves: modular operations, inverses, and division modulo p."
---


So far, we described elliptic curves over real numbers. That was useful because real-number curves can be drawn as smooth curves on a normal `x-y` plane. This makes the geometric ideas easier to understand:

* points on the curve
* lines through points
* tangent lines
* reflection across the x-axis
* point addition
* point doubling

However, **real-number curves are not what cryptographic systems directly use**. There are several reasons.

**First**, real numbers are continuous. Between any two real numbers, there are **infinitely many** other **real numbers**. For example, between:

$$
1 \ \text{and} \ 2
$$

we have:

$$
1.1,\ 1.01,\ 1.001,\ 1.0001,\ \ldots
$$

and infinitely many more. Cryptography needs exact arithmetic over a finite set of values.

**Second**, **computers do not represent arbitrary real numbers exactly**. Decimal and fractional values often require approximations. But cryptography cannot rely on approximate arithmetic. A tiny rounding difference could make two systems compute different results. That is unacceptable for cryptographic protocols, especially in distributed systems where many machines must independently compute the same result.

So instead of using real numbers, cryptographic elliptic curves are usually defined over **finite fields**.

::: definition[**Finite Field**]
A finite field is a finite set of values in which addition, subtraction, multiplication, and division by every non-zero value are defined, and every result remains in the set.

In ECC, a common example is the prime field:

$$
\mathbb{F}_p
$$

Read this as **“the finite field with $p$ elements.”** When $p$ is prime, its values are $0, 1, 2, \ldots, p - 1$, and arithmetic is performed modulo $p$.
:::

A finite field gives us:

* a **limited** set of values
* **exact** arithmetic
* **deterministic** results
* **efficient** computation
* a discrete structure suitable for cryptography

> [!IMPORTANT]
> Real-number curves are useful for intuition.
>
> Finite-field curves are used in real cryptography.

## Modular Arithmetic

The most common finite fields used in ECC are based on arithmetic modulo a prime number `p`. Instead of allowing all possible numbers, we restrict ourselves to the finite set:

$$
0, 1, 2, \ldots, p - 1
$$

For example, if:

$$
p = 11
$$

then the allowed values are:

$$
0, 1, 2, \ldots, 10
$$

After reaching `10`, arithmetic wraps around.

For example:

$$
18 \equiv 7 \pmod{11}
$$

because:

$$
18 = 11 + 7
$$

Similarly:

$$
20 \equiv 9 \pmod{11}
$$

because:

$$
20 = 11 + 9
$$

This is called **modular arithmetic**.

The three-line symbol `≡` is the **congruence sign**, read **“is congruent to.”**
So `20 ≡ 9 (mod 11)` says that `20` and `9` have the same remainder when divided by `11`.

A useful mental model is a clock.

On a 12-hour clock:

$$
15 \equiv 3 \pmod{12}
$$

because after 12, the values wrap around again. We actually use this everyday. Instead of saying its 15h in the 24h format, we say its 3pm. We are basically performing modular arithmetic every day without even realising!

With modulo `p`, values always stay inside:

$$
0, 1, 2, \ldots, p - 1
$$

So if a calculation produces a value outside that range, we reduce it modulo `p`.

For example:

$$
35 \equiv 2 \pmod{11}
$$

because:

$$
35 = 3 \cdot 11 + 2
$$

The remainder is `2`.

So, modulo arithmetic keeps all values inside a fixed finite set.

<iframe src="simulations/modular_clock.html" width="100%" height="560px" title="Animated clock showing modular arithmetic wrapping around modulo 12"></iframe>


## Addition, Subtraction, Multiplication Modulo $p$

In a finite field modulo `p`, normal arithmetic is replaced by modular arithmetic.

That means we perform the operation normally, and then reduce the result modulo `p`.

For example, with:

$$
p = 11
$$

addition works like this:

$$
13 + 9 = 22
$$

but:

$$
22 \equiv 0 \pmod{11}
$$

So:

$$
13 + 9 \equiv 0 \pmod{11}
$$

Subtraction works the same way.

For example:

$$
3 - 8 = -5
$$

But we want a result between `0` and `10`.

Since:

$$
-5 \equiv 6 \pmod{11}
$$

we get:

$$
3 - 8 \equiv 6 \pmod{11}
$$

Multiplication also wraps around.

For example:

$$
6 \cdot 5 = 30
$$

and:

$$
30 \equiv 8 \pmod{11}
$$

So:

$$
6 \cdot 5 \equiv 8 \pmod{11}
$$

> [!IMPORTANT]
> After every operation, reduce the result modulo `p`.

This keeps all values inside the finite field.

So when ECC works over a finite field, the curve equation is no longer interpreted as:

$$
y^2 = x^3 + ax + b
$$

over real numbers.

Instead, it becomes:

$$
y^2 \equiv x^3 + ax + b \pmod{p}
$$

That means the left side and right side only need to be equal after reducing modulo `p`.


## Division as a Modular Inverse

Division modulo `p` is the part that usually feels least intuitive.

In normal arithmetic, division asks:

$$
\frac{a}{b}
$$

But in modular arithmetic, we do not divide directly.

Instead, division is done using a **modular inverse**.

The modular inverse of `b` modulo `p` is a value $b^{-1}$ such that:

$$
b \cdot b^{-1} \equiv 1 \pmod{p}
$$

Then division by `b` is defined as multiplication by $b^{-1}$:

$$
\frac{a}{b} \equiv a \cdot b^{-1} \pmod{p}
$$

For example, let:

$$
p = 11
$$

What is the inverse of `3` modulo `11`?

We need a number `x` such that:

$$
3x \equiv 1 \pmod{11}
$$

Try:

$$
x = 4
$$

because:

$$
3 \cdot 4 = 12
$$

and:

$$
12 \equiv 1 \pmod{11}
$$

So:

$$
3^{-1} \equiv 4 \pmod{11}
$$

That means:

$$
\frac{5}{3} \equiv 5 \cdot 3^{-1} \pmod{11}
$$

So:

$$
\frac{5}{3} \equiv 5 \cdot 4 \pmod{11}
$$

$$
\frac{5}{3} \equiv 20 \pmod{11}
$$

and:

$$
20 \equiv 9 \pmod{11}
$$

So:

$$
\frac{5}{3} \equiv 9 \pmod{11}
$$

Modular inverses let ECC perform its point arithmetic exactly inside a finite field.


Now we can reinterpret the elliptic curve equation inside this finite field:

$$
y^2 \equiv x^3 + ax + b \pmod{p}
$$

This creates an elliptic curve over a finite field. Unlike the real-number version, this curve does not look like a smooth continuous line.

Instead, it looks like a set of scattered points. In the next article, we use this same field, $\mathbb{F}_{11}$, to construct every point of the curve $y^2 \equiv x^3 + x + 1 \pmod{11}$.

## Why the Modulus Is Prime

ECC commonly uses a **prime field**, written $\mathbb{F}_p$, where $p$ is prime. Primality is what makes every non-zero field element invertible.

For example, modulo $11$, every value from $1$ through $10$ has a multiplicative inverse. In particular:

$$
3 \cdot 4 = 12 \equiv 1 \pmod{11}
$$

so $4$ is the inverse of $3$.

This is not true for a composite modulus. Modulo $15$, for example, no value multiplied by $5$ gives $1$, because every product with $5$ is divisible by $5$. So $5$ has no inverse modulo $15$.

Without inverses, the divisions required by elliptic-curve point addition would not always be defined. That is why the integers modulo a prime form the field $\mathbb{F}_p$, while integers modulo a composite number generally do not.
