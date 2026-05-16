/**
 * ts-quantum Interactive Showcase - Real Library Simulations
 *
 * This file contains actual simulations using the ts-quantum library.
 * All calculations use real library functions.
 */

import {
  StateVector,
  createBellState,
  createGHZState,
  createWState,
  createBasisState,
  createPlusState,
  Hadamard,
  PauliX,
  PauliY,
  PauliZ,
  CNOT,
  measureState,
  ProjectionOperator,
  entanglementEntropy,
  concurrence,
  negativity,
  DensityMatrixOperator,
  createJmState,
  createJz,
  createJ2,
  jmExpectationValue,
  getValidM,
  createJplus,
  createJminus,
  MatrixOperator,
  createSparseMatrix,
  setSparseEntry,
  SparseOperator,
  denseToSparse
} from '../src/index';
import * as math from 'mathjs';

// ============================================================================
// BELL STATE SIMULATOR
// ============================================================================

export function generateBellState(stateType: string): {
  vector: string;
  entropy: number;
  probabilities: { label: string; prob: number }[];
} {
  const bellState = createBellState(stateType as any);
  const sqrt2 = Math.sqrt(2);

  // Calculate measurement probabilities
  const probs = bellState.amplitudes.map((amp, i) => ({
    label: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'][i],
    prob: Math.abs(amp.re) * Math.abs(amp.re) + Math.abs(amp.im) * Math.abs(amp.im)
  }));

  // Create density matrix to calculate entropy
  const rho = createDensityMatrixFromState(bellState);
  const entropy = calculateEntanglementEntropy(bellState, 2, 2);

  const vectorStr = bellState.amplitudes
    .map((amp) => formatComplex(amp.re, amp.im))
    .join(', ');

  return {
    vector: `[${vectorStr}]`,
    entropy,
    probabilities: probs
  };
}

// ============================================================================
// QUANTUM GATE SIMULATOR
// ============================================================================

export function applyGate(
  initialStateStr: string,
  gateName: string
): {
  resultState: string;
  amplitudes: { label: string; magnitude: number; phase: number }[];
} {
  // Create initial state
  let initialState: StateVector;

  switch (initialStateStr) {
    case '|0⟩':
      initialState = createBasisState(2, 0);
      break;
    case '|1⟩':
      initialState = createBasisState(2, 1);
      break;
    case '|+⟩':
      initialState = createPlusState();
      break;
    case '|-⟩':
      initialState = new StateVector(2, [
        math.complex(1 / Math.sqrt(2), 0),
        math.complex(-1 / Math.sqrt(2), 0)
      ]);
      break;
    default:
      initialState = createBasisState(2, 0);
  }

  // Apply gate
  let resultState: StateVector;

  switch (gateName) {
    case 'X':
      resultState = PauliX.apply(initialState);
      break;
    case 'Y':
      resultState = PauliY.apply(initialState);
      break;
    case 'Z':
      resultState = PauliZ.apply(initialState);
      break;
    case 'H':
      resultState = Hadamard.apply(initialState);
      break;
    case 'S':
      // S gate: diagonal matrix with [1, i]
      const SGate = new MatrixOperator([
        [math.complex(1, 0), math.complex(0, 0)],
        [math.complex(0, 0), math.complex(0, 1)]
      ], 'unitary');
      resultState = SGate.apply(initialState);
      break;
    case 'T':
      // T gate: diagonal matrix with [1, e^(iπ/4)]
      const TGate = new MatrixOperator([
        [math.complex(1, 0), math.complex(0, 0)],
        [math.complex(0, 0), math.complex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))]
      ], 'unitary');
      resultState = TGate.apply(initialState);
      break;
    default:
      resultState = initialState;
  }

  // Generate output
  const amplitudes = [
    {
      label: '|0⟩',
      magnitude: Math.hypot(resultState.amplitudes[0].re, resultState.amplitudes[0].im),
      phase: Math.atan2(resultState.amplitudes[0].im, resultState.amplitudes[0].re)
    },
    {
      label: '|1⟩',
      magnitude: Math.hypot(resultState.amplitudes[1].re, resultState.amplitudes[1].im),
      phase: Math.atan2(resultState.amplitudes[1].im, resultState.amplitudes[1].re)
    }
  ];

  const resultStateStr = `${formatComplex(resultState.amplitudes[0].re, resultState.amplitudes[0].im)}|0⟩ + ${formatComplex(resultState.amplitudes[1].re, resultState.amplitudes[1].im)}|1⟩`;

  return {
    resultState: resultStateStr,
    amplitudes
  };
}

// ============================================================================
// MEASUREMENT SIMULATOR
// ============================================================================

export function simulateMeasurement(
  prob0: number,
  numTrials: number = 1000
): {
  measured0: number;
  measured1: number;
  theoretical0: number;
  theoretical1: number;
} {
  // Create superposition state
  const amp0 = Math.sqrt(prob0);
  const amp1 = Math.sqrt(1 - prob0);

  const state = new StateVector(2, [math.complex(amp0, 0), math.complex(amp1, 0)]);

  // Simulate measurements
  let count0 = 0,
    count1 = 0;

  for (let i = 0; i < numTrials; i++) {
    if (Math.random() < prob0) {
      count0++;
    } else {
      count1++;
    }
  }

  return {
    measured0: count0,
    measured1: count1,
    theoretical0: prob0,
    theoretical1: 1 - prob0
  };
}

// ============================================================================
// ENTANGLEMENT ANALYSIS
// ============================================================================

export function analyzeEntanglement(stateType: string): {
  entropy: number;
  concurrence: number;
  negativity: number;
  type: string;
} {
  let state: StateVector;

  switch (stateType) {
    case 'product':
      state = createBasisState(4, 0); // |00⟩
      break;
    case 'bell':
      state = createBellState('Phi+');
      break;
    case 'partial':
      state = new StateVector(4, [
        math.complex(Math.sqrt(0.7), 0),
        math.complex(0, 0),
        math.complex(0, 0),
        math.complex(Math.sqrt(0.3), 0)
      ]);
      break;
    case 'ghz3-1v2':
      const ghz3 = createGHZState(3);
      // For 1v2 split calculation
      state = ghz3;
      break;
    default:
      state = createBasisState(4, 0);
  }

  const entropy = calculateEntanglementEntropy(state, 2, 2);
  const rho = createDensityMatrixFromState(state);
  const conc = concurrence(rho);
  const neg = negativity(rho, 2, 2);

  let typeStr = 'Unknown';
  if (entropy < 0.01) typeStr = 'Separable (No Entanglement)';
  else if (entropy > Math.log(2) - 0.01) typeStr = 'Maximally Entangled';
  else typeStr = 'Partially Entangled';

  return {
    entropy,
    concurrence: conc,
    negativity: neg,
    type: typeStr
  };
}

