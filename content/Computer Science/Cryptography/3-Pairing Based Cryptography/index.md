---
status: "draft"
summary: "A dedicated path through pairing-friendly curves, bilinear pairings, BLS signatures, aggregation, and threshold BLS."
---

# Pairing-Based Cryptography

Pairing-based cryptography builds on elliptic-curve groups but requires additional structure. This collection introduces the special groups and bilinear maps needed for BLS signatures and related protocols. It assumes the finite-field group, subgroup, and scalar-multiplication intuition developed in [Elliptic Curves and Finite Fields](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/).

1. **Pairing-Friendly Curves, G1, G2, and GT**
   - The distinct groups that make a bilinear pairing possible, and why ordinary ECDH/ECDSA curves are usually not suitable.

2. **Pairing Operations**
   - The pairing map, bilinearity, BLS signatures, aggregation, and the applications that follow.

## A Necessary Distinction

BLS is a **digital-signature** scheme. Threshold BLS is therefore a threshold-signature scheme: enough participants cooperate to produce one verifiable signature.

Threshold encryption is different. It keeps a ciphertext unreadable until enough participants cooperate to decrypt it. Some threshold-encryption designs use pairings, but threshold encryption is not a form of BLS. The [Threshold Encryption primer](/articles/computer-science/cryptography/threshold-encryption/threshold-encryption-made-simple/) covers that separate goal.
