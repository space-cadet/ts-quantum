# Active Context
*Last Updated: 2026-06-25 04:58 IST*

## Current Focus
**T21**: Checkpointing + Worker Thread Support for lattice gauge theory simulations.

**Status**: 🔄 Planning complete, implementation pending.

**Scope**:
- `src/lattice/checkpoint.ts` — Save/resume simulation state
- Worker thread wrappers for parallel β sweeps
- Validation: L=8 results must match single-threaded version

## Previous Work (T20)
Z₂ Lattice Gauge Theory module complete:
- `src/lattice/geometry.ts` — Lattice types (2D square, triangular, 3D cubic)
- `src/lattice/gaugeField.ts` — Z2GaugeField with toJSON/fromJSON
- `src/lattice/action.ts` — Wilson action
- `src/lattice/monteCarlo.ts` — Metropolis algorithm
- `src/lattice/observables.ts` — Plaquette, specific heat, Wilson loops, Binder cumulant, jackknife error

## Integration with timesarrow
- ts-quantum serves as general-purpose LQG library
- timesarrow-numerics imports ts-quantum for domain-specific calculations
- T20 Phase 1 complete: L=16, 18 β values, 100k sweeps, errors ~0.0005

## Design Decisions
- Coarse checkpointing first (per-β completion tracking)
- Fine-grained checkpointing deferred until L≥32 needed
- Worker threads over Rust/WASM for T21 (parallel β sweeps, not inner loop optimization)

### Session Work (2 sessions, 12:30-18:35 IST, May 16)
1. **Showcase v2 Foundation** — Modular HTML/CSS/JS architecture with component system
2. **Qubit Playground** — Interactive Bloch sphere, gate buttons, measurement
3. **Quantum Walk Explorer** — Side-by-side quantum vs classical walk
4. **Entanglement Lab** — Density matrix, entanglement measures, CHSH test
5. **Critical Bug Fix** — `partialTrace` trace range corrected (entropy/Schmidt coefficients fixed)
6. **Page Unification** — docs/index.html and web/showcase.html use v2 design system
7. **GitHub Pages** — Auto-deployment with .nojekyll, all pages accessible

### Technical Achievements
- **Zero custom quantum math** — All demos use ts-quantum exports only
- **Modular architecture** — Shared components: layout.css, layout.js, sidebar.html, top-bar.html
- **Responsive design** — Mobile hamburger, desktop collapse, overlay click-to-close
- **Theme system** — Light/dark toggle with CSS variables, persists to localStorage
- **Build integration** — esbuild bundles + auto-copy to docs/

### Files Created/Modified (T13)
- **New**: 13 files (showcase-v2 HTML, CSS, JS, demos, components, docs/.nojekyll)
- **Modified**: 4 files (operator.ts partialTrace fix, showcase.html, docs/index.html, build-bundle.js)
- **Commits**: 6 commits from fecd6df to 9d61bbd

## Implementation Status (T13: COMPLETED)
- ✅ Qubit Playground demo with Bloch sphere
- ✅ Quantum Walk Explorer with variance chart
- ✅ Entanglement Lab with density matrix heatmap
- ✅ partialTrace critical bug fixed
- ✅ Shared component architecture
- ✅ All pages unified under v2 design
- ✅ GitHub Pages deployment verified
- ✅ Mobile sidebar (hamburger + overlay)
- ✅ Desktop sidebar collapse
- ✅ Theme toggle (light/dark)

## Design Summary (T13)
**Scope**: Complete showcase redesign with 3 interactive demos
**Method**: Modular components + esbuild bundles
**Verification**: Browser testing, GitHub Pages deployment
**Impact**: Modern, responsive, maintainable web showcase

## Memory Bank Protocol Status
- ✅ Step 0: Identified relevant files
- ✅ Step 1: Determined current time (2026-05-16 18:35 IST)
- ✅ Step 2: Created T13 task file
- ✅ Step 3: Updated tasks.md registry
- ✅ Step 4: Created edit chunk (183500-T13.md)
- ✅ Step 5: Updated activeContext.md
- ✅ Step 6: Updated session_cache.md
- ✅ Step 7: Commit changes (ready)

## Next Steps
- Add more demo modules (angular momentum, circuit builder)
- Deploy to custom domain
- Add S, T, Rx, Ry gates to ts-quantum exports
- Resume T10 Phase 2 (2D quantum walks)

## Impact on Project
The T13 showcase redesign ensures:
- **User Experience**: Modern, responsive, interactive demos
- **Maintainability**: Modular components, no code duplication
- **Correctness**: partialTrace bug fixed, all tests passing
- **Accessibility**: Mobile-friendly, theme toggle, GitHub Pages deployed

## Previous Context (T12: Bug Fixes - 2026-05-16 Morning)
Successfully restored test suite to 100% passing (451/451). Fixed 29 failing tests across Wigner symbols, angular momentum, matrix operations, and integration tests.

## Previous Context (T11: QRW Sidebar - 2026-01-08)
Successfully implemented collapsible sidebar navigation with educational content for the QRW demo. All T11 work complete.
