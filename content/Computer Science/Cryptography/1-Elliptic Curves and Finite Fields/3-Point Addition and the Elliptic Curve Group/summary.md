**Core idea:** Point addition turns the curve's valid points into a consistent arithmetic system.

## Addition rules

- **Different points:** Draw the line through $P$ and $Q$, find its third curve intersection, then reflect that intersection across the x-axis to obtain $P+Q$.
- **Doubling:** When $P=Q$, use the tangent at $P$ instead of a line through two distinct points.
- **Inverse:** If $P=(x,y)$, then $-P=(x,-y)$ and
  $$
  P+(-P)=\mathcal{O}.
  $$
- **Identity:** The point at infinity acts like zero:
  $$
  P+\mathcal{O}=P.
  $$

<iframe src="simulations/ec_point_addition.html" width="100%" height="520px" title="Chord-and-reflection point addition with movable points P and Q"></iframe>

## Group view

$E(\mathbb{R})$ means all valid real-curve points together with $\mathcal{O}$. Under point addition they form an **abelian group**: the operation is closed, associative, has an identity and inverses, and is commutative.

**Next:** Reuse point addition efficiently to compute $kP$.
