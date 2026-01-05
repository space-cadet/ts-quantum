# QRW Demo Page Implementation Design
*Created: 2026-01-05 18:58:00 IST*
*Last Updated: 2026-01-05 18:58:00 IST*

## Overview

Dedicated quantum random walk (QRW) demo page extending T9's 1D implementation to support multiple walk variants, coin operators, and boundary conditions. Focus on understanding classical limits and potential emergence of diffusion/telegraph equations.

## Architecture

### Page Structure

**Sidebar Navigation**:
- New category: "Quantum Walks" (collapsible)
- Links:
  - "1D Walks" → `#qrw-1d-demo`
  - "2D Walks" → `#qrw-2d-demo`
  - "Comparison" → `#qrw-comparison-demo`
  - "Analysis Tools" → `#qrw-analysis-demo`

**Main Content Area**:
- Tab-based interface or vertical stacking
- Each section: description + interactive controls + visualization

### Component Layout

```
QRW Demo Page
├── 1D Walk Section
│   ├── Controls: lattice size, steps, coin type, boundaries
│   ├── Buttons: Initialize, Step, Run, Cancel, Reset
│   ├── SVG visualization: probability distribution
│   └── Statistics: COM, variance, probability conservation
├── 2D Walk Section
│   ├── Controls: width, height, steps, coin type, boundaries
│   ├── Buttons: Initialize, Step, Run, Cancel, Reset
│   ├── SVG visualization: 2D heatmap or 3D view
│   └── Statistics: spreading metrics
├── Comparison Section
│   ├── Controls: walk type, steps, coin
│   ├── Dual visualization: quantum vs classical
│   ├── Variance growth curves (overlay plot)
│   └── Spreading rate analysis
└── Analysis Tools
    ├── Probability distribution snapshots
    ├── Classical limit extraction
    ├── Variance vs time plot
    └── Export options
```

## Simulation Functions (web/simulations.ts)

### 1D Walk Variants

```typescript
// Hadamard coin (1D) - existing from T9
initializeQuantumWalk1D(latticeSize)
stepQuantumWalk1D()
runQuantumWalk1D(latticeSize, numSteps)
resetQuantumWalk1D()
getQuantumWalk1DState()

// Grover coin (1D) - NEW
initializeQuantumWalk1DGrover(latticeSize)
stepQuantumWalk1DGrover()
getQuantumWalk1DGroverState()

// Periodic boundary conditions (1D) - NEW
initializeQuantumWalk1DPeriodic(latticeSize)
stepQuantumWalk1DPeriodic()
getQuantumWalk1DPeriodicState()
```

### 2D Walk Variants

```typescript
// Hadamard-based 4-direction coin (2D) - NEW
initializeQuantumWalk2D(width, height)
stepQuantumWalk2D()
runQuantumWalk2D(width, height, numSteps)
getQuantumWalk2DState()

// Grover coin (2D) - NEW
initializeQuantumWalk2DGrover(width, height)
stepQuantumWalk2DGrover()
getQuantumWalk2DGroverState()

// Periodic boundaries (2D toroidal) - NEW
initializeQuantumWalk2DPeriodic(width, height)
stepQuantumWalk2DPeriodic()
getQuantumWalk2DPeriodicState()
```

### Classical Walk Reference

```typescript
// Classical random walk (1D) for comparison
initializeClassicalWalk1D(latticeSize)
stepClassicalWalk1D()
getClassicalWalk1DState()

// Classical random walk (2D) for comparison
initializeClassicalWalk2D(width, height)
stepClassicalWalk2D()
getClassicalWalk2DState()
```

### Analysis Functions

```typescript
// Variance and spreading analysis
calculateVarianceGrowth(quantumData, classicalData): Array<{step, quantumVar, classicalVar}>

// Extract probability distributions at specific steps
getDistributionSnapshot(step): Array<{position, probability}>

// Compare quantum vs classical spreading
compareSpreadingRates(steps): {quantumRate, classicalRate, advantage}

// Statistical analysis
analyzeClassicalLimits(data): {scaling, fits}
```

## State Management

### Global Buffers

For 1D:
```typescript
interface QuantumWalk1DBuffer {
  state: StateVector
  coinOp: MatrixOperator
  shiftOp: SparseOperator
  latticeSize: number
  currentStep: number
  history: QuantumWalk1DData[]
}
```

For 2D:
```typescript
interface QuantumWalk2DBuffer {
  state: StateVector
  coinOp: MatrixOperator (4×4 for 2D)
  shiftOp: SparseOperator
  width: number
  height: number
  currentStep: number
  history: QuantumWalk2DData[]
}
```

Classical walk buffer similar structure with probability instead of amplitudes.

## State Space Structure

### 1D Walk
- Hilbert space: H_coin ⊗ H_position
- Coin: 2D (|LEFT⟩, |RIGHT⟩)
- Position: 1D lattice (N positions)
- Total dimension: 2N

### 2D Walk
- Hilbert space: H_coin ⊗ H_position
- Coin: 4D (|UP⟩, |DOWN⟩, |LEFT⟩, |RIGHT⟩)
- Position: 2D lattice (width × height positions)
- Total dimension: 4 × width × height

## Boundary Conditions

### Reflecting (Default)
- Coin state flips at boundary
- Preserves unitarity
- Physically meaningful quantum reflection

### Periodic (Toroidal)
- Lattice wraps around (torus topology)
- No boundary effects
- Enables study of bulk properties

