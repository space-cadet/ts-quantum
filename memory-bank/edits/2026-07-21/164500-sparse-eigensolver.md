#### 16:45 IST - T35a: Sparse Lanczos eigensolver implementation

**Actions:**
- Implemented `lanczosIteration()` — builds tridiagonal Lanczos matrix via matrix-free H|v⟩ application
- Implemented `findLowestEigenvalues()` — computes k lowest eigenvalues/vectors via Lanczos + dense T-matrix diagonalization
- Added full re-orthogonalization for numerical stability
- Updated `SparseOperator.eigenDecompose()` to auto-select sparse path for large matrices
- Added comprehensive tests: diagonal, real symmetric, complex Hermitian matrices

**Verification:**
- All 498 tests pass
- Accuracy: 1e-10 relative tolerance on eigenvalues
- Designed for timesarrow T35a: 16-qubit system, dim = 65,536

**Files modified:**
- `src/operators/sparseEigensolver.ts` (369 lines)
- `src/operators/sparseOperator.ts` (38 lines changed)
- `src/operators/index.ts` (exports)
- `__tests__/sparseEigensolver.test.ts` (102 lines)
- `memory-bank/activeContext.md` — Added eigensolver section
