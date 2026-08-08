**Core idea:** ECC turns points on a curve into an arithmetic system. Repeating its point operation is easy; reversing a large repetition is hard.

## Progression

$$
\text{real curve}
\longrightarrow
\text{point addition}
\longrightarrow
\text{scalar multiplication}
\longrightarrow
\text{finite-field point group}
\longrightarrow
\text{cryptographic subgroup}
$$

## Remember

- Real curves provide geometric intuition.
- Finite fields make the coordinates finite, discrete, and exact.
- Cryptographic systems publicly select a base point and work with its subgroup.
- This collection builds the mathematics; later collections build keys, signatures, and protocols from it.
