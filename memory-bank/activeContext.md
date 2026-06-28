# Active Context
*Last Updated: 2026-06-28 22:59 IST*

## Current Focus
**T14**: SU(2) Haar Measure Sampling + Representation Matrices — ✅ COMPLETED

**Status**: Implementation complete with full test coverage. Ready for T1 (FK Vertex Amplitude).

### What Was Delivered
- `src/angularMomentum/su2.ts` — SU(2) group operations, Haar sampling, Euler angles
- `src/angularMomentum/representation.ts` — Wigner D-matrices, characters, state rotation
- `__tests__/angularMomentum/su2.test.ts` — 21 tests (group ops, Euler angles, Haar stats)
- `__tests__/angularMomentum/representation.test.ts` — 16 tests (unitarity, characters, rotation)
- All 115 angular momentum tests pass

### Bugs Fixed During Implementation
1. **β angle extraction**: `β = 2·acos(|a|)` (was `asin(sin β)` giving [0, π/2])
2. **Wigner d-matrix coefficient**: `√(num)/den` (was `√(num/den)` losing precision)

## Next Priority
**T1**: FK Vertex Amplitude — Monte Carlo integration using T14 modules
- Imports: `sampleSU2Haar()`, `representationMatrix()`, `characterSU2()`
- Location: `src/spinFoam/` (new package)

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
