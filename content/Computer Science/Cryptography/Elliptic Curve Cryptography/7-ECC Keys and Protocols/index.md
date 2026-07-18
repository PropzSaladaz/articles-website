---
status: "draft"
date: "2026-06-11"
summary: "Connect finite-field elliptic curves to keypairs, ECDLP, protocol families, and threshold cryptography motivation."
---

# 1. ECC Keys and Protocols

The previous chapters built the mathematical machinery: curve points, point addition, scalar multiplication, and finite-field arithmetic. This chapter starts using that machinery as cryptography.

## 2. Public and Private Keys in ECC

ECC keypairs are based on scalar multiplication.

First, the system defines a public base point:

$$
G
$$

Then the user chooses a private key:

$$
k
$$

The public key is computed as:

$$
Q = kG
$$

So:

| Concept     | ECC meaning                  |
| ----------- | ---------------------------- |
| Private key | A secret scalar `k`          |
| Public key  | A curve point `Q = kG`       |
| Base point  | A public generator point `G` |

Anyone can know `G` and `Q`.

But only the private key owner knows `k`.

The security comes from the fact that recovering `k` from `G` and `Q` is hard.

---

## 3. The Elliptic Curve Discrete Logarithm Problem

The classical Discrete Logarithm Problem, or DLP, is usually written like this:

$$
x = g^y \mod p
$$

Given `g`, `x`, and `p`, it is hard to recover `y`.

ECC uses a similar idea, but with elliptic curve points instead of normal numbers.

In ECC, we have:

$$
Q = kP
$$

Given:

* `P`
* `Q`

it is hard to find:

$$
k
$$

This is called the **Elliptic Curve Discrete Logarithm Problem**, or **ECDLP**.

The ECDLP is the main reason ECC can be used for cryptography.

---

## 4. Why ECC Is Useful for Cryptography

ECC is useful because scalar multiplication is easy in one direction and hard in the reverse direction.

Easy direction:

$$
Q = kG
$$

If we know `k` and `G`, computing `Q` is efficient.

Hard direction:

$$
k = ?
$$

If we know only `G` and `Q`, finding `k` is computationally infeasible for properly chosen curves and large enough parameters.

This gives us a one-way function.

That one-way function is used to build:

* digital signatures
* key exchange
* encryption systems
* threshold cryptography
* distributed key generation
* verifiable decryption systems

---

## 5. Why This Matters for Threshold Cryptography

Threshold cryptography builds on the same ECC foundation.

In normal ECC, one private key controls one public key:

$$
Q = kG
$$

In threshold cryptography, the private key `k` is not held by one person or one machine.

Instead, it is split across multiple participants.

For example:

```text
Validator 1 has share k₁
Validator 2 has share k₂
Validator 3 has share k₃
...
```

No single validator knows the full private key.

But a sufficient number of validators can cooperate to perform a cryptographic operation.

This is the foundation of:

* threshold signatures
* threshold encryption
* distributed key generation
* encrypted blockchain transactions
* MEV-resistant transaction ordering

Before understanding DKG or threshold encryption, the most important ECC ideas are:

1. A private key is a scalar.
2. A public key is a curve point.
3. Public keys are created using scalar multiplication.
4. Scalar multiplication is easy to compute.
5. Reversing scalar multiplication is hard.
6. Finite-field elliptic curves give us a discrete, computer-friendly structure.

---

## 6. Summary

Elliptic Curve Cryptography is based on a simple but powerful idea:

```text
Take a point G.
Multiply it by a secret scalar k.
Get a public point Q.
Make it practically impossible to recover k from Q.
```

In mathematical form:

$$
Q = kG
$$

This is easy to compute, but hard to reverse.

That one-way property is the foundation of ECC.

Elliptic curves also define a group structure, where points can be added, doubled, inverted, and multiplied by scalars.

For cryptography, these curves are not used over normal real numbers. They are used over finite fields, where the curve becomes a discrete set of points and all arithmetic is performed modulo a large prime.

This chapter gives the foundation needed to move into later threshold and pairing-based topics:

```text
threshold cryptography, BLS signatures, and pairing operations
```

That is where we stop thinking only about one private key held by one person, and start thinking about one secret split across many participants.
