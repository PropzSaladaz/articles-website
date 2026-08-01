---
status: "draft"
summary: "Apply finite-field elliptic-curve groups to cryptographic protocols: keys, the discrete logarithm problem, signatures, key agreement, encryption, and threshold systems."
---

# Elliptic-Curve Protocols

This collection begins where the mathematical foundations end. It assumes the ideas in [Elliptic Curves and Finite Fields](/collections/computer-science/cryptography/elliptic-curves-and-finite-fields/): a public base point $G$, its large subgroup, and scalar multiplication.

1. **ECC Keys and the Discrete Logarithm Problem**
   - Private/public keypairs, the relationship $Q = kG$, ECDLP, and why the finite-field subgroup matters.

Later articles will cover ECDH, ECDSA, elliptic-curve encryption, and threshold constructions.

## Scope and Next Paths

This collection covers the ordinary elliptic-curve groups behind ECC protocols. BLS signatures need an additional bilinear-pairing structure, so they belong in [Pairing-Based Cryptography](/collections/computer-science/cryptography/pairing-based-cryptography/).

Threshold BLS means a threshold **signature** scheme. Threshold **encryption** is a different goal: it keeps a ciphertext secret until enough participants cooperate to decrypt it. It may use elliptic curves or pairings, but it is not BLS itself. The existing [Threshold Encryption primer](/articles/computer-science/cryptography/threshold-encryption/threshold-encryption-made-simple/) follows that separate path.
