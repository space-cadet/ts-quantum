# T20: Z₂ Lattice Gauge Theory Module

*Created: 2026-06-24*
*Project: ts-quantum*

## Objective
Add reusable lattice gauge theory primitives to ts-quantum for use by timesarrow numerics.

## Files Added

### `src/lattice/geometry.ts`
- Lattice types: `SquareLattice`, `TriangularLattice`, `CubicLattice`
- Neighbor indexing with periodic boundary conditions
- Plaquette enumeration

### `src/lattice/gaugeField.ts`
- `Z2GaugeField` class
- Link variables stored as `Int8Array` (±1)
- Single-link update support
- Plaquette product calculation

### `src/lattice/action.ts`
- Wilson action: S = -β Σ P
- Delta-S computation for Metropolis updates

### `src/lattice/monteCarlo.ts`
- Metropolis algorithm with single-link updates
- Thermalization and measurement sweeps
- Configurable measurement frequency

### `src/lattice/observables.ts`
- Average plaquette
- Specific heat (fluctuation-based)
- Wilson loops
- Binder cumulant
- Jackknife error analysis with binning

### `src/lattice/index.ts`
- Module exports

## Design Decisions
- **Field storage**: `Int8Array` for Z₂ link variables (memory efficient vs `number[]`)
- **Single-link updates**: Metropolis algorithm (simpler than cluster algorithms, sufficient for Z₂)
- **Error analysis**: Binning + jackknife for autocorrelation handling

## Commits
- `26684a2` — feat: Z₂ LGT lattice module

## Consumers
- timesarrow T20-TA (see timesarrow project memory-bank)