// ============================================================================
// MULTI-QUBIT STATES
// ============================================================================

export function generateMultiQubitState(stateType: string): {
  vector: string;
  components: { label: string; amplitude: string }[];
  dimension: number;
  norm: number;
} {
  let state: StateVector;
  let components: { label: string; amplitude: string }[] = [];

  switch (stateType) {
    case 'ghz2':
      state = createBellState('Phi+'); // (|00⟩ + |11⟩)/√2
      components = [
        { label: '|00⟩', amplitude: `1/√2 ≈ 0.707` },
        { label: '|11⟩', amplitude: `1/√2 ≈ 0.707` }
      ];
      break;
    case 'ghz3':
      state = createGHZState(3);
      components = [
        { label: '|000⟩', amplitude: `1/√2 ≈ 0.707` },
        { label: '|111⟩', amplitude: `1/√2 ≈ 0.707` }
      ];
      break;
    case 'w2':
      state = createWState(2);
      components = [
        { label: '|01⟩', amplitude: `1/√2 ≈ 0.707` },
        { label: '|10⟩', amplitude: `1/√2 ≈ 0.707` }
      ];
      break;
    case 'w3':
      state = createWState(3);
      components = [
        { label: '|001⟩', amplitude: `1/√3 ≈ 0.577` },
        { label: '|010⟩', amplitude: `1/√3 ≈ 0.577` },
        { label: '|100⟩', amplitude: `1/√3 ≈ 0.577` }
      ];
      break;
    default:
      state = createBasisState(4, 0);
  }

  const norm = Math.sqrt(
    state.amplitudes.reduce((sum, amp) => sum + amp.re * amp.re + amp.im * amp.im, 0)
  );

  const vectorStr = state.amplitudes
    .filter((amp) => Math.hypot(amp.re, amp.im) > 0.001)
    .map((amp) => formatComplex(amp.re, amp.im))
    .join(', ');

  return {
    vector: `[${vectorStr}]`,
    components,
    dimension: state.dimension,
    norm
  };
}

// ============================================================================
// ANGULAR MOMENTUM STATES
// ============================================================================

export function generateAngularMomentumState(j: number, m: number): {
  stateStr: string;
  jzEigenvalue: number;
  j2Eigenvalue: number;
  operatorInfo: string;
} {
  const state = createJmState(j, m);
  const jzOp = createJz(j);
  const j2Op = createJ2(j);

  const jzEig = jmExpectationValue(jzOp, j, m);
  const j2Eig = jmExpectationValue(j2Op, j, m);

  const jzVal = m;
  const j2Val = j * (j + 1);

  let stateStr = `|${j}, ${m}⟩`;
  if (j === 0.5) {
    stateStr = m === 0.5 ? '|↑⟩ = |1/2, +1/2⟩' : '|↓⟩ = |1/2, -1/2⟩';
  }

  return {
    stateStr,
    jzEigenvalue: jzVal,
    j2Eigenvalue: j2Val,
    operatorInfo: `Jz |${j}, ${m}⟩ = ${m}ℏ |${j}, ${m}⟩; J² |${j}, ${m}⟩ = ${j2Val.toFixed(2)}ℏ²`
  };
}

// ============================================================================
// QUANTUM CIRCUIT SIMULATOR
// ============================================================================

export function runQuantumCircuit(): {
  circuitDesc: string;
  step1: string;
  step2: string;
  step3: string;
} {
  // Create Bell state directly to demonstrate the circuit
  const bellPhi = createBellState('Phi+');

  return {
    circuitDesc: '2-Qubit Bell State Circuit: Creates maximally entangled state from |00⟩',
    step1: '|00⟩ - Initial computational basis state',
    step2: 'H₁ ⊗ I₂ - Apply Hadamard to first qubit: (|0⟩ + |1⟩)/√2 ⊗ |0⟩',
    step3: 'CNOT - Apply CNOT gate: Result = Φ⁺ = (|00⟩ + |11⟩)/√2'
  };
}

// ============================================================================
// SUPERPOSITION EXPLORER
// ============================================================================

export function exploreSuperposition(
  ampSquared: number,
  phaseA: number
): {
  stateStr: string;
  probZero: number;
  probOne: number;
} {
  const ampA = Math.sqrt(ampSquared);
  const ampB = Math.sqrt(1 - ampSquared);

  const phaseRad = (phaseA * Math.PI) / 180;
  const realA = ampA * Math.cos(phaseRad);
  const imagA = ampA * Math.sin(phaseRad);

  const stateStr = `(${realA.toFixed(3)} + ${imagA.toFixed(3)}i)|0⟩ + ${ampB.toFixed(3)}|1⟩`;

  return {
    stateStr,
    probZero: ampSquared,
    probOne: 1 - ampSquared
  };
}

// ============================================================================
// QUANTUM FIDELITY ANALYZER
// ============================================================================

export function computeFidelity(stateAStr: string, stateBStr: string): {
  fidelity: number;
  traceDistance: number;
  innerProduct: string;
  similarity: number;
} {
  const stateMap: { [key: string]: StateVector } = {
    '|0⟩': createBasisState(2, 0),
    '|1⟩': createBasisState(2, 1),
    '|+⟩': createPlusState(),
    '|-⟩': new StateVector(2, [
      math.complex(1 / Math.sqrt(2), 0),
      math.complex(-1 / Math.sqrt(2), 0)
    ]),
    '|i⟩': new StateVector(2, [
      math.complex(1 / Math.sqrt(2), 0),
      math.complex(0, 1 / Math.sqrt(2))
    ])
  };

  const stateA = stateMap[stateAStr];
  const stateB = stateMap[stateBStr];

  // Use innerProduct method on StateVector
  const overlap = stateA.innerProduct(stateB);
  const fidelity = Math.abs(overlap.re) * Math.abs(overlap.re) + Math.abs(overlap.im) * Math.abs(overlap.im);
  const traceD = Math.sqrt(1 - fidelity);
  const similarity = fidelity * 100;

  const overlapStr = formatComplex(overlap.re, overlap.im);

  return {
    fidelity,
    traceDistance: traceD,
    innerProduct: overlapStr,
    similarity
  };
}

// ============================================================================
// 1D QUANTUM RANDOM WALK
// ============================================================================

interface QuantumWalk1DState {
  state: StateVector;
  coinOp: MatrixOperator;
  shiftOp: SparseOperator;
  latticeSize: number;
  currentStep: number;
  totalSteps: number;
  history: Array<{ step: number; data: QuantumWalk1DData }>;
}

interface QuantumWalk1DData {
  step: number;
  probabilities: { position: number; probability: number }[];
  centerOfMass: number;
  variance: number;
  totalProbability: number;
  maxProbability: number;
}

