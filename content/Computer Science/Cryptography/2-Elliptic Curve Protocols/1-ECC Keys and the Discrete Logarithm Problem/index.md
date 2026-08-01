---
status: "draft"
date: "2026-06-11"
summary: "Use the finite-field base-point subgroup to introduce ECC keypairs, the Elliptic Curve Discrete Logarithm Problem, and the protocol families built from it."
---

# 1. ECC Keys and the Discrete Logarithm Problem

The preceding [Elliptic Curves and Finite Fields](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/) collection built the mathematical machinery: finite-field curve points, scalar multiplication, and the public base point $G$ with its large subgroup. This chapter starts using that machinery as cryptography.

## 2. Public and Private Keys in ECC

ECC keypairs are based on scalar multiplication.

The public base point $G$ has already been fixed by the curve parameters. Its order is $n$, and the user chooses a private scalar:

$$
k
$$

In the usual prime-order subgroup, the scalar is chosen from

$$
1 \le k < n
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
| Base point  | The public point `G` that generates the selected subgroup |

Anyone can know `G` and `Q`.

But only the private key owner knows `k`.

The security comes from the fact that recovering $k$ from $G$ and $Q$ is hard.

## 3. The Elliptic Curve Discrete Logarithm Problem

The classical Discrete Logarithm Problem, or DLP, is usually written like this:

$$
x = g^y \mod p
$$

Given `g`, `x`, and `p`, it is hard to recover `y`.

ECC uses a similar idea, but with elliptic curve points instead of normal numbers.

In ECC, we have:

$$
Q = kG
$$

Given:

* `G`
* `Q`

it is hard to find:

$$
k
$$

This is called the **Elliptic Curve Discrete Logarithm Problem**, or **ECDLP**.

The word **discrete** matters: the possible points are a finite, separate set rather than a smooth continuous curve. The unknown scalar $k$ tells us how many point-addition steps were used to move from $G$ to $Q$.

Point addition itself is not the hard part. If

$$
R = P + Q
$$

and we know $P$, we can recover $Q$ by adding the inverse of $P$:

$$
Q = R + (-P)
$$

The difficulty appears only after repeated addition. Given

$$
Q = kG
$$

there is no known efficient classical algorithm that recovers $k$ for properly chosen curves and parameters.

Cryptographic hardness comes from the finite-field curve group—not from the smooth real-number curve used for geometric intuition in the foundation collection.


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

ECC also provides strong public-key security with relatively small keys. A common rough comparison is:

$$
\text{256-bit ECC} \approx \text{3072-bit RSA}
$$

for around 128 bits of classical security. This is not because ECC is magically stronger; it reflects that the best known attacks against the relevant elliptic-curve discrete logarithm problem scale differently from attacks on RSA factoring.

Smaller key material can mean smaller signatures, less bandwidth and storage, and better performance on constrained devices.


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

This chapter is the entry point to standard ECC protocols such as ECDH and ECDSA. For BLS signatures, aggregation, and threshold BLS signatures, continue with [Pairing-Based Cryptography](/collections/computer-science/cryptography/pairing-based-cryptography/). For the distinct problem of protecting a ciphertext until a quorum can decrypt it, see the [Threshold Encryption primer](/articles/computer-science/cryptography/threshold-encryption/threshold-encryption-made-simple/).
