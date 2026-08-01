---
status: "draft"
date: "2026-06-11"
summary: "A planned introduction to bilinear pairings, BLS signatures, aggregation, threshold BLS signatures, and their distinction from threshold encryption."
---

# 2. Pairing Operations

This chapter is planned as the first dedicated article on bilinear pairings. It should explain what the pairing operation does before diving into specific algorithms.

## 2. The Pairing Map

Introduce the shape of the operation:

$$
e: G_1 \times G_2 \rightarrow G_T
$$

A pairing takes one element from G1, one element from G2, and returns an element in GT.

## 3. Bilinearity

Explain the core property:

$$
e(aP, bQ) = e(P, Q)^{ab}
$$

This is the key idea that makes pairings useful.

## 4. Why Bilinearity Is Powerful

Show how pairings let us check multiplicative relationships between hidden scalars through public group elements.

## 5. BLS Signatures

Use BLS as the first practical example: key generation, signing, verification, and aggregation at a high level.

## 6. Threshold BLS, Commitments, and Encryption

Connect pairings to threshold BLS signatures, validator committees, signature aggregation, and KZG commitments. Make the boundary explicit: threshold BLS produces a signature when enough participants cooperate, while threshold encryption reveals a ciphertext only when enough participants cooperate to decrypt it. Pairings can appear in either kind of system, but the two goals and constructions are different.