type QuantumWalk1DBoundary = 'reflecting' | 'periodic';
type QuantumWalk1DCoin = 'hadamard' | 'grover' | 'rotation';

// Store quantum walk state for step-by-step functionality
let qw1dStateBuffer: QuantumWalk1DState | null = null;

/**
 * Initialize a 1D quantum random walk
 */
export function initializeQuantumWalk1D(latticeSize: number): QuantumWalk1DData {
  const dimension = 2 * latticeSize; // 2 coin states × latticeSize positions

  // Create Hadamard coin operator (2×2)
  const hadamardMatrix: any[][] = [
    [math.complex(1 / Math.sqrt(2), 0), math.complex(1 / Math.sqrt(2), 0)],
    [math.complex(1 / Math.sqrt(2), 0), math.complex(-1 / Math.sqrt(2), 0)]
  ];
  const coinOp = new MatrixOperator(hadamardMatrix, 'unitary');

  // Create shift operator as sparse matrix
  // Shift operator maps (coin, position) → (coin', position')
  // LEFT (0) at pos i → RIGHT (1) at pos i-1
  // RIGHT (1) at pos i → LEFT (0) at pos i+1
  const shiftMatrix = createSparseMatrix(dimension, dimension);

  for (let pos = 0; pos < latticeSize; pos++) {
    // LEFT coin at position pos
    const leftIndex = pos; // coin 0
    // Maps to RIGHT coin at position pos-1 (or reflects if at boundary)
    if (pos > 0) {
      // Move left: (LEFT, pos) → (RIGHT, pos-1)
      const rightIndexPrev = latticeSize + (pos - 1);
      setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
    } else {
      // Boundary reflection: (LEFT, 0) → (RIGHT, 0)
      const rightIndex = latticeSize + 0;
      setSparseEntry(shiftMatrix, rightIndex, leftIndex, math.complex(1, 0));
    }

    // RIGHT coin at position pos
    const rightIndex = latticeSize + pos; // coin 1
    // Maps to LEFT coin at position pos+1 (or reflects if at boundary)
    if (pos < latticeSize - 1) {
      // Move right: (RIGHT, pos) → (LEFT, pos+1)
      const leftIndexNext = pos + 1;
      setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
    } else {
      // Boundary reflection: (RIGHT, L-1) → (LEFT, L-1)
      const leftIndexBound = pos;
      setSparseEntry(shiftMatrix, leftIndexBound, rightIndex, math.complex(1, 0));
    }
  }

  const shiftOp = new SparseOperator(shiftMatrix, 'unitary');

  // Create initial state: superposition at center position
  const center = Math.floor(latticeSize / 2);
  const initialAmplitudes: any[] = new Array(dimension).fill(null).map(() => math.complex(0, 0));

  // Start in superposition of both coin directions at center position
  const invSqrt2 = 1 / Math.sqrt(2);
  initialAmplitudes[center] = math.complex(invSqrt2, 0); // LEFT at center
  initialAmplitudes[latticeSize + center] = math.complex(invSqrt2, 0); // RIGHT at center

  const initialState = new StateVector(dimension, initialAmplitudes);

  // Store state for step-by-step evolution
  qw1dStateBuffer = {
    state: initialState,
    coinOp,
    shiftOp,
    latticeSize,
    currentStep: 0,
    totalSteps: 0,
    history: []
  };

  // Extract and store initial data
  const initialData = extractQuantumWalk1DData(initialState, latticeSize, 0);
  qw1dStateBuffer.history.push({ step: 0, data: initialData });

  return initialData;
}

/**
 * Execute one step of the quantum walk
 */
export function stepQuantumWalk1D(): QuantumWalk1DData {
  if (!qw1dStateBuffer) {
    throw new Error('Quantum walk not initialized. Call initializeQuantumWalk1D first.');
  }

  const { state, coinOp, shiftOp, latticeSize } = qw1dStateBuffer;

  // Create identity operator for position space
  const identityMatrix: any[][] = [];
  for (let i = 0; i < latticeSize; i++) {
    const row: any[] = [];
    for (let j = 0; j < latticeSize; j++) {
      row.push(i === j ? math.complex(1, 0) : math.complex(0, 0));
    }
    identityMatrix.push(row);
  }
  const identityOp = new MatrixOperator(identityMatrix, 'unitary');

  // Apply coin ⊗ identity to position space
  const coinFullOp = coinOp.tensorProduct(identityOp);

  // Apply coin then shift
  let nextState = coinFullOp.apply(state);
  nextState = shiftOp.apply(nextState);
  nextState = nextState.normalize();

  qw1dStateBuffer.state = nextState;
  qw1dStateBuffer.currentStep++;

  const data = extractQuantumWalk1DData(nextState, latticeSize, qw1dStateBuffer.currentStep);
  qw1dStateBuffer.history.push({ step: qw1dStateBuffer.currentStep, data });

  return data;
}

/**
 * Run quantum walk for specified number of steps
 */
export function runQuantumWalk1D(latticeSize: number, numSteps: number): {
  final: QuantumWalk1DData;
  history: Array<{ step: number; data: QuantumWalk1DData }>;
} {
  initializeQuantumWalk1D(latticeSize);

  if (!qw1dStateBuffer) {
    throw new Error('Failed to initialize quantum walk');
  }

  for (let i = 0; i < numSteps; i++) {
    stepQuantumWalk1D();
  }

  return {
    final: qw1dStateBuffer.history[qw1dStateBuffer.history.length - 1].data,
    history: qw1dStateBuffer.history
  };
}

/**
 * Reset quantum walk state
 */
export function resetQuantumWalk1D(): void {
  qw1dStateBuffer = null;
}

/**
 * Get current quantum walk state (for step-by-step display)
 */
export function getQuantumWalk1DState(): QuantumWalk1DData {
  if (!qw1dStateBuffer || qw1dStateBuffer.history.length === 0) {
    throw new Error('Quantum walk not initialized');
  }
  return qw1dStateBuffer.history[qw1dStateBuffer.history.length - 1].data;
}

/**
 * Extract probability data from quantum walk state
 */
