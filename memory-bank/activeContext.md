# Active Context
*Last Updated: 2026-07-21 17:12 IST*

## Current Focus
**T14 follow-on**: Local CZX symmetry and SU(2) intertwiner audit — checkpoint complete

**Status**: `ControlledZ` and a local CZX audit are implemented and fully tested. The literal four-qubit CZX operator is an involution on the full Hilbert space, but it does not preserve the four-spin-half SU(2) singlet/intertwiner subspace.

### What Was Delivered
- `src/operators/gates.ts` — `ControlledZ` gate with computational-basis and involution tests
- `src/models/czx.ts` — local CZX construction plus projection/leakage audit against an `IntertwinerSpace`
- `__tests__/czx.test.ts` — full-space involution and singlet-subspace leakage tests
- `src/angularMomentum/su2.ts` — SU(2) group operations, Haar sampling, Euler angles
- `src/angularMomentum/representation.ts` — Wigner D-matrices, characters, state rotation
- `__tests__/angularMomentum/su2.test.ts` — 21 tests (group ops, Euler angles, Haar stats)
- `__tests__/angularMomentum/representation.test.ts` — 16 tests (unitarity, characters, rotation)
- All 115 angular momentum tests pass

### Bugs Fixed During Implementation
1. **β angle extraction**: `β = 2·acos(|a|)` (was `asin(sin β)` giving [0, π/2])
2. **Wigner d-matrix coefficient**: `√(num)/den` (was `√(num/den)` losing precision)

## New: Sparse Lanczos Eigensolver (2026-07-21)

Added sparse matrix eigensolver capability to `SparseOperator`:

- **`src/operators/sparseEigensolver.ts`** — Lanczos algorithm for finding extreme eigenvalues of large sparse Hermitian matrices
  - `lanczosIteration()`: builds tridiagonal Lanczos matrix via matrix-free H|v⟩ application
  - `findLowestEigenvalues()`: computes k lowest eigenvalues/vectors via Lanczos + dense diagonalization of T-matrix
  - Handles numerical orthogonality via full re-orthogonalization
  - Supports both real symmetric and complex Hermitian matrices
  
- **`SparseOperator.eigenDecompose()`** updated to use sparse eigensolver instead of dense fallback
  - Automatically selects sparse path for matrices > 256×256 or with sparsity > 50%
  - Falls back to dense for small matrices

- **Tests**: `__tests__/sparseEigensolver.test.ts` — 102 lines, 6 tests covering:
  - Diagonal matrix eigenvalues
  - Real symmetric matrix
  - Complex Hermitian matrix
  - Accuracy to 1e-10 relative tolerance

All 498 tests pass. This was built to support timesarrow T35a parent Hamiltonian verification (16-qubit system, dim = 65,536).

## Next Priority
Use the local audit only as infrastructure for timesarrow T35a. The next scientific gate is a minimal many-vertex candidate state and its symmetry action; do not promote the local CZX operator to a microscopic realization claim.


## Previous Work
**T20**: Z₂ Lattice Gauge Theory — Complete (see timesarrow memory bank)
**T13**: Showcase v2 — Interactive quantum simulations with modular architecture

## Design Decisions
- `createRotationOperator` kept in `core.ts` for backward compatibility (not moved)
- SU(2) modules in `angularMomentum/` (group theory domain), not `core/`
- No conditional UI hiding — always-visible, disable with tooltip (showcase pattern)

## Pending
- T15: Spin Foam Extension Package Design (in progress)
- T10: Quantum Random Walk Demo Page (in progress)
