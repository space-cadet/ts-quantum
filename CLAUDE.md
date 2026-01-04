# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Build and Testing:**
```bash
pnpm build                # Build TypeScript to dist/ (CommonJS and ESM)
pnpm test                 # Run all tests with Vitest
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Run tests with coverage report
pnpm clean                # Clean build artifacts (dist, node_modules, coverage)
```

**Web Build:**
```bash
pnpm web:build            # Build library and create browser bundle
pnpm web:serve            # Build and serve showcase at http://localhost:8080
pnpm deploy:vercel        # Deploy to Vercel
```

**Run Individual Tests:**
```bash
pnpm exec vitest run __tests__/stateVector.test.ts
pnpm exec vitest run __tests__/angularMomentum/
pnpm exec vitest run --reporter=verbose    # Detailed test output
```

**Generate Documentation:**
```bash
pnpm docs                 # Generate TypeDoc documentation
```

## Architecture Overview

This is a TypeScript quantum mechanics library implementing core quantum state operations, operators, angular momentum algebra, and geometric quantum mechanics. The codebase follows a strict hierarchical dependency structure enforcing clean separation of concerns.

**Level 0 (Core):** `src/core/` - Type definitions and interfaces (`types.ts`, `hilbertSpace.ts`)

**Level 1 (Utils):** `src/utils/` - Mathematical utilities using math.js
- `math.ts` - Math.js wrapper and helper functions
- `matrixOperations.ts` - Core matrix algebra (eigendecomposition, tensor products)
- `matrixFunctions.ts` - Advanced functions (exponentials, logarithms)
- `information.ts` - Quantum information measures (entropy, fidelity, Schmidt decomposition)
- `oscillator.ts` - Harmonic oscillator operators and utilities
- `validation.ts` - Input validation for quantum operations

**Level 2 (States):** `src/states/` - Quantum state implementations
- `stateVector.ts` - Pure quantum state implementation (`IStateVector`)
- `densityMatrix.ts` - Mixed states and density matrix operations
- `states.ts` - Common state preparation (computational basis, Bell, GHZ, W states)
- `composite.ts` - Multi-particle system operations and tensor products

**Level 3 (Operators):** `src/operators/` - Quantum operators and transformations
- `operator.ts` - Base matrix operator implementation (`IOperator`)
- `gates.ts` - Standard quantum gates (Pauli, Hadamard, CNOT, etc.)
- `measurement.ts` - Projective measurements and Born rule
- `hamiltonian.ts` - Time evolution operators
- `algebra.ts` - Advanced operator algebra (commutators, uncertainty relations)
- `circuit.ts` - Quantum circuit composition framework
- `sparse.ts` / `sparseOperator.ts` - Sparse matrix support for large systems
- `specialized.ts` - Specialized operators

**Level 4 (Specialized):**
- `src/angularMomentum/` - Angular momentum algebra, Wigner symbols, Clebsch-Gordan coefficients
- `src/intertwiner/` - Tensor intertwiner operations for spin networks
- `src/geometry/` - Geometric quantum mechanics (Fubini-Study metric, quantum distances)

### Key Design Patterns

**Math.js Integration:** All complex number and matrix operations use math.js for numerical stability. Access via `math.complex()`, `math.add()`, `math.multiply()`, `math.eigs()`, etc.

**Immutable States:** Quantum operations return new state objects rather than modifying existing ones:
```typescript
const evolvedState = operator.apply(initialState); // Creates new state
```

**Interface-First Design:** All components implement core interfaces defined in `src/core/types.ts`:
- `IStateVector` - Quantum state vectors with complex amplitudes
- `IOperator` - Linear quantum operators
- `IDensityMatrix` - Mixed state density matrices

**Functional Purity:** Quantum operations are pure functions—same inputs always produce same outputs with no side effects.

## Critical Implementation Details

**Numerical Stability:** The library uses math.js internally for all complex number operations to avoid floating-point precision issues in quantum calculations. Never implement custom complex arithmetic.

**Dimension Validation:** Always validate that Hilbert space dimensions match between states and operators before operations. Use `validation.ts` utilities.

