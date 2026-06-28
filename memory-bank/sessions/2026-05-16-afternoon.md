# Session: 2026-05-16 Afternoon

**Started**: -
**Focus Task**: T13 (Showcase v2) + T12 continuation (partialTrace fix)*
**Status**: ✅ UNKNOWN

## Work Done

# T13: Showcase v2 — Interactive Quantum Simulations Redesign

*Session: 2026-05-16 12:30–18:35 IST*
*Focus: T13 (Showcase v2) + T12 continuation (partialTrace fix)*

## Work Log

### 12:30–14:00 IST — Showcase v2 Foundation
- Analyzed existing showcase architecture (showcase.html 1528 lines inline, simulations.ts ~1600 lines)
- Designed modular architecture: HTML shell + CSS + JS demo modules
- Created `web/showcase-v2/index.html` with component placeholders
- Created `web/showcase-v2/css/showcase.css` with light theme variables
- Set up esbuild entry point in `web/build-bundle.js`

### 14:00–15:30 IST — Demo Development (Subagents)
- Spawned parallel subagents for demo modules:
  - `qubit-playground.ts` — Interactive Bloch sphere, gate buttons
  - `quantum-walk.ts` — Quantum vs classical walk with variance chart
  - `entanglement-lab.ts` — Density matrix, entanglement measures, CHSH
- Fixed import paths: `../../../../src/index` (4 levels up for esbuild)
- Fixed Canvas DPR scaling: use `clientWidth/Height` after `ctx.scale(dpr, dpr)`
- Fixed auto-load bug: initialize `currentDemoId` to `''` not default ID

### 15:30–16:00 IST — Critical Bug Discovery & Fix
- **Discovered**: `partialTrace` returns trace=2 instead of 1 for 2⊗2 system
- **Root cause**: `traceRange` used `this.dimension` (4) instead of `traceOutDim` (2)
- **Impact**: Negative entropy (-1.3863), Schmidt coefficients > 1 (1.414)
- **Fix**: Changed to `Array(traceOutDim).fill(0).map((_, i) => i)`
- **Verification**: All 451 tests pass; Bell state entropy = ln(2) ✅

### 16:00–18:00 IST — Page Unification & Polish
- Created shared components in `web/showcase-v2/components/`:
  - `layout.css` — Base layout, CSS variables, sidebar, top-bar
  - `layout.js` — Component injection, theme toggle, sidebar behavior
  - `sidebar.html` — Reusable sidebar markup
  - `top-bar.html` — Reusable top bar with hamburger
  - `docs.css` — Documentation markdown styles
- Updated `web/showcase.html` (v1) — Replaced 1500-line inline CSS with shared layout
- Updated `docs/index.html` — Full v2 styling, markdown rendering preserved
- Added `.nojekyll` for GitHub Pages
- Added mobile hamburger + overlay click-to-close
- Added sidebar icons for collapsed state (docs page)

### 18:00–18:35 IST — Build, Deploy, Memory Bank
- `pnpm web:build` — All bundles built successfully
- Auto-copy to `docs/` for GitHub Pages
- Git push to origin/main
- Memory bank update: T13 task file, edit chunk, activeContext, session_cache, tasks.md

## Technical Decisions
- **Light theme default** — User explicitly rejected dark theme from previous iteration
- **Modular components** — `loadComponents()` injects sidebar/top-bar dynamically
- **Library-only API** — Zero custom quantum math; all demos use ts-quantum exports
- **Shared layout.css** — All pages (v2, v1, docs) use identical base styles

## Issues Resolved
1. Canvas DPR scaling — Drawing coordinates must use CSS pixels after `ctx.scale(dpr, dpr)`
2. Import path depth — Demos at `web/showcase-v2/js/demos/*.ts` need 4 levels up (`../../../../`)
3. Auto-load race condition — `switchDemo()` guards against redundant switches
4. partialTrace bug — Critical fix for reduced density matrix correctness
5. Mobile sidebar — Hamburger + overlay + click-outside-to-close
6. Desktop collapse — Sidebar toggle with CSS transition

## Verification
- ✅ All 451 tests passing
- ✅ `pnpm build` succeeds
- ✅ `pnpm web:build` succeeds
- ✅ GitHub Pages deployment verified
- ✅ Browser testing: mobile + desktop

## Files Changed
- **Created**: 13 files (showcase-v2 HTML, CSS, JS, demos, components)
- **Modified**: 4 files (operator.ts, showcase.html, docs/index.html, build-bundle.js)
- **Commits**: 6 commits (fecd6df → 9d61bbd)

## Next Steps
- Add more demo modules (angular momentum, circuit builder)
- Deploy to custom domain
- Add S, T, Rx, Ry gates to ts-quantum exports


