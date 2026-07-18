---
status: "draft"
date: "2026-06-11"
summary: "Reinterpret elliptic curves over finite fields, where curves become discrete point sets but keep their algebraic structure."
---

# 1. Elliptic Curves Over Finite Fields

So far, we described elliptic curves over real numbers.

But real-number curves are not used directly in cryptographic systems.

Cryptographic elliptic curves are defined over **finite fields**.

A finite field contains a limited set of values. In many elliptic curves, this field is based on integers modulo a large prime number `p`.

Instead of using:

$$
y^2 = x^3 + ax + b
$$

we use:

$$
y^2 \equiv x^3 + ax + b \pmod p
$$

This means all operations wrap around modulo `p`.

For example, if:

$$
p = 17
$$

then values are limited to:

```text
0, 1, 2, ..., 16
```

After reaching `16`, arithmetic wraps around.

For example:

$$
18 \equiv 1 \pmod{17}
$$

and:

$$
20 \equiv 3 \pmod{17}
$$

---

## 2. Why Finite Fields Look Different

Over real numbers, elliptic curves look like smooth curves.

Over finite fields, they look like a scattered cloud of points.

That is because only integer coordinate pairs are allowed, and all arithmetic is performed modulo `p`.

```md
[INTERACTIVE SIMULATION PLACEHOLDER]

Insert finite-field elliptic curve visualization.

Suggested interaction:
- Choose small prime p
- Choose a and b
- Show all points (x, y) satisfying:

  y² ≡ x³ + ax + b mod p

- Compare with the smooth real-number curve
```

This cloud of points may look random, but it still has a precise algebraic structure.

Point addition, point doubling, inverses, and scalar multiplication still work.

That structure is what allows finite-field elliptic curves to be used in cryptography.

---

## 3. Real Curves vs Finite-Field Curves

| Concept                   | Real-number elliptic curve           | Finite-field elliptic curve  |
| ------------------------- | ------------------------------------ | ---------------------------- |
| Coordinates               | Decimals, fractions, negatives, etc. | Integers modulo `p`          |
| Visual shape              | Smooth curve                         | Cloud of discrete points     |
| Used for intuition        | Yes                                  | Yes, but harder to visualize |
| Used in real cryptography | No                                   | Yes                          |
| Arithmetic                | Normal arithmetic                    | Modular arithmetic           |
| Main operation            | Point addition                       | Point addition modulo `p`    |

The real-number curve helps us understand the geometry.

The finite-field curve is what cryptographic systems actually use.