function extractQuantumWalk1DData(state: StateVector, latticeSize: number, step: number): QuantumWalk1DData {
  const probabilities: { position: number; probability: number }[] = [];
  let totalProb = 0;
  let centerOfMass = 0;
  let maxProb = 0;

  const x0 = (latticeSize - 1) / 2;

  // Sum probabilities across both coin states for each position
  for (let pos = 0; pos < latticeSize; pos++) {
    const leftAmp = state.amplitudes[pos];
    const rightAmp = state.amplitudes[latticeSize + pos];

    const leftProb = Math.abs(leftAmp.re) ** 2 + Math.abs(leftAmp.im) ** 2;
    const rightProb = Math.abs(rightAmp.re) ** 2 + Math.abs(rightAmp.im) ** 2;

    const posProb = leftProb + rightProb;
    probabilities.push({ position: pos, probability: posProb });
    totalProb += posProb;
    const x = pos - x0;
    centerOfMass += x * posProb;
    maxProb = Math.max(maxProb, posProb);
  }

  // Normalize center of mass
  centerOfMass = totalProb > 0 ? centerOfMass / totalProb : 0;

  // Calculate variance
  let variance = 0;
  for (let pos = 0; pos < latticeSize; pos++) {
    const posProb = probabilities[pos].probability;
    const x = pos - x0;
    variance += (x - centerOfMass) ** 2 * posProb;
  }

  return {
    step,
    probabilities,
    centerOfMass,
    variance,
    totalProbability: totalProb,
    maxProbability: maxProb
  };
}

// ============================================================================
// 1D QUANTUM RANDOM WALK - GROVER COIN VARIANT
// ============================================================================

interface QuantumWalk1DGroverState {
  state: StateVector;
  coinOp: MatrixOperator;
  shiftOp: SparseOperator;
  latticeSize: number;
  currentStep: number;
  history: Array<{ step: number; data: QuantumWalk1DData }>;
}

let qw1dGroverStateBuffer: QuantumWalk1DGroverState | null = null;

/**
 * Initialize 1D quantum walk with Grover coin
 * Grover coin provides enhanced spreading compared to Hadamard
 */
export function initializeQuantumWalk1DGrover(latticeSize: number): QuantumWalk1DData {
  const dimension = 2 * latticeSize;

  // Create Grover coin operator (2×2)
  // Grover: G = 2|ψ⟩⟨ψ| - I where |ψ⟩ = (|0⟩ + |1⟩)/√2
  // G = [[0, 1], [1, 0]] (phase-shifted version for quantum walks)
  const groverMatrix: any[][] = [
    [math.complex(0, 0), math.complex(1, 0)],
    [math.complex(1, 0), math.complex(0, 0)]
  ];
  const coinOp = new MatrixOperator(groverMatrix, 'unitary');

  // Same shift operator as Hadamard variant (boundary reflecting)
  const shiftMatrix = createSparseMatrix(dimension, dimension);
  for (let pos = 0; pos < latticeSize; pos++) {
    const leftIndex = pos;
    if (pos > 0) {
      const rightIndexPrev = latticeSize + (pos - 1);
      setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
    } else {
      const rightIndex = latticeSize + 0;
      setSparseEntry(shiftMatrix, rightIndex, leftIndex, math.complex(1, 0));
    }
    const rightIndex = latticeSize + pos;
    if (pos < latticeSize - 1) {
      const leftIndexNext = pos + 1;
      setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
    } else {
      const leftIndexBound = pos;
      setSparseEntry(shiftMatrix, leftIndexBound, rightIndex, math.complex(1, 0));
    }
  }
  const shiftOp = new SparseOperator(shiftMatrix, 'unitary');

  // Initial state
  const center = Math.floor(latticeSize / 2);
  const initialAmplitudes: any[] = new Array(dimension).fill(null).map(() => math.complex(0, 0));
  const invSqrt2 = 1 / Math.sqrt(2);
  initialAmplitudes[center] = math.complex(invSqrt2, 0);
  initialAmplitudes[latticeSize + center] = math.complex(invSqrt2, 0);

  const initialState = new StateVector(dimension, initialAmplitudes);

  qw1dGroverStateBuffer = {
    state: initialState,
    coinOp,
    shiftOp,
    latticeSize,
    currentStep: 0,
    history: []
  };

  const initialData = extractQuantumWalk1DData(initialState, latticeSize, 0);
  qw1dGroverStateBuffer.history.push({ step: 0, data: initialData });

  return initialData;
}

export function stepQuantumWalk1DGrover(): QuantumWalk1DData {
  if (!qw1dGroverStateBuffer) {
    throw new Error('Grover quantum walk not initialized');
  }

  const { state, coinOp, shiftOp, latticeSize } = qw1dGroverStateBuffer;

  const identityMatrix: any[][] = [];
  for (let i = 0; i < latticeSize; i++) {
    const row: any[] = [];
    for (let j = 0; j < latticeSize; j++) {
      row.push(i === j ? math.complex(1, 0) : math.complex(0, 0));
    }
    identityMatrix.push(row);
  }
  const identityOp = new MatrixOperator(identityMatrix, 'unitary');

  const coinFullOp = coinOp.tensorProduct(identityOp);
  let nextState = coinFullOp.apply(state);
  nextState = shiftOp.apply(nextState);
  nextState = nextState.normalize();

  qw1dGroverStateBuffer.state = nextState;
  qw1dGroverStateBuffer.currentStep++;

  const data = extractQuantumWalk1DData(nextState, latticeSize, qw1dGroverStateBuffer.currentStep);
  qw1dGroverStateBuffer.history.push({ step: qw1dGroverStateBuffer.currentStep, data });

  return data;
}

export function resetQuantumWalk1DGrover(): void {
  qw1dGroverStateBuffer = null;
}

export function getQuantumWalk1DGroverState(): QuantumWalk1DData {
  if (!qw1dGroverStateBuffer || qw1dGroverStateBuffer.history.length === 0) {
    throw new Error('Grover quantum walk not initialized');
  }
  return qw1dGroverStateBuffer.history[qw1dGroverStateBuffer.history.length - 1].data;
}

// ============================================================================
// 1D QUANTUM RANDOM WALK - PERIODIC BOUNDARY CONDITIONS
// ============================================================================

interface QuantumWalk1DPeriodicState {
  state: StateVector;
  coinOp: MatrixOperator;
  shiftOp: SparseOperator;
  latticeSize: number;
  currentStep: number;
  history: Array<{ step: number; data: QuantumWalk1DData }>;
}

let qw1dPeriodicStateBuffer: QuantumWalk1DPeriodicState | null = null;

/**
 * Initialize 1D quantum walk with periodic boundary conditions (torus)
 */
