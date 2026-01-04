# ts-quantum Interactive Simulation Showcase

This directory contains an interactive web-based showcase of the ts-quantum library's capabilities. The showcase demonstrates quantum mechanics simulations using actual ts-quantum functionality.

## Features

The showcase includes 10 interactive simulations showcasing different aspects of the library:

### 1. **Bell State Creator**
- Create and analyze the four Bell states (maximally entangled two-qubit states)
- Visualize measurement probabilities
- Calculate entanglement entropy
- Shows: Φ⁺, Φ⁻, Ψ⁺, Ψ⁻ states

**Demonstrates:** Quantum entanglement, basis states, quantum state properties

### 2. **Quantum Gate Visualizer**
- Apply fundamental quantum gates to arbitrary initial states
- Visualize amplitude changes after gate application
- Explore how gates transform quantum states
- Supports: Pauli X/Y/Z, Hadamard, Phase S, T gates

**Demonstrates:** Unitary transformations, gate algebra, quantum state evolution

### 3. **Measurement Simulator**
- Create superposition states with adjustable probability ratios
- Simulate 1000 measurements to verify Born rule
- Interactive probability slider
- Observe statistical distributions

**Demonstrates:** Quantum measurement, Born rule, state collapse

### 4. **Entanglement Analysis**
- Analyze two-qubit states using multiple entanglement measures:
  - **Entanglement Entropy**: Quantifies information loss
  - **Concurrence**: Bipartite entanglement measure
  - **Negativity**: Detects non-separability
- Classify entanglement type

**Demonstrates:** Quantum information theory, entanglement detection, mixed states

### 5. **Multi-Qubit States**
- Generate GHZ and W states
- Visualize multi-particle entanglement
- Compare different entanglement structures
- Analyze basis component distributions

**Demonstrates:** Multi-particle systems, tensor products, composite quantum states

### 6. **Angular Momentum States**
- Create angular momentum eigenstates |j,m⟩
- Explore spin-1/2, spin-1, and spin-3/2 systems
- Calculate eigenvalues for Jz and J² operators
- Angular momentum algebra basics

**Demonstrates:** Angular momentum operators, SU(2) algebra, spin systems

### 7. **Quantum Circuit Simulator**
- Build quantum circuits step-by-step
- Create Bell states using Hadamard + CNOT gates
- Visualize state evolution through circuit
- Understand quantum circuit construction

**Demonstrates:** Quantum circuit gates, CNOT entanglement, circuit design

### 8. **Superposition Explorer**
- Create arbitrary single-qubit superpositions
- Control amplitude and phase relationships
- Visualize complex amplitude distributions
- Interactive phase control

**Demonstrates:** Quantum superposition, complex amplitudes, Bloch sphere concepts

### 9. **Quantum Fidelity & Distance Measures**
- Compare quantum states using multiple metrics
- Calculate fidelity between states
- Compute trace distance
- Measure similarity percentages

**Demonstrates:** Quantum state comparison, distance metrics, state space geometry

### 10. **Measurement Probabilities** (Interactive)
- Dynamically adjust superposition parameters
- Observe probability distributions
- Verify quantum mechanical predictions

**Demonstrates:** Probability amplitudes, quantum measurements

## How to Use

### View the Showcase

1. Open `index.html` in a modern web browser
2. The page will load with all simulations visible
3. Use navigation buttons to filter by category:
   - **All Simulations** - Show all demonstrations
   - **Basic States** - Fundamental quantum concepts
   - **Quantum Gates** - Gate operations and transformations
   - **Entanglement** - Multi-qubit and entanglement measures
   - **Dynamics** - Time evolution and quantum circuits
   - **Advanced** - Angular momentum and complex operations

### Interact with Simulations

Each simulation card includes:
- **Description**: Brief explanation of the quantum concept
- **Info Box**: Key quantum mechanics principles
- **Controls**: Sliders, dropdowns, and buttons to configure the simulation
- **Results**: Displays simulation outcomes and measurements
- **Equations**: Mathematical representations of quantum operations

