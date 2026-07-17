# Session: Local CZX and Intertwiner Audit

*Date: 2026-07-18 00:35 IST*

## Scope

Provide a small, reusable TypeScript implementation for the timesarrow T35a local CZX audit.

## Changes

- Added `ControlledZ` to the gate library.
- Added `models/czx.ts`, which constructs the four-qubit CZX operator and audits its action on an `IntertwinerSpace`.
- Added focused tests and public exports.

## Result

The operator squares to identity in the full 16-dimensional space, while the SU(2) four-spin-half singlet subspace is not invariant. This is a bounded negative result: it rejects this literal local implementation as the required constrained on-site action, not CZX-based many-vertex constructions in general.

## Verification

- `pnpm exec vitest run __tests__/gates.test.ts __tests__/czx.test.ts`: 22 tests passed.
- `pnpm test`: 492 tests passed.
- `pnpm build`: passed.