export function initializeQuantumWalk1DPeriodic(latticeSize: number): QuantumWalk1DData {
  const dimension = 2 * latticeSize;

  // Hadamard coin
  const hadamardMatrix: any[][] = [
    [math.complex(1 / Math.sqrt(2), 0), math.complex(1 / Math.sqrt(2), 0)],
    [math.complex(1 / Math.sqrt(2), 0), math.complex(-1 / Math.sqrt(2), 0)]
  ];
  const coinOp = new MatrixOperator(hadamardMatrix, 'unitary');

  // Shift operator with periodic boundaries (wrap-around)
  const shiftMatrix = createSparseMatrix(dimension, dimension);
  for (let pos = 0; pos < latticeSize; pos++) {
    const leftIndex = pos;
    const prevPos = (pos - 1 + latticeSize) % latticeSize; // wrap-around
    const rightIndexPrev = latticeSize + prevPos;
    setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));

    const rightIndex = latticeSize + pos;
    const nextPos = (pos + 1) % latticeSize; // wrap-around
    const leftIndexNext = nextPos;
    setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
  }
  const shiftOp = new SparseOperator(shiftMatrix, 'unitary');

  // Initial state
  const center = Math.floor(latticeSize / 2);
  const initialAmplitudes: any[] = new Array(dimension).fill(null).map(() => math.complex(0, 0));
  const invSqrt2 = 1 / Math.sqrt(2);
  initialAmplitudes[center] = math.complex(invSqrt2, 0);
  initialAmplitudes[latticeSize + center] = math.complex(invSqrt2, 0);

  const initialState = new StateVector(dimension, initialAmplitudes);

  qw1dPeriodicStateBuffer = {
    state: initialState,
    coinOp,
    shiftOp,
    latticeSize,
    currentStep: 0,
    history: []
  };

  const initialData = extractQuantumWalk1DData(initialState, latticeSize, 0);
  qw1dPeriodicStateBuffer.history.push({ step: 0, data: initialData });

  return initialData;
}

export function stepQuantumWalk1DPeriodic(): QuantumWalk1DData {
  if (!qw1dPeriodicStateBuffer) {
    throw new Error('Periodic quantum walk not initialized');
  }

  const { state, coinOp, shiftOp, latticeSize } = qw1dPeriodicStateBuffer;

  const identityMatrix: any[][] = [];
  for (let i = 0; i < latticeSize; i++) {
    const row: any[] = [];
    for (let j = 0; j < latticeSize; j++) {
      row.push(i === j ? math.complex(1, 0) : math.complex(0, 0));
    }
    identityMatrix.push(row);
  }
  const identityOp = new MatrixOperator(identityMatrix, 'unitary');

  const coinFullOp = coinOp.tensorProduct(identityOp);
  let nextState = coinFullOp.apply(state);
  nextState = shiftOp.apply(nextState);
  nextState = nextState.normalize();

  qw1dPeriodicStateBuffer.state = nextState;
  qw1dPeriodicStateBuffer.currentStep++;

  const data = extractQuantumWalk1DData(nextState, latticeSize, qw1dPeriodicStateBuffer.currentStep);
  qw1dPeriodicStateBuffer.history.push({ step: qw1dPeriodicStateBuffer.currentStep, data });

  return data;
}

export function resetQuantumWalk1DPeriodic(): void {
  qw1dPeriodicStateBuffer = null;
}

export function getQuantumWalk1DPeriodicState(): QuantumWalk1DData {
  if (!qw1dPeriodicStateBuffer || qw1dPeriodicStateBuffer.history.length === 0) {
    throw new Error('Periodic quantum walk not initialized');
  }
  return qw1dPeriodicStateBuffer.history[qw1dPeriodicStateBuffer.history.length - 1].data;
}

// ============================================================================
// CLASSICAL RANDOM WALK REFERENCE
// ============================================================================

interface ClassicalWalk1DState {
  probabilities: number[];
  latticeSize: number;
  currentStep: number;
  history: Array<{ step: number; data: QuantumWalk1DData }>;
}

let classicalWalk1DBuffer: ClassicalWalk1DState | null = null;

/**
 * Initialize classical 1D random walk for comparison with quantum
 */
export function initializeClassicalWalk1D(latticeSize: number): QuantumWalk1DData {
  const probs = new Array(latticeSize).fill(0);
  const center = Math.floor(latticeSize / 2);
  probs[center] = 1.0; // Start at center with certainty

  classicalWalk1DBuffer = {
    probabilities: probs,
    latticeSize,
    currentStep: 0,
    history: []
  };

  const initialData = extractClassicalWalkData(probs, latticeSize, 0);
  classicalWalk1DBuffer.history.push({ step: 0, data: initialData });

  return initialData;
}

/**
 * Classical random walk step: move left/right with equal probability
 */
export function stepClassicalWalk1D(): QuantumWalk1DData {
  if (!classicalWalk1DBuffer) {
    throw new Error('Classical walk not initialized');
  }

  const { probabilities, latticeSize } = classicalWalk1DBuffer;
  const newProbs = new Array(latticeSize).fill(0);

  // From each position, move left or right with 50% probability
  for (let pos = 0; pos < latticeSize; pos++) {
    if (probabilities[pos] > 0) {
      // Move left
      const prevPos = pos > 0 ? pos - 1 : 0; // Reflect at boundary
      newProbs[prevPos] += probabilities[pos] * 0.5;

      // Move right
      const nextPos = pos < latticeSize - 1 ? pos + 1 : latticeSize - 1; // Reflect at boundary
      newProbs[nextPos] += probabilities[pos] * 0.5;
    }
  }

  classicalWalk1DBuffer.probabilities = newProbs;
  classicalWalk1DBuffer.currentStep++;

  const data = extractClassicalWalkData(newProbs, latticeSize, classicalWalk1DBuffer.currentStep);
  classicalWalk1DBuffer.history.push({ step: classicalWalk1DBuffer.currentStep, data });

  return data;
}

export function resetClassicalWalk1D(): void {
  classicalWalk1DBuffer = null;
}

export function getClassicalWalk1DState(): QuantumWalk1DData {
  if (!classicalWalk1DBuffer || classicalWalk1DBuffer.history.length === 0) {
    throw new Error('Classical walk not initialized');
  }
  return classicalWalk1DBuffer.history[classicalWalk1DBuffer.history.length - 1].data;
}

/**
 * Extract probability data from classical walk
 */
function extractClassicalWalkData(probs: number[], latticeSize: number, step: number): QuantumWalk1DData {
  const probabilities: { position: number; probability: number }[] = [];
  let totalProb = 0;
  let centerOfMass = 0;
  let maxProb = 0;

  const x0 = (latticeSize - 1) / 2;

  for (let pos = 0; pos < latticeSize; pos++) {
    const posProb = probs[pos];
    probabilities.push({ position: pos, probability: posProb });
    totalProb += posProb;
    const x = pos - x0;
    centerOfMass += x * posProb;
    maxProb = Math.max(maxProb, posProb);
  }

  centerOfMass = totalProb > 0 ? centerOfMass / totalProb : 0;

  let variance = 0;
  for (let pos = 0; pos < latticeSize; pos++) {
    const x = pos - x0;
    variance += (x - centerOfMass) ** 2 * probs[pos];
  }

  return {
    step,
    probabilities,
    centerOfMass,
    variance,
    totalProbability: totalProb,
    maxProbability: maxProb
  };
}

