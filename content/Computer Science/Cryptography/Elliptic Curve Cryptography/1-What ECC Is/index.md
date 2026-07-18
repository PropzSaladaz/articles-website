---
status: "draft"
date: "2026-06-11"
summary: "A high-level introduction to ECC, private/public keys, scalar multiplication, and the hard reverse problem behind ECC security."
---

# 1. What ECC Is

Elliptic Curve Cryptography, usually called **ECC**, is one of the main foundations of modern public-key cryptography.

It is used in many real-world systems, including Bitcoin, Ethereum-related cryptography, TLS, secure messaging, mobile devices, blockchain protocols, and threshold cryptography systems.

At a high level, ECC follows the same basic idea as other asymmetric cryptographic systems:

* there is a **private key**, which must remain secret
* there is a **public key**, which can be shared with everyone
* the public key is computed from the private key
* the private key should be infeasible to recover from the public key

The difference is the mathematical structure used to create that relationship.

In ECC, the central relationship is:

$$
Q = kG
$$

where:

* `k` is the private key
* `G` is a public base point on the elliptic curve (don't worry if you don't understand what a base point is at this point - we will get into this in later articles. But yes, its basically a 2D point with $x$ and $y$ coordinates)
* `Q` is the public key

> [!IMPORTANT]
> This equation is the core of ECC:
>
> $$
> Q = kG
> $$
>
> The private key is a number.
> The public key is a curve point.
> The public key is obtained by multiplying the public base point by the private key.

The operation `kG` is called **scalar multiplication**.

This does not mean ordinary multiplication between two numbers. It means repeatedly combining the curve point `G` with itself `k` times, using the elliptic curve point-addition rule.

For now, the exact point-addition rule is not important. The important idea is simpler:

::: definition[]
ECC gives us a way to turn a secret number into a public curve point.
:::

The security of ECC comes from the fact that this operation is easy in one direction, but extremely hard to reverse.

If we know `k` and `G`, we can efficiently compute:

$$
Q = kG
$$

But if we only know the public values `G` and `Q`, recovering the secret value `k` is computationally infeasible for properly chosen curves.

This hard reverse problem is called the **Elliptic Curve Discrete Logarithm Problem**, or **ECDLP**.

> [!NOTE]
> **Why is it called the Elliptic Curve Discrete Logarithm Problem?**
>
> The name comes from an older problem called the **Discrete Logarithm Problem**.
>
> In ordinary arithmetic, a logarithm reverses exponentiation. For example, if:
>
> $$
> 2^5 = 32
> $$
>
> then the logarithm asks:
>
> $$
> \text{What exponent turns } 2 \text{ into } 32?
> $$
>
> In other words, it tries to recover the hidden exponent.
>
> The word **discrete** means the possible values are separate from each other, not part of a smooth continuous line.
>
> In real ECC systems, the curve is used over a **finite field**, so the points form a finite set instead of a continuous graph. In simpler terms, the possible solutions fall into a set of discrete points. Not a continuous interval. We will see all of this later on.
> 
> The hidden value `k` tells us how many point-addition steps were used to move from `G` to `Q`.
>
> ECC has a similar reverse problem, but instead of ordinary numbers and exponentiation, it works with **points on an elliptic curve** and **scalar multiplication**.
>
> In ECC, we compute:
>
> $$
> Q = kG
> $$
>
> The reverse question is:
>
> $$
> \text{Given } G \text{ and } Q, \text{ what was } k?
> $$
>
> This hidden value `k` is the private key.
>
> For properly chosen elliptic curves, there is no known efficient classical algorithm for recovering `k` from `G` and `Q`.
>
> So the core idea is:
>
> * Easy: given `k` and `G`, compute `Q`
> * Hard: given `G` and `Q`, recover `k`

This “easy forward, hard backward” property is what makes ECC useful for cryptography.

It is also the key difference between ECC and RSA. ECC is not “RSA with smaller numbers”. RSA relies on the difficulty of factoring large integers, while ECC relies on the difficulty of reversing scalar multiplication on elliptic curve points.

So, at the most basic level, the hard question in ECC is:

> Given the public base point `G` and the public key `Q`, what was the secret scalar `k`?

Everything else in ECC is built around making this relationship useful, efficient, and secure.

## 2. Why ECC Matters

ECC matters because it provides strong public-key cryptography with relatively small keys.

Older public-key systems, such as RSA and classic finite-field Diffie-Hellman, require much larger keys to reach comparable security levels.

The reason is that each system is based on a different hard mathematical problem:

| Cryptosystem           | Main hard problem                                      |
| ---------------------- | ------------------------------------------------------ |
| RSA                    | Factoring large integers                               |
| Classic Diffie-Hellman | Solving discrete logarithms over finite fields         |
| ECC                    | Solving discrete logarithms over elliptic curve groups |

A common rough comparison is:

* **256-bit ECC key ≈ 3072-bit RSA key**, for around **128-bit security**

This does not mean ECC is magically stronger.

It means that, with currently known classical attacks, elliptic curve discrete logarithms are harder to solve per bit of key size than RSA integer factorization. Because of that, ECC can use smaller keys while still achieving strong security.

This makes ECC useful when we care about:

* smaller keys
* smaller signatures
* lower bandwidth usage
* lower storage cost
* efficient verification
* good performance on constrained devices

This is why ECC is widely used in modern cryptographic systems.

It is also why ECC appears frequently in blockchain systems, where many participants need to verify signatures, exchange keys, and coordinate cryptographic operations efficiently.

## 3. Where We Go Next

This chapter introduced the main ECC relationship:

$$
Q = kG
$$

For now, it is enough to remember the basic meaning:

* `k` is the private key.
* `G` is a public starting point.
* `Q` is the public key.
* Computing `Q` from `k` and `G` is efficient.
* Recovering `k` from `G` and `Q` is the hard problem.

The following chapters unpack the pieces hidden inside this one equation.

In the next chapter, we start with **elliptic curves over real numbers**. This is the visual version of the topic. It helps us understand what curve points are and why the curve equation matters.

Then we introduce **point addition**. This explains how two curve points can be combined to produce another curve point.

After that, we study **scalar multiplication**. This is where repeated point addition becomes the operation behind:

$$
Q = kG
$$

Then we move from smooth real-number curves to **finite fields**, because real cryptographic systems do not use continuous curves directly. They use exact arithmetic over a finite set of values.

Once finite fields are in place, we can talk about real ECC keys, protocols, and later pairing-based ideas such as `G1`, `G2`, and bilinear pairings.

So the rest of the collection is mainly about turning this first mental model into a precise cryptographic system.