## Visualization Strategy

### 1D Visualization
- SVG bar chart (from T9)
- X-axis: lattice positions
- Y-axis: probability magnitude
- Color intensity: probability density
- Red dashed line: center of mass

### 2D Visualization
- SVG heatmap or 2D grid
- Color represents probability magnitude
- Can use grayscale intensity
- Optional 3D surface plot (WebGL future)

### Comparison Plot
- Dual-axis or side-by-side
- X-axis: evolution steps
- Y-axis: variance
- Blue curve: quantum (∝ t²)
- Red curve: classical (∝ t)
- Shaded region: quantum advantage area

## Coin Operators

### 1D Coins

**Hadamard**:
```
C = (1/√2) [ 1   1 ]
            [ 1  -1 ]
```

**Grover**:
```
C = [-1  2 ] / √(5)  [shifted phase version]
    [ 2   1 ]
```

### 2D Coins

**Hadamard 4-direction**:
```
4×4 matrix based on 2D Hadamard construction
Maps 4 coin directions to superposition
```

**Grover 4-direction**:
```
Alternative 4×4 coin for enhanced spreading
```

## Performance Characteristics

### 1D Performance
- Lattice 31×1 (dimension 62): <5ms per step
- Animation: 500ms step + computation
- Memory: O(N) with sparse shift operator

### 2D Performance
- Lattice 15×15 (dimension 900): <20ms per step
- Lattice 31×31 (dimension 3844): <100ms per step (may require optimization)
- Memory: O(N×M) with sparse shift operator
- For larger: implement matrix-free evolution

## Data Structures

### QuantumWalk1DData
```typescript
{
  step: number
  probabilities: Array<{position, probability}>
  centerOfMass: number
  variance: number
  totalProbability: number
  maxProbability: number
}
```

### QuantumWalk2DData
```typescript
{
  step: number
  probabilities: Array<{x, y, probability}>
  centerOfMass: {x, y}
  variance: {x, y}
  spreadingRadius: number
  totalProbability: number
}
```

### ClassicalWalkData
```typescript
{
  step: number
  probabilities: Array<{position, probability}> // 1D
  centerOfMass: number
  variance: number
}
```

## Integration with ts-quantum Library

### Used Components
- StateVector class
- MatrixOperator for coin operators
- SparseOperator for shift operators
- tensorProduct() method
- normalize() for state normalization
- apply() for operator application
- math.js for complex arithmetic

### No Additional Dependencies
- Leverages existing infrastructure
- Pure TypeScript implementation

## Control Panel Design

### 1D Walk Controls
```
┌─ 1D Quantum Walk ─────────────────────┐
│ Coin Type:        [Hadamard ▼]       │
│ Lattice Size:     [11        ↕]      │
│ Boundaries:       [Reflecting ▼]      │
│ Max Steps:        [100      ↕]       │
│                                       │
│ [Initialize] [Step] [Run] [Reset]   │
│               [Cancel]               │
│                                       │
│ Status: 23/100 steps (23%)            │
│ P_total: 1.0000 | COM: 5.5 | σ²: 12.4│
└───────────────────────────────────────┘
```

### 2D Walk Controls
```
┌─ 2D Quantum Walk ─────────────────────┐
│ Coin Type:        [Hadamard ▼]       │
│ Width:            [11        ↕]      │
│ Height:           [11        ↕]      │
│ Boundaries:       [Reflecting ▼]      │
│ Max Steps:        [100      ↕]       │
│                                       │
│ [Initialize] [Step] [Run] [Reset]   │
│               [Cancel]               │
│                                       │
│ Status: 23/100 steps (23%)            │
│ Spreading: 8.3 | σ²_x: 12.4 σ²_y: 11.9
└───────────────────────────────────────┘
```

## Classical Limit Analysis

### Variance Growth Extraction
Track variance as function of time:
- **Quantum**: σ²(t) ∝ t² (quadratic spreading)
- **Classical**: σ²(t) ∝ t (linear spreading)

### Diffusion Equation Emergence
For classical limit:
- Initial distribution sharply peaked
- Evolve for T steps
- Fits to diffusion equation form: P(x,t) ∝ exp(-x²/(4Dt))
- Extract diffusion coefficient D

### Telegraph Equation Signals
In intermediate regime:
- Look for velocity terms
- Directional memory in spreading
- Potential emergence of wave-like behavior

## Testing Strategy

### Unit Tests
- Probability conservation (all variants)
- Operator unitarity
- Boundary condition correctness
- Dimension validation

### Integration Tests
- Step vs batch evolution equivalence
- State normalization throughout
- Animation frame correctness
- HTML/JS handler responsiveness

### Visualization Tests
- SVG rendering accuracy
- Chart updates match statistics
- Color scaling correctness
- Responsive layout on different screens

### Performance Benchmarks
- Time per step (1D: <5ms, 2D: <20ms)
- Memory usage (< 100MB for 31×31)
- Animation smoothness (60fps target)

## Browser Requirements
- ES2020 support
- SVG rendering
- Async/await
- setTimeout precision
- DOM manipulation

## Future Enhancements
1. 3D quantum walks with WebGL visualization
2. Custom coin operator designer (UI)
3. Decoherence models and noise
4. Multi-walker entangled systems
5. Data export (CSV, JSON)
6. Real-time performance profiling
7. Animated variance curve
8. Phase space visualization