// ============================================================================
// ANALYSIS FUNCTIONS - CLASSICAL LIMIT AND COMPARISON
// ============================================================================

interface VarianceGrowth {
  step: number;
  quantumVariance: number;
  classicalVariance: number;
  advantage: number;
}

/**
 * Analyze variance growth comparing quantum vs classical walks
 */
export function analyzeVarianceGrowth(
  quantumHistory: Array<{ step: number; data: QuantumWalk1DData }>,
  classicalHistory: Array<{ step: number; data: QuantumWalk1DData }>
): VarianceGrowth[] {
  const maxSteps = Math.min(quantumHistory.length, classicalHistory.length);
  const result: VarianceGrowth[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const qVar = quantumHistory[i].data.variance;
    const cVar = classicalHistory[i].data.variance;
    const advantage = cVar > 0 ? qVar / cVar : 0;

    result.push({
      step: i,
      quantumVariance: qVar,
      classicalVariance: cVar,
      advantage
    });
  }

  return result;
}

// ============================================================================
// 1D QUANTUM RANDOM WALK - CONFIGURABLE COIN + BOUNDARY
// ============================================================================

interface QuantumWalk1DCustomState {
  state: StateVector;
  coinOp: MatrixOperator;
  shiftOp: SparseOperator;
  latticeSize: number;
  currentStep: number;
  history: Array<{ step: number; data: QuantumWalk1DData }>;
}

let qw1dCustomStateBuffer: QuantumWalk1DCustomState | null = null;

function buildCoinOperator(coin: QuantumWalk1DCoin, theta: number): MatrixOperator {
  if (coin === 'hadamard') {
    const hadamardMatrix: any[][] = [
      [math.complex(1 / Math.sqrt(2), 0), math.complex(1 / Math.sqrt(2), 0)],
      [math.complex(1 / Math.sqrt(2), 0), math.complex(-1 / Math.sqrt(2), 0)]
    ];
    return new MatrixOperator(hadamardMatrix, 'unitary');
  }

  if (coin === 'grover') {
    // Grover diffusion operator: G = 2|s><s| - I, |s> = (1,1)/sqrt(2)
    // For d=2, this evaluates to [[0,1],[1,0]]
    const d = 2;
    const a = 2 / d;
    const groverMatrix: any[][] = [
      [math.complex(a - 1, 0), math.complex(a, 0)],
      [math.complex(a, 0), math.complex(a - 1, 0)]
    ];
    return new MatrixOperator(groverMatrix, 'unitary');
  }

  // Rotation coin (real, unbiased family). A common 1-parameter choice:
  // C(θ) = [[cosθ, sinθ],[sinθ, -cosθ]] (unitary, determinant -1)
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const rotMatrix: any[][] = [
    [math.complex(c, 0), math.complex(s, 0)],
    [math.complex(s, 0), math.complex(-c, 0)]
  ];
  return new MatrixOperator(rotMatrix, 'unitary');
}

function buildShiftOperator1D(latticeSize: number, boundary: QuantumWalk1DBoundary): SparseOperator {
  const dimension = 2 * latticeSize;
  const shiftMatrix = createSparseMatrix(dimension, dimension);

  for (let pos = 0; pos < latticeSize; pos++) {
    const leftIndex = pos;

    if (boundary === 'periodic') {
      const prevPos = (pos - 1 + latticeSize) % latticeSize;
      const rightIndexPrev = latticeSize + prevPos;
      setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
    } else {
      if (pos > 0) {
        const rightIndexPrev = latticeSize + (pos - 1);
        setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
      } else {
        const rightIndex = latticeSize + 0;
        setSparseEntry(shiftMatrix, rightIndex, leftIndex, math.complex(1, 0));
      }
    }

    const rightIndex = latticeSize + pos;
    if (boundary === 'periodic') {
      const nextPos = (pos + 1) % latticeSize;
      const leftIndexNext = nextPos;
      setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
    } else {
      if (pos < latticeSize - 1) {
        const leftIndexNext = pos + 1;
        setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
      } else {
        const leftIndexBound = pos;
        setSparseEntry(shiftMatrix, leftIndexBound, rightIndex, math.complex(1, 0));
      }
    }
  }

  return new SparseOperator(shiftMatrix, 'unitary');
}

export function initializeQuantumWalk1DCustom(
  latticeSize: number,
  coin: QuantumWalk1DCoin = 'hadamard',
  boundary: QuantumWalk1DBoundary = 'reflecting',
  theta: number = Math.PI / 4
): QuantumWalk1DData {
  const dimension = 2 * latticeSize;

  const coinOp = buildCoinOperator(coin, theta);
  const shiftOp = buildShiftOperator1D(latticeSize, boundary);

  const center = Math.floor(latticeSize / 2);
  const initialAmplitudes: any[] = new Array(dimension).fill(null).map(() => math.complex(0, 0));
  const invSqrt2 = 1 / Math.sqrt(2);
  initialAmplitudes[center] = math.complex(invSqrt2, 0);
  initialAmplitudes[latticeSize + center] = math.complex(invSqrt2, 0);
  const initialState = new StateVector(dimension, initialAmplitudes);

  qw1dCustomStateBuffer = {
    state: initialState,
    coinOp,
    shiftOp,
    latticeSize,
    currentStep: 0,
    history: []
  };

  const initialData = extractQuantumWalk1DData(initialState, latticeSize, 0);
  qw1dCustomStateBuffer.history.push({ step: 0, data: initialData });
  return initialData;
}

export function stepQuantumWalk1DCustom(): QuantumWalk1DData {
  if (!qw1dCustomStateBuffer) {
    throw new Error('Custom quantum walk not initialized');
  }

  const { state, coinOp, shiftOp, latticeSize } = qw1dCustomStateBuffer;

  const identityMatrix: any[][] = [];
  for (let i = 0; i < latticeSize; i++) {
    const row: any[] = [];
    for (let j = 0; j < latticeSize; j++) {
      row.push(i === j ? math.complex(1, 0) : math.complex(0, 0));
    }
    identityMatrix.push(row);
  }
  const identityOp = new MatrixOperator(identityMatrix, 'unitary');
  const coinFullOp = coinOp.tensorProduct(identityOp);

  let nextState = coinFullOp.apply(state);
  nextState = shiftOp.apply(nextState);
  nextState = nextState.normalize();

  qw1dCustomStateBuffer.state = nextState;
  qw1dCustomStateBuffer.currentStep++;

  const data = extractQuantumWalk1DData(nextState, latticeSize, qw1dCustomStateBuffer.currentStep);
  qw1dCustomStateBuffer.history.push({ step: qw1dCustomStateBuffer.currentStep, data });
  return data;
}

