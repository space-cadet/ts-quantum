# ts-quantum Interactive Simulation Showcase

This directory contains an interactive web-based showcase of the ts-quantum library's capabilities. **All simulations use the actual ts-quantum library functions compiled to browser-compatible JavaScript.**

## How It Works

The showcase uses a three-part architecture:

1. **simulations.ts** - TypeScript module that imports and uses real ts-quantum functions
2. **bundle.js** - Compiled JavaScript bundle (created with esbuild) that runs in browsers
3. **showcase.html** - Interactive web page that loads the bundle and calls the simulations

## Quick Start

Simply open `showcase.html` in a modern web browser. All simulations run entirely in the browser with the actual ts-quantum library code.

```bash
# To rebuild the bundle after modifying simulations.ts:
pnpm build  # First build the library
node web/build-bundle.js  # Then bundle for the web
```

## Simulations

The showcase includes 7 interactive simulations, each powered by real ts-quantum library functions:

### 1. **Bell State Creator**
- **Library Functions Used:**
  - `createBellState()` - Creates Bell states (Φ⁺, Φ⁻, Ψ⁺, Ψ⁻)
  - `entanglementEntropy()` - Calculates entanglement entropy
  - `StateVector.amplitudes` - Access state components

- **Features:**
  - Create maximally entangled two-qubit states
  - Visualize measurement probabilities
  - View state vectors and entanglement metrics

**Mathematics:** Bell states are maximally entangled pure states with entanglement entropy S = ln(2)

### 2. **Quantum Gate Visualizer**
- **Library Functions Used:**
  - `PauliX`, `PauliY`, `PauliZ` - Pauli operators
  - `Hadamard` - Hadamard gate
  - `PhaseGate`, `TGate` - Phase and T gates
  - `.apply(state)` - Gate application

- **Features:**
  - Apply fundamental quantum gates to initial states
  - Observe amplitude transformations
  - Visualize gate effects on |0⟩, |1⟩, |+⟩ states

**Mathematics:** Unitary transformations preserving normalization and hermiticity

### 3. **Entanglement Analysis**
- **Library Functions Used:**
  - `entanglementEntropy()` - Calculates von Neumann entropy
  - `concurrence()` - Bipartite entanglement measure
  - `negativity()` - PPT criterion for entanglement
  - `DensityMatrixOperator` - Mixed state representation

- **Features:**
  - Analyze two-qubit states with multiple entanglement measures
  - Compare product states, Bell states, and partial entanglement
  - Classify entanglement type

**Mathematics:**
- Entropy: S = -Σ λᵢ ln(λᵢ)
- Concurrence: C = max(0, λ₁ - Σᵢ>₁ λᵢ)
- Negativity: N = (||ρ_T_A|| - 1) / 2

### 4. **Multi-Qubit States**
- **Library Functions Used:**
  - `createGHZState()` - Creates GHZ states
  - `createWState()` - Creates W states
  - `StateVector` - Multi-qubit state representation
  - `.dimension` - Hilbert space dimension

- **Features:**
  - Generate genuine multi-partite entangled states
  - Compare GHZ and W entanglement structures
  - View basis component distributions

**Mathematics:**
- GHZ: |GHZ_n⟩ = 1/√2 (|0⟩^⊗n + |1⟩^⊗n)
- W: |W_n⟩ = 1/√n Σᵢ |i⟩

### 5. **Angular Momentum States**
- **Library Functions Used:**
  - `createJmState(j, m)` - Creates |j,m⟩ states
  - `createJz(j)` - Z-component operator
  - `createJ2(j)` - Total angular momentum operator
  - `jmExpectationValue()` - Eigenvalue calculation

- **Features:**
  - Create spin-1/2 and spin-1 eigenstates
  - Calculate operator eigenvalues
  - Explore angular momentum algebra

**Mathematics:**
- Eigenvalue equations:
  - Jz|j,m⟩ = ℏm|j,m⟩
  - J²|j,m⟩ = ℏ²j(j+1)|j,m⟩

### 6. **Quantum Circuit Simulator**
- **Library Functions Used:**
  - `createBasisState()` - Initial state |00⟩
  - `Hadamard.extend(n)` - Extended single-qubit gate
  - `CNOT` - Two-qubit entangling gate
  - `.apply()` - Gate application

- **Features:**
  - Build Bell states step-by-step
  - Visualize quantum circuit evolution
  - See how quantum entanglement is created

**Circuit:** |00⟩ → (H₁ ⊗ I₂) → CNOT → |Φ⁺⟩

### 7. **Quantum Fidelity Analyzer**
- **Library Functions Used:**
  - `innerProduct()` - State overlap calculation
  - `createBasisState()` - Basis states
  - `createPlusState()` - Superposition states

