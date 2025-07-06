# ts-quantum

A TypeScript library for quantum mechanics calculations and utilities.

## Features

- Quantum state vector operations
- Standard quantum gates (Pauli, Hadamard, CNOT)
- Density matrix operations
- Quantum measurements
- Hilbert space operations
- Hamiltonian evolution
- Quantum information tools
- Angular momentum algebra (J₊, J₋, Jz, J²)
- Wigner symbols (3j, 6j, 9j)
- Angular momentum composition
- Geometric quantum distance calculations

## Core Components

### State Vectors
```typescript
import { StateVector } from './quantum';

// Create a 2-dimensional quantum state
const state = new StateVector(2);

// Create standard basis states
const zeroState = StateVector.computationalBasis(2, 0); // |0⟩
const oneState = StateVector.computationalBasis(2, 1);  // |1⟩
```

### Quantum Gates
```typescript
import { PauliX, Hadamard } from './quantum';

// Apply X gate (NOT gate)
const flippedState = PauliX.apply(zeroState);

// Create superposition with Hadamard
const superposition = Hadamard.apply(zeroState);
```

### Measurements
```typescript
import { measure } from './quantum';

// Measure a state in computational basis
const outcome = measure(state);
console.log(`Measured: ${outcome.value} with probability ${outcome.probability}`);
```

## Installation

```bash
npm install ts-quantum
```

## Requirements

- Node.js >= 14.0.0
- TypeScript >= 4.5.0
- mathjs >= 10.0.0

## Basic Usage

```typescript
import { 
  StateVector,
  PauliX,
  Hadamard,
  measure
} from 'ts-quantum';

// Create a qubit in |0⟩ state
const qubit = StateVector.computationalBasis(2, 0);

// Apply Hadamard gate to create superposition
const superposition = Hadamard.apply(qubit);

// Measure the state
const result = measure(superposition);
```

## API Documentation

The quantum module consists of several key components:

### StateVector
Core class for quantum state manipulation:
- `StateVector(dimension: number)`
- `setState(index: number, value: Complex)`
- `getState(index: number): Complex`
- `innerProduct(other: StateVector): Complex`
- `normalize(): StateVector`

### Quantum Gates
Standard quantum gates:
- `PauliX` - NOT gate
- `PauliY` - Y rotation
- `PauliZ` - Phase flip
- `Hadamard` - Creates superposition
- `CNOT` - Controlled-NOT gate

### Measurement
Quantum measurement operations:
- `measure(state: StateVector)`
- `projectiveMeasurement(state: StateVector, operator: Operator)`

### DensityMatrix
Mixed state operations:
- `DensityMatrix(dimension: number)`
- `trace(): Complex`
- `purity(): number`
- `vonNeumannEntropy(): number`

### Angular Momentum
Comprehensive angular momentum algebra:
- `createJplus(j: number)` - Creates raising operator J₊
- `createJminus(j: number)` - Creates lowering operator J₋
- `createJz(j: number)` - Creates z-component operator Jz
- `createJ2(j: number)` - Creates total angular momentum operator J²
- `createAngularState(j: number, m: number)` - Creates |j,m⟩ eigenstate
- `wignerD(j: number, α: number, β: number, γ: number)` - Wigner D-matrix
- `clebschGordan(j1: number, m1: number, j2: number, m2: number, J: number, M: number)` - CG coefficients
- `wigner3j(j1: number, j2: number, j3: number, m1: number, m2: number, m3: number)` - 3j symbols
- `wigner6j(j1: number, j2: number, j3: number, l1: number, l2: number, l3: number)` - 6j symbols
- `wigner9j(...)` - 9j symbols



### Geometry
Quantum geometric operations:
- `quantumDistance(state1, state2)` - Fubini-Study distance between quantum states
- Geometric measures for quantum state spaces

```typescript
import { quantumDistance } from 'ts-quantum';

const distance = quantumDistance(state1, state2);
```

## Examples

See the `/examples` directory for more detailed usage examples.

## Contributing

Please see CONTRIBUTING.md for guidelines.

## License

MIT License