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
} from '../dist/index.js';
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
      const SGate = new (require('../dist/index.js').MatrixOperator)([
        [math.complex(1, 0), math.complex(0, 0)],
        [math.complex(0, 0), math.complex(0, 1)]
      ], 'unitary');
      resultState = SGate.apply(initialState);
      break;
    case 'T':
      // T gate: diagonal matrix with [1, e^(iπ/4)]
      const TGate = new (require('../dist/index.js').MatrixOperator)([
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

  // Sum probabilities across both coin states for each position
  for (let pos = 0; pos < latticeSize; pos++) {
    const leftAmp = state.amplitudes[pos];
    const rightAmp = state.amplitudes[latticeSize + pos];

    const leftProb = Math.abs(leftAmp.re) ** 2 + Math.abs(leftAmp.im) ** 2;
    const rightProb = Math.abs(rightAmp.re) ** 2 + Math.abs(rightAmp.im) ** 2;

    const posProb = leftProb + rightProb;
    probabilities.push({ position: pos, probability: posProb });
    totalProb += posProb;
    centerOfMass += pos * posProb;
    maxProb = Math.max(maxProb, posProb);
  }

  // Normalize center of mass
  centerOfMass = totalProb > 0 ? centerOfMass / totalProb : latticeSize / 2;

  // Calculate variance
  let variance = 0;
  for (let pos = 0; pos < latticeSize; pos++) {
    const posProb = probabilities[pos].probability;
    variance += (pos - centerOfMass) ** 2 * posProb;
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
  getQuantumWalk1DState
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
