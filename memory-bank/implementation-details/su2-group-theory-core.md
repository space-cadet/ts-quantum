# Implementation Plan: SU(2) Group Theory Core Additions

*Created: 2026-06-28*
*Task: T22-core*

## Overview

Add three general-purpose utilities to ts-quantum core:
1. `sampleSU2Haar()` — random SU(2) matrices via Haar measure
2. `representationMatrix(j, g)` — D^j(g) for arbitrary spin j
3. `wignerD(j, α, β, γ)` — Wigner D-matrix from Euler angles

These are foundational for any SU(2) group integral and belong in core because they have wide applicability.

## File Structure

```
src/
├── angularMomentum/
│   ├── core.ts              (existing)
│   ├── su2Haar.ts           ← NEW
│   └── representation.ts    ← NEW
└── index.ts                 (update exports)
```

## Implementation Details

### 1. sampleSU2Haar()

Algorithm (standard):
```
1. Sample v ∈ R^4 from standard normal (4 independent Gaussians)
2. Normalize: q = v / ||v||
3. Map to SU(2):
   g = [[q0 + i q3, q1 + i q2],
        [-q1 + i q2, q0 - i q3]]
```

Properties to test:
- det(g) = 1 (unit determinant)
- g† g = I (unitary)
- Statistical Haar invariance: for random g, h·g and g·h are also Haar-distributed for any fixed h ∈ SU(2)

### 2. representationMatrix(j, g)

For j=1/2: return g itself.
For higher j: use the Wigner D-matrix formula.

The existing `angularMomentum/core.ts` already has `createRotationOperator(j, α, β, γ)` which computes Wigner D(α,β,γ). We can refactor this:
- Extract the D-matrix computation into `representation.ts` as `wignerD(j, α, β, γ)`
- Add `representationMatrix(j, g)` that converts SU(2) matrix g → Euler angles → calls wignerD

### 3. wignerD(j, α, β, γ)

Refactor from existing `createRotationOperator`:
- Move the matrix construction logic to `representation.ts`
- Keep `createRotationOperator` as a thin wrapper that applies the matrix to a state

## Testing Strategy

| Test | What it checks |
|------|---------------|
| Determinant | det(g) = 1 for sampled matrices |
| Unitarity | g† g = I |
| Haar invariance (left) | Average of g_{ij} g*_{kl} over samples = δ_{il}δ_{jk}/2 |
| Haar invariance (right) | Same with fixed h multiplied on right |
| Representation property | D^j(g1·g2) = D^j(g1)·D^j(g2) (group homomorphism) |
| Orthogonality | ∫ D^j_{mn}(g)* D^j'_{m'n'}(g) dg = δ_{jj'}δ_{mm'}δ_{nn'}/(2j+1) |

## Performance

- `sampleSU2Haar`: ~100ns per sample (4 random numbers + normalization)
- `representationMatrix`: O(j³) due to matrix construction; for j ≤ 2 this is negligible
- For Monte Carlo with 10⁶ samples at j=1/2: dominated by random number generation

## Wide Applicability Examples

```typescript
// Random matrix theory: Circular unitary ensemble
const ensemble = Array(1000).fill(0).map(() => sampleSU2Haar());

// Lattice QCD: SU(2) subgroup heatbath
const link = sampleSU2Haar(); // proposal in Metropolis

// Quantum info: Random unitary channel
const KrausOps = Array(4).fill(0).map(() => sampleSU2Haar());

// Spin foam: Monte Carlo integration (T22 application)
const vertexAmplitude = (js: number[]) => {
  const g = sampleSU2Haar();
  const Ds = js.map(j => representationMatrix(j, g));
  // ... compute amplitude
};
```

## References

- Mezzadri, F. (2007). "How to generate random matrices from the classical compact groups." Notices of the AMS.
- Varadarajan, V.S. (1984). Lie Groups, Lie Algebras, and Their Representations.
