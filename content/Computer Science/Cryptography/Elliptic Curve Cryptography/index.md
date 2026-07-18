---
status: "draft"
summary: "A multi-part path from elliptic curve intuition to finite-field ECC, keys, groups, and pairing-based cryptography."
---

# Elliptic Curve Cryptography

This collection breaks the original ECC article into a sequence of smaller articles. The goal is to make each conceptual jump explicit: first the geometric intuition, then the group operation, then scalar multiplication, then finite fields, and finally the pairing-based structures used by systems such as BLS signatures and threshold cryptography.

## Blueprint

1. **What ECC Is**
   - Private keys, public keys, the equation $Q = kG$, scalar multiplication as an idea, ECDLP, and why ECC matters.

2. **Elliptic Curves Over Real Numbers**
   - Weierstrass form, curve parameters, smoothness, singular curves, valid points, and why real curves are useful for intuition.

3. **Point Addition and the Elliptic Curve Group**
   - Chord-and-tangent addition, point doubling, inverse points, the point at infinity, and the group laws.

4. **Scalar Multiplication**
   - Repeated point addition, efficient double-and-add intuition, and why reversing $kG$ is the hard problem.

5. **From Real Curves to Finite Fields**
   - Why cryptography needs exact finite arithmetic, modular arithmetic, modular inverses, and the bridge from geometry to algebra.

6. **Elliptic Curves Over Finite Fields**
   - Curves over $\mathbb{F}_p$, scattered point sets, finite-field point addition, and real curves versus finite-field curves.

7. **ECC Keys and Protocols**
   - Private/public key generation, ECDLP as the one-way relationship, common protocol families, and threshold cryptography motivation.

8. **Pairing-Friendly Curves, G1, G2, and GT**
   - Why pairings require special curves, what G1/G2/GT mean, extension fields, subgroup order, and generator choices.

9. **Pairing Operations**
   - Bilinear maps, the pairing equation, BLS signatures, aggregation, and threshold/blockchain applications.

## Current State

Articles 1 through 7 have been seeded from the original monolithic article. Articles 8 and 9 are blueprint chapters ready to be expanded.