**Normalization Invariants:** State vectors must maintain `norm() === 1`. Always call `normalize()` after state manipulations that could affect normalization.

**Angular Momentum Module:** Located in `src/angularMomentum/`, implements:
- Wigner 3j, 6j, 9j symbols (`wignerSymbols.ts`)
- Clebsch-Gordan coefficients (`composition.ts`)
- Angular momentum operators and states (`core.ts`, `operators.ts`)
- Multi-spin state analysis (`multiSpinState.ts`, `stateAnalysis.ts`)
Critical for spin network applications.

**Intertwiner Module:** Located in `src/intertwiner/`, implements tensor intertwiner operations for coupling multiple angular momenta at vertices in spin networks.

**Geometric Quantum Module:** Located in `src/geometry/`, implements Fubini-Study metric and quantum distance calculations for geometric analysis of quantum states.

**Operator Types:** Use the `OperatorType` enum (UNITARY, HERMITIAN, PROJECTION, CUSTOM) for proper operator classification—affects eigendecomposition, validation, and measurement behavior.

**Sparse Matrix Support:** For systems with >12 qubits, use sparse operators in `src/operators/sparse.ts` to avoid dense matrix memory explosion.

## Testing Guidelines

- Tests use Vitest with comprehensive coverage requirements
- Test suite split across multiple directories by module: `__tests__/stateVector.test.ts`, `__tests__/angularMomentum/`, etc.
- Test fixtures and utilities in `__tests__/utils/`
- Angular momentum tests require careful numerical tolerance (use `closeNumber`, `closeMatrix` helpers) due to Wigner symbol precision
- Integration tests and examples in `examples/` directory demonstrate real usage patterns
- Web demonstrations in `web/simulations.ts` showcase interactive examples

## Package Distribution

The library publishes dual CommonJS/ESM builds:
- **CJS:** `dist/index.js` (from `tsconfig.json`, target ES2020)
- **ESM:** `dist/esm/index.mjs` (from `tsconfig.esm.json`)
- **Types:** `dist/index.d.ts`

Web builds bundle the library for browser use via `pnpm web:build`, creating `web/bundle.js`.

## Important Files to Reference

- `src/index.ts` - Public API exports (authoritative list of available functions)
- `src/core/types.ts` - Core interfaces and type definitions
- `docs/architecture.md` - Detailed architectural documentation with full module dependency graph
- `package.json` - Build scripts and dependency configuration
- `examples/` - Working usage examples for common quantum operations
- `web/showcase.html` - Interactive web demonstrations

## Common Development Patterns

When implementing new quantum operations:
1. Define interfaces in `src/core/types.ts` first if adding new abstractions
2. Implement utilities in `src/utils/` using math.js for mathematical operations
3. Build on existing state/operator classes without breaking immutability
4. Add comprehensive tests with numerical tolerance checking using test helper functions
5. Update public exports in `src/index.ts` once implementation is complete and tested
6. Consider adding example code to `examples/` for user-facing features
7. For large systems, implement sparse variants in `src/operators/sparse.ts`

## Dependencies

- **mathjs**: ^12.4.3 - Core mathematical operations, eigendecomposition, complex arithmetic
- **vitest**: ^0.34.0 - Testing framework with coverage reporting
- **typescript**: ^5.0.0 - Strict typing with ES2020 target
- **esbuild**: ^0.27.2 - Web bundle building
- **@types/mathjs**: ^9.4.2 - Type definitions for mathjs
- **typedoc**: ^0.25.13 - API documentation generation

## Build Configuration

- **TypeScript Targets:** ES2020 for both CJS and ESM
- **Module Resolution:** Node (supports monorepo packages)
- **Strict Mode:** Enabled for all type checking
- **ESM Support:** Full dual-module support for modern and legacy consumers
- **Test Configuration:** Vitest with Node environment, excludes node_modules and dist

The package is published to npm as `ts-quantum` and designed for educational and practical quantum computing applications. It serves as foundational layer for potential graph-based quantum systems integration.