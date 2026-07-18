---
status: "draft"
date: "2026-06-11"
summary: "Move from smooth real-number curves to exact finite-field arithmetic using modular arithmetic and modular inverses."
---


# 1. Why Cryptography Does Not Use Real Numbers

So far, we described elliptic curves over real numbers. That was useful because real-number curves can be drawn as smooth curves on a normal `x-y` plane. This makes the geometric ideas easier to understand:

* points on the curve
* lines through points
* tangent lines
* reflection across the x-axis
* point addition
* point doubling

However, real-number curves are not what cryptographic systems directly use. There are several reasons.

First, real numbers are continuous. Between any two real numbers, there are infinitely many other real numbers. For example, between:

$$
1
$$

and:

$$
2
$$

we have:

$$
1.1,\ 1.01,\ 1.001,\ 1.0001,\ \ldots
$$

and infinitely many more. Cryptography needs exact arithmetic over a finite set of values.

Second, computers do not represent arbitrary real numbers exactly. Decimal and fractional values often require approximations. But cryptography cannot rely on approximate arithmetic. A tiny rounding difference could make two systems compute different results. That is unacceptable for cryptographic protocols, especially in distributed systems where many machines must independently compute the same result.

So instead of using real numbers, cryptographic elliptic curves are usually defined over **finite fields**.

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


# 2. Modular Arithmetic

The most common finite fields used in ECC are based on arithmetic modulo a prime number `p`. Instead of allowing all possible numbers, we restrict ourselves to the finite set:

$$
0, 1, 2, \ldots, p - 1
$$

For example, if:

$$
p = 17
$$

then the allowed values are:

$$
0, 1, 2, \ldots, 16
$$

After reaching `16`, arithmetic wraps around.

For example:

$$
18 \equiv 1 \pmod{17}
$$

because:

$$
18 = 17 + 1
$$

Similarly:

$$
20 \equiv 3 \pmod{17}
$$

because:

$$
20 = 17 + 3
$$

This is called **modular arithmetic**.

A useful mental model is a clock.

On a 12-hour clock:

$$
10 + 5 \equiv 3 \pmod{12}
$$

because after 12, the values wrap around again.

Modulo arithmetic works in the same general way.

With modulo `p`, values always stay inside:

$$
0, 1, 2, \ldots, p - 1
$$

So if a calculation produces a value outside that range, we reduce it modulo `p`.

For example:

$$
35 \equiv 1 \pmod{17}
$$

because:

$$
35 = 2 \cdot 17 + 1
$$

The remainder is `1`.

So, modulo arithmetic keeps all values inside a fixed finite set.


# 3. Addition, Subtraction, Multiplication Modulo p

In a finite field modulo `p`, normal arithmetic is replaced by modular arithmetic.

That means we perform the operation normally, and then reduce the result modulo `p`.

For example, with:

$$
p = 17
$$

addition works like this:

$$
13 + 9 = 22
$$

but:

$$
22 \equiv 5 \pmod{17}
$$

So:

$$
13 + 9 \equiv 5 \pmod{17}
$$

Subtraction works the same way.

For example:

$$
3 - 8 = -5
$$

But we want a result between `0` and `16`.

Since:

$$
-5 \equiv 12 \pmod{17}
$$

we get:

$$
3 - 8 \equiv 12 \pmod{17}
$$

Multiplication also wraps around.

For example:

$$
6 \cdot 5 = 30
$$

and:

$$
30 \equiv 13 \pmod{17}
$$

So:

$$
6 \cdot 5 \equiv 13 \pmod{17}
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
y^2 \equiv x^3 + ax + b \pmod p
$$

That means the left side and right side only need to be equal after reducing modulo `p`.


# 4. Division as Modular Inverse

Division modulo `p` is the part that usually feels least intuitive.

In normal arithmetic, division asks:

$$
\frac{a}{b}
$$

But in modular arithmetic, we do not divide directly.

Instead, division is done using a **modular inverse**.

The modular inverse of `b` modulo `p` is a value $b^{-1}$ such that:

$$
b \cdot b^{-1} \equiv 1 \pmod p
$$

Then division by `b` is defined as multiplication by $b^{-1}$:

$$
\frac{a}{b} \equiv a \cdot b^{-1} \pmod p
$$

For example, let:

$$
p = 17
$$

What is the inverse of `5` modulo `17`?

We need a number `x` such that:

$$
5x \equiv 1 \pmod{17}
$$

Try:

$$
x = 7
$$

because:

$$
5 \cdot 7 = 35
$$

and:

$$
35 \equiv 1 \pmod{17}
$$

So:

$$
5^{-1} \equiv 7 \pmod{17}
$$

That means:

$$
\frac{3}{5} \equiv 3 \cdot 5^{-1} \pmod{17}
$$

So:

$$
\frac{3}{5} \equiv 3 \cdot 7 \pmod{17}
$$

$$
\frac{3}{5} \equiv 21 \pmod{17}
$$

and:

$$
21 \equiv 4 \pmod{17}
$$

So:

$$
\frac{3}{5} \equiv 4 \pmod{17}
$$

This matters for elliptic curves because the point-addition formulas contain division.

For example, the slope of a line usually looks like:

$$
m = \frac{y_2 - y_1}{x_2 - x_1}
$$

Over a finite field, this division becomes multiplication by a modular inverse:

$$
m \equiv (y_2 - y_1)(x_2 - x_1)^{-1} \pmod p
$$

So the geometric idea is the same, but the arithmetic changes.

Instead of normal division, we use modular inverses.

One important condition is that the value we divide by must not be equivalent to zero modulo `p`.

If the denominator is zero modulo `p`, then the inverse does not exist.

This is exactly where special cases like vertical lines and the point at infinity appear again.


# 5. What a Finite Field Is

A **finite field** is a finite set of values where addition, subtraction, multiplication, and division behave consistently.

For ECC, the most common example is the prime field:

$$
\mathbb{F}_p
$$

This means the field of integers modulo `p`, where `p` is a prime number.

The values are:

$$
0, 1, 2, \ldots, p - 1
$$

and all arithmetic is performed modulo `p`.

The reason `p` is usually prime is important - **When `p` is prime, every non-zero value has a modular inverse**. This means division works for every non-zero element.

For example, in:

$$
\mathbb{F}_{17}
$$

the values are:

$$
0, 1, 2, \ldots, 16
$$

Every value except `0` has an inverse modulo `17`.

This gives us a complete arithmetic system.

So, in a prime finite field:

* addition is defined
* subtraction is defined
* multiplication is defined
* division by non-zero values is defined
* every result stays inside the field

That is why finite fields are so useful for cryptography.

They give us exact arithmetic over a limited set of values.

Now we can reinterpret the elliptic curve equation inside this finite field:

$$
y^2 \equiv x^3 + ax + b \pmod p
$$

This creates an elliptic curve over a finite field.

Unlike the real-number version, this curve does not look like a smooth continuous line.

Instead, it looks like a set of scattered points.

But the important structure remains:

* we still have valid curve points
* we still have point addition
* we still have point doubling
* we still have inverse points
* we still have the point at infinity
* we still have scalar multiplication

The visual picture changes.

The algebraic structure remains.

That is the version of elliptic curves used in real ECC systems.