- **Features:**
  - Compare quantum states using overlap
  - Calculate fidelity measures
  - Quantify state similarity

**Mathematics:** Fidelity: F(ψ, φ) = |⟨ψ|φ⟩|²

## File Structure

```
web/
├── showcase.html           # Main interactive page (OPEN THIS!)
├── simulations.ts          # TypeScript simulation code
├── bundle.js              # Compiled browser bundle (3.1 MB)
├── bundle.js.map          # Source map for debugging
├── README.md              # This file
└── build-bundle.js        # Build script (for rebuilding bundle)
```

## Building the Bundle

The bundle.js file is pre-built and ready to use. To rebuild it after modifying simulations.ts:

```bash
# From project root
pnpm install  # Ensure dependencies
pnpm build    # Build ts-quantum library
node web/build-bundle.js  # Bundle for web
```

The build script uses esbuild to:
1. Import ts-quantum library functions from dist/
2. Include all mathjs dependencies
3. Create browser-compatible JavaScript bundle
4. Generate source maps for debugging

## Technical Stack

- **Language:** TypeScript with actual ts-quantum imports
- **Compilation:** esbuild for browser bundling
- **Runtime:** Vanilla JavaScript (no frameworks)
- **Browser Support:** All modern browsers (ES2020+)
- **Dependencies:** All included in bundle (mathjs, ts-quantum)

## Real Library Usage Examples

### Bell State Example
```typescript
// From simulations.ts
const bellState = createBellState('Phi+');  // Real library call
const entropy = entanglementEntropy(bellState, 2, 2);  // Real calculation
```

### Gate Application Example
```typescript
// From simulations.ts
let resultState = PauliX.apply(initialState);  // Real gate
resultState = Hadamard.apply(resultState);     // Real transformation
```

### Angular Momentum Example
```typescript
// From simulations.ts
const state = createJmState(0.5, 0.5);      // Real |1/2, +1/2⟩ state
const jz = createJz(0.5);                   // Real Jz operator
const eigenval = jmExpectationValue(jz, 0.5, 0.5);  // Real eigenvalue
```

## Key Features

✅ **Real Library Execution** - All calculations use actual ts-quantum functions
✅ **Browser-Based** - Runs entirely in the browser, no server needed
✅ **Interactive** - Real-time simulation with instant results
✅ **Educational** - Learn quantum mechanics by seeing real calculations
✅ **Source Maps** - Debug using TypeScript source with bundle.js.map

## Performance

- Bundle Size: 3.1 MB (includes mathjs)
- Execution: Instant (runs on client machine)
- Supported Systems: Up to ~15 qubits effectively
- Memory: Varies with state size, typically < 100 MB

## Debugging

1. Open `showcase.html` in a browser
2. Open Developer Tools (F12)
3. Check Console for any errors
4. Use Source Maps to see TypeScript source
5. Check Network tab to verify bundle.js loaded

## Integration with Projects

To use these simulations in your own project:

1. Include the bundle: `<script src="bundle.js"></script>`
2. Call functions: `window.simulations.generateBellState('Phi+')`
3. Or use TypeScript by building the library for your target environment

## Limitations

- Browser environment limits to JavaScript number precision
- Large quantum systems (>15 qubits) may be slow
- Complex entanglement calculations use numerical methods
- Some advanced features may need Node.js environment

## Future Enhancements

- [ ] Real-time Bloch sphere visualization
- [ ] Circuit diagram rendering
- [ ] Animated time evolution
- [ ] 3D multi-qubit visualizations
- [ ] Export state vectors to JSON
- [ ] Performance benchmarking tools

## Mathematics References

All implementations follow standard quantum mechanics:

- Dirac Notation: |ψ⟩ ∈ ℂⁿ (state vectors in Hilbert spaces)
- Unitary Operators: U†U = I (preserve normalization)
- Born Rule: P(x) = |⟨x|ψ⟩|² (measurement probabilities)
- Eigenvalue Equation: Â|ψ⟩ = λ|ψ⟩ (operator eigenstates)
- Entanglement Entropy: S = -Tr(ρ ln ρ) (information measure)

## Support

- **Issues:** https://github.com/space-cadet/ts-quantum/issues
- **Documentation:** See ../docs/ directory
- **Examples:** See ../examples/ directory
- **Library:** https://github.com/space-cadet/ts-quantum

## License

This showcase is part of ts-quantum, distributed under the MIT License.

---

**Version:** 0.9.0
**Created:** January 2026
**Powered by:** ts-quantum - TypeScript Quantum Mechanics Library