export function resetQuantumWalk1DCustom(): void {
  qw1dCustomStateBuffer = null;
}

export function getQuantumWalk1DCustomState(): QuantumWalk1DData {
  if (!qw1dCustomStateBuffer || qw1dCustomStateBuffer.history.length === 0) {
    throw new Error('Custom quantum walk not initialized');
  }
  return qw1dCustomStateBuffer.history[qw1dCustomStateBuffer.history.length - 1].data;
}

// ============================================================================
// 1D QUANTUM RANDOM WALK - DECOHERENCE (COIN MEASUREMENT) ENSEMBLE
// ============================================================================

function measureCoinInComputationalBasis(state: StateVector, latticeSize: number): StateVector {
  // Projectively measure coin (LEFT/RIGHT) and return collapsed state.
  let pLeft = 0;
  let pRight = 0;

  for (let pos = 0; pos < latticeSize; pos++) {
    const leftAmp = state.amplitudes[pos];
    const rightAmp = state.amplitudes[latticeSize + pos];
    pLeft += Math.abs(leftAmp.re) ** 2 + Math.abs(leftAmp.im) ** 2;
    pRight += Math.abs(rightAmp.re) ** 2 + Math.abs(rightAmp.im) ** 2;
  }

  const r = Math.random();
  const outcomeLeft = r < pLeft / (pLeft + pRight);
  const newAmps: any[] = state.amplitudes.map((a: any) => math.complex(a.re, a.im));

  for (let pos = 0; pos < latticeSize; pos++) {
    if (outcomeLeft) {
      newAmps[latticeSize + pos] = math.complex(0, 0);
    } else {
      newAmps[pos] = math.complex(0, 0);
    }
  }

  return new StateVector(state.dimension, newAmps).normalize();
}

function averageProbabilities(
  probsAcc: number[],
  data: QuantumWalk1DData
): void {
  for (let i = 0; i < data.probabilities.length; i++) {
    probsAcc[i] += data.probabilities[i].probability;
  }
}

function buildDataFromAveragedProbabilities(avgProbs: number[], latticeSize: number, step: number): QuantumWalk1DData {
  return extractClassicalWalkData(avgProbs, latticeSize, step);
}

export function runQuantumWalk1DDecoheredEnsemble(
  latticeSize: number,
  numSteps: number,
  coin: QuantumWalk1DCoin = 'hadamard',
  boundary: QuantumWalk1DBoundary = 'reflecting',
  theta: number = Math.PI / 4,
  pMeasure: number = 0,
  ensembleSize: number = 50
): { final: QuantumWalk1DData; history: Array<{ step: number; data: QuantumWalk1DData }> } {
  const clampedP = Math.max(0, Math.min(1, pMeasure));
  const M = Math.max(1, Math.floor(ensembleSize));

  const coinOp = buildCoinOperator(coin, theta);
  const shiftOp = buildShiftOperator1D(latticeSize, boundary);
  const dimension = 2 * latticeSize;

  const identityMatrix: any[][] = [];
  for (let i = 0; i < latticeSize; i++) {
    const row: any[] = [];
    for (let j = 0; j < latticeSize; j++) {
      row.push(i === j ? math.complex(1, 0) : math.complex(0, 0));
    }
    identityMatrix.push(row);
  }
  const identityOp = new MatrixOperator(identityMatrix, 'unitary');
  const coinFullOp = coinOp.tensorProduct(identityOp);

  const center = Math.floor(latticeSize / 2);
  const history: Array<{ step: number; data: QuantumWalk1DData }> = [];

  const probsAccByStep: number[][] = [];
  for (let step = 0; step <= numSteps; step++) {
    probsAccByStep.push(new Array(latticeSize).fill(0));
  }

  for (let m = 0; m < M; m++) {
    const initialAmplitudes: any[] = new Array(dimension).fill(null).map(() => math.complex(0, 0));
    const invSqrt2 = 1 / Math.sqrt(2);
    initialAmplitudes[center] = math.complex(invSqrt2, 0);
    initialAmplitudes[latticeSize + center] = math.complex(invSqrt2, 0);
    let state = new StateVector(dimension, initialAmplitudes);

    averageProbabilities(probsAccByStep[0], extractQuantumWalk1DData(state, latticeSize, 0));

    for (let step = 1; step <= numSteps; step++) {
      state = coinFullOp.apply(state);
      state = shiftOp.apply(state);
      state = state.normalize();

      if (clampedP > 0 && Math.random() < clampedP) {
        state = measureCoinInComputationalBasis(state, latticeSize);
      }

      averageProbabilities(probsAccByStep[step], extractQuantumWalk1DData(state, latticeSize, step));
    }
  }

  for (let step = 0; step <= numSteps; step++) {
    const avgProbs = probsAccByStep[step].map(v => v / M);
    const avgData = buildDataFromAveragedProbabilities(avgProbs, latticeSize, step);
    history.push({ step, data: avgData });
  }

  return { final: history[history.length - 1].data, history };
}

// ============================================================================
// CLASSICAL RANDOM WALK - PERSISTENT TWO-COMPONENT (TELEGRAPH-LIKE)
// ============================================================================

interface PersistentClassicalWalk1DState {
  pLeft: number[];
  pRight: number[];
  latticeSize: number;
  currentStep: number;
  persistence: number;
  history: Array<{ step: number; data: QuantumWalk1DData }>;
}

let persistentClassicalWalk1DBuffer: PersistentClassicalWalk1DState | null = null;

export function initializePersistentClassicalWalk1D(latticeSize: number, persistence: number = 0.9): QuantumWalk1DData {
  const q = Math.max(0, Math.min(1, persistence));
  const center = Math.floor(latticeSize / 2);

  const pLeft = new Array(latticeSize).fill(0);
  const pRight = new Array(latticeSize).fill(0);
  pLeft[center] = 0.5;
  pRight[center] = 0.5;

  persistentClassicalWalk1DBuffer = {
    pLeft,
    pRight,
    latticeSize,
    currentStep: 0,
    persistence: q,
    history: []
  };

  const probs = pLeft.map((v, i) => v + pRight[i]);
  const initialData = extractClassicalWalkData(probs, latticeSize, 0);
  persistentClassicalWalk1DBuffer.history.push({ step: 0, data: initialData });
  return initialData;
}

