# T21 — Checkpointing + Worker Thread Support

**Status**: 🔄 Planning complete, implementation pending
**Created**: 2026-06-25
**Priority**: High

## Objective

Add state serialization (checkpointing) and worker thread support to the lattice gauge theory module. Enable resumable simulations and parallel β sweeps across CPU cores.

## Background

The T20 Phase 1 production run (L=16, 100k sweeps) took ~60 minutes wall-clock for 18 β values. As simulations scale to larger lattices (L=32) and 3D, single-threaded execution becomes a bottleneck. Additionally, long-running simulations risk losing all progress if interrupted.

## Implementation

### Files to Add/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lattice/checkpoint.ts` | Create | Save/resume simulation state |
| `src/lattice/gaugeField.ts` | Modify | Ensure Z2GaugeField serializable (already has toJSON/fromJSON) |
| `src/lattice/index.ts` | Modify | Export checkpoint utilities |

### Checkpointing API

```typescript
interface CheckpointManifest {
  simulationId: string;
  parameters: {
    L: number;
    thermalSweeps: number;
    measureSweeps: number;
    measureEvery: number;
    binSize: number;
  };
  completed: number[];      // β values completed
  results: BetaResult[];
  timestamp: string;
  version: '1.0';
}

export function saveCheckpoint(manifest: CheckpointManifest): void;
export function loadCheckpoint(simulationId: string): CheckpointManifest | null;
export function getRemainingBetas(allBetas: number[], manifest: CheckpointManifest | null): number[];
```

### Worker Thread API

```typescript
// Main thread usage
import { Worker } from 'worker_threads';

async function runParallelSweeps(params: SimulationParams, numWorkers: number): Promise<void>;

// Worker thread entry point
// Receives: { beta, L, thermalSweeps, measureSweeps, measureEvery, binSize }
// Returns: { beta, meanPlaquette, errorPlaquette, numMeasurements }
```

## Acceptance Criteria

- [ ] `checkpoint.ts` module with save/load/resume
- [ ] Worker thread wrapper for parallel β sweeps
- [ ] L=8 validation: results match single-threaded version
- [ ] Performance: 6-8× speedup on 8-core M2 Air
- [ ] Graceful interrupt: checkpoint saved, resume works

## Dependencies

- `Z2GaugeField.toJSON()` / `fromJSON()` — ✅ Already implemented (T20)
- Node.js ≥ 14 (worker_threads) — ✅ Available

## Related

- T20 (timesarrow): Results validated, ready for parallelization
- T21 (timesarrow): Worker thread orchestration scripts
