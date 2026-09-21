**Core idea:** An elliptic curve is the set of points satisfying a smooth cubic equation—not merely the curve drawn on a graph.

## Essential facts

$$
y^2=x^3+ax+b
$$

- **Valid point:** $P=(x,y)$ belongs to the curve only when its coordinates satisfy the equation.
- **Symmetry:** If $(x,y)$ is valid, then $(x,-y)$ is valid because $y^2=(-y)^2$.
- **Parameters:** $a$ and $b$ control the curve's shape.
- **Smoothness:** The curve must satisfy
  $$
  4a^3+27b^2\ne0.
  $$
  Cusps and crossings make the point operation unreliable.
- **Role of real numbers:** They make the geometry visible; cryptography later replaces them with exact finite-field arithmetic.

<iframe src="simulations/ec_introduction.html" width="100%" height="520px" title="How the parameters a and b change a smooth elliptic curve over the real numbers"></iframe>

**Next:** Turn the curve's symmetry and geometry into point addition.