### Example Interactions

1. **Bell State Creator**:
   - Select a Bell state from the dropdown
   - Click "Create State"
   - View the state vector and entanglement properties

2. **Gate Visualizer**:
   - Choose an initial state (|0⟩, |1⟩, |+⟩, etc.)
   - Click a quantum gate button
   - See how the state transforms

3. **Entanglement Analysis**:
   - Select a two-qubit state
   - Click "Analyze"
   - Compare entanglement measures (entropy, concurrence, negativity)

## Technical Details

### Technology Stack
- **Pure HTML/CSS/JavaScript** - No external dependencies required
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern CSS Grid** - Professional layout system
- **Interactive Visualizations** - Real-time state calculations

### Browser Compatibility
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance
- All simulations compute instantly in the browser
- Client-side only - no network requests needed
- Optimized for systems up to ~15 qubits

## Integration with ts-quantum

This showcase is designed to be updated with actual ts-quantum library calls for production use. Currently, the simulations use JavaScript implementations of quantum mechanics calculations.

To integrate with the actual ts-quantum library:

1. Build the ts-quantum library:
   ```bash
   pnpm build
   ```

2. Bundle the library for browser use using a bundler (Webpack, Vite, etc.)

3. Update JavaScript functions in the `<script>` section to import and use actual ts-quantum functions:
   ```javascript
   import { StateVector, Hadamard, createBellState } from 'ts-quantum';

   function generateBellState() {
       const state = createBellState('Phi+');
       // ... use actual library
   }
   ```

## Quantum Concepts Covered

### Core Concepts
- **Quantum States**: Superposition, normalization, amplitude
- **Quantum Gates**: Unitary transformations, gate algebr
- **Measurement**: Born rule, wave function collapse, projectors
- **Entanglement**: Schmidt decomposition, Bell states, GHZ/W states

### Advanced Topics
- **Quantum Information**: Entropy, fidelity, distance measures
- **Angular Momentum**: Spin states, ladder operators, coupling
- **Multi-Qubit Systems**: Tensor products, composite states
- **Quantum Circuits**: Gate sequences, state preparation

## Educational Value

This showcase is ideal for:
- **Learning quantum mechanics** - Visual demonstrations of abstract concepts
- **Understanding ts-quantum** - Practical examples of library usage
- **Quantum computing education** - Interactive exploration of key principles
- **Algorithm prototyping** - Testing quantum concepts before implementation

## Mathematics References

All simulations are based on standard quantum mechanics:
- State vectors in Hilbert space: |ψ⟩ ∈ ℂⁿ
- Unitary operators: U†U = I
- Born rule: P(x) = |⟨x|ψ⟩|²
- Entanglement entropy: S = -Σᵢ λᵢ ln(λᵢ)
- Fidelity: F(ρ,σ) = Tr(√(√ρ σ √ρ))²

## Source Code Structure

```
web/
├── index.html          # Main simulation showcase
├── README.md          # This file
└── (styles & scripts are embedded in index.html)
```

## Future Enhancements

Potential improvements to the showcase:
- [ ] Export state vectors to JSON/CSV
- [ ] Visualization of quantum walks
- [ ] Real-time Bloch sphere visualization
- [ ] 3D visualization of multi-qubit systems
- [ ] Circuit diagram rendering
- [ ] Animation of time evolution
- [ ] Custom state input interface
- [ ] Performance benchmarking tools

## Support

For questions or issues:
- Check the [ts-quantum documentation](../docs/)
- Review [example programs](../examples/)
- Visit the [GitHub repository](https://github.com/space-cadet/ts-quantum)

## License

This showcase is part of ts-quantum, distributed under the MIT License.

---

**Version:** 0.9.0
**Last Updated:** January 2026
**Library:** ts-quantum - TypeScript Quantum Mechanics Library
