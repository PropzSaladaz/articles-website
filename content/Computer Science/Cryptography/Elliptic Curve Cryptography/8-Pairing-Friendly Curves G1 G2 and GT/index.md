---
status: "draft"
date: "2026-06-11"
summary: "A planned bridge from ordinary ECC groups to pairing-friendly groups G1, G2, and GT."
---

# 1. Pairing-Friendly Curves, G1, G2, and GT

This chapter is a planned bridge from ordinary ECC groups to the groups used in pairing-based cryptography.

## 2. Why Ordinary ECC Is Not Enough for Pairings

Explain why pairings need curves and groups with extra structure, and why not every elliptic curve used for ECDH or ECDSA is pairing-friendly.

## 3. The Three Groups: G1, G2, and GT

Introduce the roles of G1, G2, and GT at a conceptual level:

* G1 is an elliptic curve subgroup.
* G2 is another elliptic curve subgroup, often defined over an extension field.
* GT is the target group where pairing results live.

## 4. Extension Fields

Introduce extension fields only as much as needed to understand why G2 may look less familiar than the prime-field curve from earlier chapters.

## 5. Generators, Orders, and Subgroups

Connect this chapter back to the earlier ideas of base points, subgroup order, cofactors, and scalar multiplication.

## 6. Why This Matters

Prepare the reader for BLS signatures, threshold BLS, KZG commitments, and protocols that compare relationships between secrets without revealing the secrets themselves.
