# Local CZX and Intertwiner Audit

*Recorded: 2026-07-18*

## Scope

`src/models/czx.ts` provides a narrow local calculation for the timesarrow T35a construction audit. It is not a claim that the full microscopic model has been constructed.

## Operator

For four qubits ordered with qubit zero as the most significant computational-basis bit,

$$
U_{\mathrm{CZX}} = X_1 X_2 X_3 X_4\, CZ_{12} CZ_{23} CZ_{34} CZ_{41}.
$$

The implementation maps each computational-basis index directly and supplies `createCzxOnSiteSymmetry()` for reuse.

## Constrained-Space Audit

`auditCzxOnIntertwinerSubspace()` applies the operator to each orthonormal basis vector of an `IntertwinerSpace`, projects it back into that space, and reports projection and leakage norms.

The four-spin-half singlet space is two-dimensional. Although $U_{\mathrm{CZX}}^2=I$ in the full 16-dimensional Hilbert space, the audit finds nonzero leakage from that two-dimensional subspace.

## Consequence

The literal local CZX candidate is not a valid on-site symmetry of this constrained local space. The next required check is a minimal many-vertex state with an explicitly defined symmetry action.