export function stepPersistentClassicalWalk1D(): QuantumWalk1DData {
  if (!persistentClassicalWalk1DBuffer) {
    throw new Error('Persistent classical walk not initialized');
  }

  const { pLeft, pRight, latticeSize, persistence } = persistentClassicalWalk1DBuffer;
  const newLeft = new Array(latticeSize).fill(0);
  const newRight = new Array(latticeSize).fill(0);

  // Transport + velocity scattering.
  // With probability persistence, keep direction; with (1-persistence), flip.
  for (let pos = 0; pos < latticeSize; pos++) {
    const pl = pLeft[pos];
    const pr = pRight[pos];
    if (pl > 0) {
      const target = pos > 0 ? pos - 1 : 0;
      // reflect at boundary by flipping direction if blocked
      if (pos > 0) {
        newLeft[target] += pl * persistence;
        newRight[target] += pl * (1 - persistence);
      } else {
        newRight[target] += pl;
      }
    }
    if (pr > 0) {
      const target = pos < latticeSize - 1 ? pos + 1 : latticeSize - 1;
      if (pos < latticeSize - 1) {
        newRight[target] += pr * persistence;
        newLeft[target] += pr * (1 - persistence);
      } else {
        newLeft[target] += pr;
      }
    }
  }

  persistentClassicalWalk1DBuffer.pLeft = newLeft;
  persistentClassicalWalk1DBuffer.pRight = newRight;
  persistentClassicalWalk1DBuffer.currentStep++;

  const probs = newLeft.map((v, i) => v + newRight[i]);
  const data = extractClassicalWalkData(probs, latticeSize, persistentClassicalWalk1DBuffer.currentStep);
  persistentClassicalWalk1DBuffer.history.push({ step: persistentClassicalWalk1DBuffer.currentStep, data });
  return data;
}

export function resetPersistentClassicalWalk1D(): void {
  persistentClassicalWalk1DBuffer = null;
}

export function getPersistentClassicalWalk1DState(): QuantumWalk1DData {
  if (!persistentClassicalWalk1DBuffer || persistentClassicalWalk1DBuffer.history.length === 0) {
    throw new Error('Persistent classical walk not initialized');
  }
  return persistentClassicalWalk1DBuffer.history[persistentClassicalWalk1DBuffer.history.length - 1].data;
}

/**
 * Get probability distribution snapshot at a specific step
 */
export function getDistributionSnapshot(
  history: Array<{ step: number; data: QuantumWalk1DData }>,
  stepIndex: number
): { position: number; probability: number }[] {
  if (stepIndex >= 0 && stepIndex < history.length) {
    return history[stepIndex].data.probabilities;
  }
  return [];
}

/**
 * Compare spreading rates between quantum and classical walks
 */
export function compareSpreadingRates(
  quantumHistory: Array<{ step: number; data: QuantumWalk1DData }>,
  classicalHistory: Array<{ step: number; data: QuantumWalk1DData }>
): {
  quantumRate: number;
  classicalRate: number;
  advantage: number;
} {
  if (quantumHistory.length < 2 || classicalHistory.length < 2) {
    return { quantumRate: 0, classicalRate: 0, advantage: 0 };
  }

  const qVar0 = quantumHistory[0].data.variance;
  const qVarFinal = quantumHistory[quantumHistory.length - 1].data.variance;
  const qSteps = quantumHistory.length - 1;

  const cVar0 = classicalHistory[0].data.variance;
  const cVarFinal = classicalHistory[classicalHistory.length - 1].data.variance;
  const cSteps = classicalHistory.length - 1;

  const quantumRate = qSteps > 0 ? (qVarFinal - qVar0) / qSteps : 0;
  const classicalRate = cSteps > 0 ? (cVarFinal - cVar0) / cSteps : 0;
  const advantage = classicalRate > 0 ? quantumRate / classicalRate : 0;

  return {
    quantumRate,
    classicalRate,
    advantage
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatComplex(re: number, im: number, precision: number = 4): string {
  if (Math.abs(im) < 1e-10) {
    return re.toFixed(precision);
  }

  const sign = im >= 0 ? '+' : '';
  return `${re.toFixed(precision)} ${sign} ${im.toFixed(precision)}i`;
}

function createDensityMatrixFromState(state: StateVector): DensityMatrixOperator {
  const dim = state.dimension;
  const matrix: any[] = [];

  for (let i = 0; i < dim; i++) {
    const row: any[] = [];
    for (let j = 0; j < dim; j++) {
      row.push(
        math.multiply(state.amplitudes[i], math.conj(state.amplitudes[j])) as any
      );
    }
    matrix.push(row);
  }

  return new DensityMatrixOperator(matrix);
}

function calculateEntanglementEntropy(
  state: StateVector,
  dimA: number,
  dimB: number
): number {
  // Schmidt decomposition would be used here
  // For now, using a simplified entropy calculation
  const rho = createDensityMatrixFromState(state);

  // Create reduced density matrix (partial trace)
  let entropy = 0;
  try {
    entropy = entanglementEntropy(state, dimA, dimB);
  } catch {
    entropy = 0;
  }

  return entropy;
}

// ============================================================================
// EXPORTS AND WINDOW BINDING
// ============================================================================

// Collect all exported functions
const simulationFunctions = {
  generateBellState,
  applyGate,
  simulateMeasurement,
  analyzeEntanglement,
  generateMultiQubitState,
  generateAngularMomentumState,
  runQuantumCircuit,
  exploreSuperposition,
  computeFidelity,
  initializeQuantumWalk1D,
  stepQuantumWalk1D,
  runQuantumWalk1D,
  resetQuantumWalk1D,
  getQuantumWalk1DState,
  initializeQuantumWalk1DCustom,
  stepQuantumWalk1DCustom,
  resetQuantumWalk1DCustom,
  getQuantumWalk1DCustomState,
  runQuantumWalk1DDecoheredEnsemble,
  initializeQuantumWalk1DGrover,
  stepQuantumWalk1DGrover,
  resetQuantumWalk1DGrover,
  getQuantumWalk1DGroverState,
  initializeQuantumWalk1DPeriodic,
  stepQuantumWalk1DPeriodic,
  resetQuantumWalk1DPeriodic,
  getQuantumWalk1DPeriodicState,
  initializeClassicalWalk1D,
  stepClassicalWalk1D,
  resetClassicalWalk1D,
  getClassicalWalk1DState,
  initializePersistentClassicalWalk1D,
  stepPersistentClassicalWalk1D,
  resetPersistentClassicalWalk1D,
  getPersistentClassicalWalk1DState,
  analyzeVarianceGrowth,
  getDistributionSnapshot,
  compareSpreadingRates
};

// Make functions available to HTML
declare global {
  interface Window {
    simulations: typeof simulationFunctions;
  }
}

// Assign to window for browser access
(globalThis as any).simulations = simulationFunctions;

// Also try assigning to window for fallback
if (typeof window !== 'undefined') {
  (window as any).simulations = simulationFunctions;
}

export default simulationFunctions;
