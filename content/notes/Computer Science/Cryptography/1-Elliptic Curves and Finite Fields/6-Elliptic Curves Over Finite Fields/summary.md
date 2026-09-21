**Core idea:** A finite-field curve is computed directly from its modular equation. It is not a cropped, rounded, or wrapped image of the real curve.

## Construct the point group

For each $x\in\mathbb{F}_p$:

1. Compute $r=x^3+ax+b\pmod p$.
2. Find every $y$ with $y^2\equiv r\pmod p$.
3. Collect each matching $(x,y)$, then add the identity $\mathcal{O}$.

A nonzero quadratic residue normally gives the inverse pair $(x,y)$ and $(x,p-y)$; zero gives $(x,0)$; a non-residue gives no point.

For

$$
y^2\equiv x^3+x+1\pmod{11},
$$

there are $13$ affine points and $\mathcal{O}$, so $\#E(\mathbb{F}_{11})=14$.

<iframe src="simulations/build_full_point_cloud.html" width="100%" height="500px" title="Constructing the complete affine point cloud over F11 by matching modular residues"></iframe>

## Add finite-field points

Use the same group law algebraically. For $P=(x_1,y_1)$ and $Q=(x_2,y_2)$:

$$
\lambda=
\begin{cases}
(y_2-y_1)(x_2-x_1)^{-1}, & P\ne Q,\\
(3x_1^2+a)(2y_1)^{-1}, & P=Q,
\end{cases}
\pmod p
$$

$$
x_3=\lambda^2-x_1-x_2,
\qquad
y_3=\lambda(x_1-x_3)-y_1
\pmod p.
$$

Division means multiplication by a modular inverse. Also, $P+(-P)=\mathcal{O}$ and $2(x,0)=\mathcal{O}$.

<iframe src="simulations/doubling_over_f11.html" width="100%" height="580px" title="Modular calculation showing that doubling (1,5) gives (3,3) over F11"></iframe>

**Validity:** Require $4a^3+27b^2\not\equiv0\pmod p$. Production curves use the same construction and operation at an enormous scale.

**Next:** Measure scalar cycles and select a prime-order subgroup.
