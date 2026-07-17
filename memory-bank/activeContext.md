# Active Context
*Last Updated: 2026-07-18 00:56 IST*

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
