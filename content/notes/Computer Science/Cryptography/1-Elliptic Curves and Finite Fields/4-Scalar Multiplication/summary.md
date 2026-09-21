**Core idea:** Scalar multiplication repeats point addition:

$$
kP=\underbrace{P+P+\cdots+P}_{k\text{ additions}}.
$$

It does **not** multiply the coordinates: $k(x,y)\ne(kx,ky)$.

## Efficient computation

- Build larger multiples from **doubling** and **addition**; for example,
  $$
  5P=4P+P,
  \qquad
  4P=2P+2P.
  $$
- **Double-and-add** reads the binary digits of $k$: double for every bit, then add $P$ when the bit is $1$.
- The work grows roughly as $\log_2 k$, making enormous scalars practical.
- Every intermediate result remains in the same elliptic-curve group.

<iframe src="simulations/ec_3p_example.html" width="100%" height="420px" title="Computing 3P by first doubling P and then adding P"></iframe>

**Next:** Replace approximate real-number coordinates with exact modular arithmetic.
