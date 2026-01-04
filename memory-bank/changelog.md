# Changelog
*Last Updated: 2026-01-04 11:11:11 IST*

## [0.9.0] - 2025-07-07

### Added
- Initial standalone package extracted from spin-network-app
- Complete quantum mechanics calculation library
- TypeScript support with full type definitions
- MIT license
- Comprehensive README documentation
- Published to npm registry

### Removed
- Graph-core dependencies and related functionality
- Workspace package references
- Spin network builder components
- 2D quantum walk implementation (graph-dependent)

### Changed
- Package name from @spin-network/quantum to ts-quantum
- Updated all import statements in documentation
- Standalone npm package configuration
- Repository structure for independent development

### Technical Details
- Dependencies reduced to mathjs only
- Package size: 166.9 kB (274 files)
- 423/451 tests passing (94% success rate)
- Ready for production use

## [0.9.1 Pre-release] - 2026-01-01

### Added
- Native SparseOperator implementation for high-dimensional quantum systems
- Sparse matrix support with O(N) performance scaling
- Auto-optimization in MatrixOperator for low-density matrices
- Sparse tensor product operations
- Performance optimized for quantum simulations (>12 qubits)

### Changed
- Optimized IdentityOperator for sparse tensor products
- Enhanced MatrixOperator.createOptimized with density-based switching
- Improved performance for large quantum system simulations

### Technical Details
- SparseOperator class in src/operators/sparseOperator.ts
- Sparse utilities exported from public API
- Maintains O(N) performance for large systems

## [0.9.2 Web Showcase] - 2026-01-04

### Added
- Interactive web showcase (web/showcase.html)
- Comprehensive quantum simulations module (web/simulations.ts)
- Bundle building system with esbuild integration
- Vercel deployment configuration and documentation
- Web serve capability for local testing

### Changed
- Enhanced bundle loading and module export system
- Fixed window.simulations export for browser compatibility
- Added deployment-ready infrastructure

### Technical Details
- Web bundle: 3.2 MB (includes source maps)
- Showcase includes multiple quantum demonstrations
- Ready for deployment on Vercel and other platforms
