**Core idea:** A prime field replaces continuous, approximate real arithmetic with a finite and exact number system.

## Prime-field arithmetic

$$
\mathbb{F}_p=\{0,1,\ldots,p-1\},
\qquad p\text{ prime}.
$$

- Reduce every addition, subtraction, and multiplication modulo $p$.
- $a\equiv b\pmod p$ means $a$ and $b$ have the same remainder modulo $p$.
- Division uses a **modular inverse**:
  $$
  b\,b^{-1}\equiv1\pmod p,
  \qquad
  \frac ab\equiv a b^{-1}\pmod p.
  $$
- Example in $\mathbb{F}_{11}$: $3^{-1}=4$ because $3\cdot4\equiv1\pmod{11}$.
- A prime modulus ensures every nonzero element has an inverse; a composite modulus generally does not.

<iframe src="simulations/modular_clock.html" width="100%" height="520px" title="Clock analogy for values wrapping under modular arithmetic"></iframe>

The curve equation is now interpreted as

$$
y^2\equiv x^3+ax+b\pmod p.
$$

**Next:** Enumerate the coordinate pairs in $\mathbb{F}_p^2$ that satisfy this equation.
