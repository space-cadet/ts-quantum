# ts-quantum Memory Bank Update — 2026-06-25

## Changes Made

### tasks.md
- Added T21: Checkpointing + Worker Thread Support — IN PROGRESS
- Updated Last Updated timestamp

### activeContext.md
- Updated Current Focus from T14 → T21
- Added T21 scope and status
- Documented T20 Phase 1 completion (L=16 results validated)
- Recorded design decisions: coarse checkpointing first, worker threads over Rust/WASM

### tasks/T21-checkpointing.md (NEW)
- Full task specification for checkpointing module
- API design for CheckpointManifest, saveCheckpoint, loadCheckpoint
- Worker thread API outline
- Acceptance criteria
- Dependencies and related tasks

## Rationale

T21 is a **ts-quantum library feature**, not just a timesarrow simulation script. The checkpointing module (`src/lattice/checkpoint.ts`) and worker thread utilities will live in ts-quantum because:

1. **General-purpose**: Any lattice simulation (not just Z₂) can use checkpointing
2. **Library responsibility**: State serialization is a primitive concern
3. **Reusability**: Future simulations (T22 spin foam, T24 domain walls) will need the same capability

The timesarrow side (T21-TA) handles orchestration scripts — assigning β values to workers, collecting results, updating numerics pages.

## Cross-Project Coordination

| Concern | ts-quantum (library) | timesarrow (simulation) |
|---------|---------------------|------------------------|
| Checkpoint module | `src/lattice/checkpoint.ts` | Import and use |
| Worker thread API | Export utilities | `scripts/t20-z2-lgt-phase1-main.ts` |
| Validation | L=8 unit test | Full parameter sweep comparison |
| Documentation | API docs | Numerics page with results |
