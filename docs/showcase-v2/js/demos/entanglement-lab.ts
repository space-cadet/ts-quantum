/**
 * Entanglement Lab — ts-quantum Showcase v2 Demo
 *
 * Interactive exploration of 2-qubit entanglement:
 * - General 2-qubit state parameter controls (8 sliders)
 * - Preset states (Bell, product, W-like, maximally mixed)
 * - Density matrix visualization (canvas heatmap)
 * - Live entanglement measures (entropy, concurrence, negativity, purity)
 * - Schmidt decomposition bar chart
 * - CHSH Bell inequality test
 */

import {
  StateVector,
  DensityMatrixOperator,
  createBellState,
  createBasisState,
  createWState,
  entanglementEntropy,
  concurrence,
  negativity,
  vonNeumannEntropy,
  schmidtDecomposition,
  traceDistance,
  fidelity,
} from '../../../../src/index';
import type { Complex, IStateVector, IDensityMatrix, IOperator } from '../../../../src/index';
import * as math from 'mathjs';

// ============================================================================
// Types & State
// ============================================================================

interface SliderRefs {
  reAlpha: HTMLInputElement;
  imAlpha: HTMLInputElement;
  reBeta: HTMLInputElement;
  imBeta: HTMLInputElement;
  reGamma: HTMLInputElement;
  imGamma: HTMLInputElement;
  reDelta: HTMLInputElement;
  imDelta: HTMLInputElement;
}

interface ValueRefs {
  reAlpha: HTMLSpanElement;
  imAlpha: HTMLSpanElement;
  reBeta: HTMLSpanElement;
  imBeta: HTMLSpanElement;
  reGamma: HTMLSpanElement;
  imGamma: HTMLSpanElement;
  reDelta: HTMLSpanElement;
  imDelta: HTMLSpanElement;
}

interface MeasureRefs {
  entropy: HTMLSpanElement;
  concurrence: HTMLSpanElement;
  negativity: HTMLSpanElement;
  purity: HTMLSpanElement;
}

interface DemoState {
  sliders: SliderRefs;
  values: ValueRefs;
  measures: MeasureRefs;
  densityCanvas: HTMLCanvasElement;
  schmidtCanvas: HTMLCanvasElement;
  chshValue: HTMLSpanElement;
  chshIndicator: HTMLDivElement;
  schmidtRank: HTMLSpanElement;
  normDisplay: HTMLSpanElement;
  isMaximallyMixed: boolean;
  // Stored density matrix when in mixed mode
  mixedDensityMatrix: IDensityMatrix | null;
}

let demoState: DemoState | null = null;

// Basis labels for density matrix
const BASIS_LABELS = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];

// ============================================================================
// Helpers
// ============================================================================

function getSliderAmplitudes(sliders: SliderRefs): number[] {
  return [
    parseFloat(sliders.reAlpha.value),
    parseFloat(sliders.imAlpha.value),
    parseFloat(sliders.reBeta.value),
    parseFloat(sliders.imBeta.value),
    parseFloat(sliders.reGamma.value),
    parseFloat(sliders.imGamma.value),
    parseFloat(sliders.reDelta.value),
    parseFloat(sliders.imDelta.value),
  ];
}

function setSliderAmplitudes(sliders: SliderRefs, values: number[]): void {
  sliders.reAlpha.value = String(values[0]);
  sliders.imAlpha.value = String(values[1]);
  sliders.reBeta.value = String(values[2]);
  sliders.imBeta.value = String(values[3]);
  sliders.reGamma.value = String(values[4]);
  sliders.imGamma.value = String(values[5]);
  sliders.reDelta.value = String(values[6]);
  sliders.imDelta.value = String(values[7]);
}

function buildStateVector(values: number[]): StateVector {
  const amps: Complex[] = [
    math.complex(values[0], values[1]),
    math.complex(values[2], values[3]),
    math.complex(values[4], values[5]),
    math.complex(values[6], values[7]),
  ];
  return new StateVector(4, amps);
}

function normalizeAmplitudes(values: number[]): number[] {
  let normSq = 0;
  for (let i = 0; i < 8; i += 2) {
    normSq += values[i] * values[i] + values[i + 1] * values[i + 1];
  }
  const norm = Math.sqrt(normSq);
  if (norm < 1e-10) {
    // Return |00⟩ if everything is zero
    return [1, 0, 0, 0, 0, 0, 0, 0];
  }
  return values.map(v => v / norm);
}

function updateValueDisplays(state: DemoState): void {
  const vals = getSliderAmplitudes(state.sliders);
  state.values.reAlpha.textContent = vals[0].toFixed(3);
  state.values.imAlpha.textContent = vals[1].toFixed(3);
  state.values.reBeta.textContent = vals[2].toFixed(3);
  state.values.imBeta.textContent = vals[3].toFixed(3);
  state.values.reGamma.textContent = vals[4].toFixed(3);
  state.values.imGamma.textContent = vals[5].toFixed(3);
  state.values.reDelta.textContent = vals[6].toFixed(3);
  state.values.imDelta.textContent = vals[7].toFixed(3);
}

function formatNumber(n: number, digits = 4): string {
  if (Math.abs(n) < 1e-10) return '0';
  return n.toFixed(digits).replace(/\.?0+$/, '');
}

// ============================================================================
// CHSH Computation
// ============================================================================

/**
 * Simple power iteration to extract eigenvalues of a symmetric 3x3 matrix.
 * Used as a fallback when the analytic cubic formula encounters degeneracy.
 */
function powerIterationEigenvalues(m: number[][], count: number): number[] {
  const n = m.length;
  const result: number[] = [];
  let matrix = m.map(row => [...row]);

  for (let k = 0; k < count; k++) {
    let vec = Array(n).fill(0).map(() => Math.random());
    // Orthogonalize against previous eigenvectors
    for (const prev of result) {
      // Deflate by shifting (simple Rayleigh quotient iteration approximation)
      // For symmetric matrices, we use inverse iteration instead
    }

    // Power iteration
    for (let it = 0; it < 50; it++) {
      const newVec = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVec[i] += matrix[i][j] * vec[j];
        }
      }
      const norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0));
      if (norm < 1e-14) break;
      vec = newVec.map(v => v / norm);
    }

    // Rayleigh quotient
    let lambda = 0;
    for (let i = 0; i < n; i++) {
      let mv = 0;
      for (let j = 0; j < n; j++) mv += matrix[i][j] * vec[j];
      lambda += vec[i] * mv;
    }
    result.push(lambda);

    // Deflate matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] -= lambda * vec[i] * vec[j];
      }
    }
  }

  return result.sort((x, y) => y - x);
}

/**
 * Compute the maximum CHSH S value for a 2-qubit state.
 * For a general state, we use the Horodecki criterion:
 * S_max = 2 * sqrt(λ1 + λ2) where λ1, λ2 are the two largest
 * eigenvalues of T^T T, and T is the correlation matrix with
 * T_ij = Tr(ρ (σ_i ⊗ σ_j)).
 */
function computeCHSH(rho: IDensityMatrix): number {
  const matrix = rho.toMatrix();

  // Pauli matrices
  const sigmaX = [
    [math.complex(0, 0), math.complex(1, 0)],
    [math.complex(1, 0), math.complex(0, 0)],
  ];
  const sigmaY = [
    [math.complex(0, 0), math.complex(0, -1)],
    [math.complex(0, 1), math.complex(0, 0)],
  ];
  const sigmaZ = [
    [math.complex(1, 0), math.complex(0, 0)],
    [math.complex(0, 0), math.complex(-1, 0)],
  ];
  const pauli = [sigmaX, sigmaY, sigmaZ];

  // Compute T_ij = Tr(ρ (σ_i ⊗ σ_j))
  const T: number[][] = Array(3).fill(null).map(() => Array(3).fill(0));

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      // σ_i ⊗ σ_j as 4x4 matrix
      const op: Complex[][] = Array(4).fill(null).map(() => Array(4).fill(null).map(() => math.complex(0, 0)));
      for (let a = 0; a < 2; a++) {
        for (let b = 0; b < 2; b++) {
          for (let c = 0; c < 2; c++) {
            for (let d = 0; d < 2; d++) {
              const row = a * 2 + b;
              const col = c * 2 + d;
              op[row][col] = math.multiply(pauli[i][a][c], pauli[j][b][d]) as Complex;
            }
          }
        }
      }
      // Tr(ρ * op)
      let trace = 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          trace += matrix[r][c].re * op[c][r].re - matrix[r][c].im * op[c][r].im;
        }
      }
      T[i][j] = trace;
    }
  }

  // Compute T^T T
  const TtT: number[][] = Array(3).fill(null).map(() => Array(3).fill(0));
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        TtT[i][j] += T[k][i] * T[k][j];
      }
    }
  }

  // Eigenvalues of T^T T (symmetric 3x3)
  // Use characteristic polynomial for robustness
  const a = -(TtT[0][0] + TtT[1][1] + TtT[2][2]);
  const b =
    TtT[0][0] * TtT[1][1] +
    TtT[1][1] * TtT[2][2] +
    TtT[2][2] * TtT[0][0] -
    TtT[0][1] * TtT[0][1] -
    TtT[1][2] * TtT[1][2] -
    TtT[2][0] * TtT[2][0];
  const c =
    TtT[0][0] * TtT[1][2] * TtT[2][0] +
    TtT[0][1] * TtT[1][0] * TtT[2][2] +
    TtT[0][2] * TtT[1][1] * TtT[2][0] -
    TtT[0][0] * TtT[1][1] * TtT[2][2] -
    TtT[0][1] * TtT[1][2] * TtT[2][0] -
    TtT[0][2] * TtT[1][0] * TtT[2][1];

  // Solve cubic: λ³ + aλ² + bλ + c = 0
  const Q = (a * a - 3 * b) / 9;
  const R = (2 * a * a * a - 9 * a * b + 27 * c) / 54;
  const disc = Q * Q * Q;
  let eigenvalues: number[];
  if (disc < 1e-14) {
    // Degenerate case: use numerical fallback
    const m = [
      [TtT[0][0], TtT[0][1], TtT[0][2]],
      [TtT[1][0], TtT[1][1], TtT[1][2]],
      [TtT[2][0], TtT[2][1], TtT[2][2]],
    ];
    eigenvalues = powerIterationEigenvalues(m, 3);
  } else {
    const theta = Math.acos(Math.max(-1, Math.min(1, R / Math.sqrt(disc))));
    eigenvalues = [
      -2 * Math.sqrt(Q) * Math.cos(theta / 3) - a / 3,
      -2 * Math.sqrt(Q) * Math.cos((theta + 2 * Math.PI) / 3) - a / 3,
      -2 * Math.sqrt(Q) * Math.cos((theta - 2 * Math.PI) / 3) - a / 3,
    ];
  }

  eigenvalues.sort((x, y) => y - x);
  const sumTwoLargest = eigenvalues[0] + eigenvalues[1];
  const sMax = 2 * Math.sqrt(Math.max(0, sumTwoLargest));
  return sMax;
}

// ============================================================================
// Canvas Visualizations
// ============================================================================

function drawDensityMatrix(canvas: HTMLCanvasElement, rho: IDensityMatrix): void {
  const ctx = canvas.getContext('2d')!;
  const matrix = rho.toMatrix();
  const size = 4;
  const padding = 50;
  const cellSize = Math.min(
    (canvas.width - padding * 2) / size,
    (canvas.height - padding * 2) / size
  );
  const offsetX = (canvas.width - cellSize * size) / 2;
  const offsetY = (canvas.height - cellSize * size) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw labels
  ctx.font = '12px SF Mono, Monaco, monospace';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5f6368';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Column labels (top)
  for (let j = 0; j < size; j++) {
    ctx.fillText(BASIS_LABELS[j] + '⟨' + BASIS_LABELS[j].slice(1), offsetX + j * cellSize + cellSize / 2, offsetY - 16);
  }

  // Row labels (left)
  ctx.textAlign = 'right';
  for (let i = 0; i < size; i++) {
    ctx.fillText(BASIS_LABELS[i], offsetX - 8, offsetY + i * cellSize + cellSize / 2);
  }

  // Draw cells
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const c = matrix[i][j];
      const mag = Math.sqrt(c.re * c.re + c.im * c.im);
      const phase = Math.atan2(c.im, c.re);

      // Color: intensity = magnitude, hue = phase
      const intensity = Math.min(1, mag);
      const hue = ((phase / Math.PI) * 180 + 360) % 360;
      const saturation = 70;
      const lightness = 20 + intensity * 55; // 20% to 75%

      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(offsetX + j * cellSize + 1, offsetY + i * cellSize + 1, cellSize - 2, cellSize - 2);

      // Draw value text
      ctx.fillStyle = intensity > 0.5 ? '#ffffff' : '#1a1a2e';
      ctx.font = '10px SF Mono, Monaco, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = formatNumber(mag, 2);
      ctx.fillText(text, offsetX + j * cellSize + cellSize / 2, offsetY + i * cellSize + cellSize / 2);
    }
  }

  // Draw border
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-medium').trim() || '#dadce0';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, cellSize * size, cellSize * size);
}

function drawSchmidtDecomposition(canvas: HTMLCanvasElement, values: number[]): void {
  const ctx = canvas.getContext('2d')!;
  const n = values.length;
  const padding = 40;
  const barWidth = Math.min(60, (canvas.width - padding * 2) / n - 10);
  const maxBarHeight = canvas.height - padding * 2;
  const offsetX = (canvas.width - (barWidth * n + (n - 1) * 10)) / 2;
  const offsetY = canvas.height - padding;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Max value for scaling
  const maxVal = Math.max(...values, 1e-10);

  // Draw bars
  for (let i = 0; i < n; i++) {
    const h = (values[i] / maxVal) * maxBarHeight;
    const x = offsetX + i * (barWidth + 10);
    const y = offsetY - h;

    // Bar fill - resolve CSS variables to actual colors for canvas
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--accent-primary').trim() || '#1a73e8';
    const secondaryColor = rootStyles.getPropertyValue('--accent-secondary').trim() || '#00acc1';
    const gradient = ctx.createLinearGradient(x, y, x, offsetY);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, h);

    // Bar border
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-medium').trim() || '#dadce0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, h);

    // Label
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5f6368';
    ctx.font = '12px SF Mono, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`λ${i + 1}`, x + barWidth / 2, offsetY + 6);

    // Value
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1a1a2e';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatNumber(values[i], 3), x + barWidth / 2, y - 4);
  }

  // Y-axis label
  ctx.save();
  ctx.translate(12, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#80868b';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Schmidt coefficient', 0, 0);
  ctx.restore();
}

// ============================================================================
// Core Update Logic
// ============================================================================

function updateAll(): void {
  if (!demoState) return;

  updateValueDisplays(demoState);

  let rho: IDensityMatrix;
  let state: StateVector | null = null;

  if (demoState.isMaximallyMixed && demoState.mixedDensityMatrix) {
    rho = demoState.mixedDensityMatrix;
  } else {
    let vals = getSliderAmplitudes(demoState.sliders);
    vals = normalizeAmplitudes(vals);  // Ensure normalized state
    const normSq = vals.reduce((s, v, i) => s + (i % 2 === 0 ? v * v : 0), 0) +
                   vals.reduce((s, v, i) => s + (i % 2 === 1 ? v * v : 0), 0);
    demoState.normDisplay.textContent = `‖ψ‖ = ${Math.sqrt(normSq).toFixed(6)}`;

    state = buildStateVector(vals);
    rho = DensityMatrixOperator.fromPureState(state);
  }

  // --- Density Matrix ---
  drawDensityMatrix(demoState.densityCanvas, rho);

  // --- Entanglement Measures ---
  try {
    const entropy = vonNeumannEntropy(rho.partialTrace([2, 2], [1]));
    demoState.measures.entropy.textContent = formatNumber(entropy, 4);
  } catch {
    demoState.measures.entropy.textContent = 'N/A';
  }

  try {
    const c = concurrence(rho as IDensityMatrix);
    demoState.measures.concurrence.textContent = formatNumber(c, 4);
  } catch {
    demoState.measures.concurrence.textContent = 'N/A';
  }

  try {
    const n = negativity(rho as IDensityMatrix, 2, 2);
    demoState.measures.negativity.textContent = formatNumber(n, 4);
  } catch {
    demoState.measures.negativity.textContent = 'N/A';
  }

  try {
    const p = rho.purity();
    demoState.measures.purity.textContent = formatNumber(p, 4);
  } catch {
    demoState.measures.purity.textContent = 'N/A';
  }

  // --- Schmidt Decomposition ---
  if (state) {
    try {
      const schmidt = schmidtDecomposition(state, 2, 2);
      const coeffs = schmidt.values;
      demoState.schmidtRank.textContent = String(coeffs.length);
      drawSchmidtDecomposition(demoState.schmidtCanvas, coeffs);
    } catch {
      demoState.schmidtRank.textContent = '1';
      drawSchmidtDecomposition(demoState.schmidtCanvas, [1]);
    }
  } else {
    // Maximally mixed: no Schmidt decomposition for mixed states in this demo
    demoState.schmidtRank.textContent = 'N/A (mixed)';
    drawSchmidtDecomposition(demoState.schmidtCanvas, [0.5, 0.5]);
  }

  // --- CHSH ---
  try {
    const s = computeCHSH(rho);
    demoState.chshValue.textContent = formatNumber(s, 4);
    if (s > 2 + 1e-6) {
      demoState.chshIndicator.innerHTML =
        '<span style="color:var(--accent-success)">✓ Quantum |S| > 2</span>';
    } else {
      demoState.chshIndicator.innerHTML =
        '<span style="color:var(--accent-danger)">✗ Classical |S| ≤ 2</span>';
    }
  } catch {
    demoState.chshValue.textContent = 'N/A';
    demoState.chshIndicator.textContent = '';
  }
}

function onSliderChange(): void {
  if (!demoState) return;
  demoState.isMaximallyMixed = false;
  demoState.mixedDensityMatrix = null;

  const vals = getSliderAmplitudes(demoState.sliders);
  const normalized = normalizeAmplitudes(vals);
  setSliderAmplitudes(demoState.sliders, normalized);

  updateAll();
}

// ============================================================================
// Preset Handlers
// ============================================================================

function loadPreset(name: string): void {
  if (!demoState) return;

  demoState.isMaximallyMixed = false;
  demoState.mixedDensityMatrix = null;

  let targetState: StateVector;

  switch (name) {
    case 'Phi+':
      targetState = createBellState('Phi+');
      break;
    case 'Phi-':
      targetState = createBellState('Phi-');
      break;
    case 'Psi+':
      targetState = createBellState('Psi+');
      break;
    case 'Psi-':
      targetState = createBellState('Psi-');
      break;
    case '00':
      targetState = createBasisState(4, 0);
      break;
    case '01':
      targetState = createBasisState(4, 1);
      break;
    case '10':
      targetState = createBasisState(4, 2);
      break;
    case '11':
      targetState = createBasisState(4, 3);
      break;
    case 'W':
      targetState = createWState(2); // (|01⟩ + |10⟩)/√2 for 2 qubits
      break;
    case 'mixed': {
      demoState.isMaximallyMixed = true;
      // Maximally mixed state I/4
      const basis = [0, 1, 2, 3].map(i => createBasisState(4, i));
      const probs = [0.25, 0.25, 0.25, 0.25];
      demoState.mixedDensityMatrix = DensityMatrixOperator.mixedState(basis, probs);
      // Reset sliders to zero visually to indicate no pure state
      setSliderAmplitudes(demoState.sliders, [0, 0, 0, 0, 0, 0, 0, 0]);
      updateAll();
      return;
    }
    default:
      return;
  }

  // Extract real and imaginary parts
  const amps = targetState.amplitudes;
  const vals: number[] = [];
  for (let i = 0; i < 4; i++) {
    vals.push(amps[i].re, amps[i].im);
  }
  setSliderAmplitudes(demoState.sliders, vals);
  updateAll();
}

// ============================================================================
// UI Construction
// ============================================================================

function createSlider(label: string, id: keyof SliderRefs): { group: HTMLElement; input: HTMLInputElement; value: HTMLSpanElement } {
  const group = document.createElement('div');
  group.className = 'control-group';

  const lbl = document.createElement('label');
  lbl.textContent = label;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '-1';
  input.max = '1';
  input.step = '0.01';
  input.value = id === 'reAlpha' ? '1' : '0';
  input.id = id;

  const value = document.createElement('span');
  value.className = 'slider-value';
  value.style.cssText = 'font-family:monospace;font-size:0.8rem;color:var(--text-secondary);width:48px;display:inline-block;';
  value.textContent = input.value;

  group.appendChild(lbl);
  group.appendChild(input);
  group.appendChild(value);

  return { group, input, value };
}

function buildUI(container: HTMLElement): DemoState {
  container.innerHTML = '';

  // ── Section: State Parameters ──
  const paramCard = document.createElement('div');
  paramCard.className = 'card';

  const paramTitle = document.createElement('h2');
  paramTitle.className = 'card-title';
  paramTitle.textContent = 'State Parameters';
  paramCard.appendChild(paramTitle);

  const eqBox = document.createElement('div');
  eqBox.className = 'equation-box';
  eqBox.innerHTML = '|ψ⟩ = α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩';
  paramCard.appendChild(eqBox);

  const sliderRows = [
    ['Re(α)', 'Im(α)', 'reAlpha', 'imAlpha'],
    ['Re(β)', 'Im(β)', 'reBeta', 'imBeta'],
    ['Re(γ)', 'Im(γ)', 'reGamma', 'imGamma'],
    ['Re(δ)', 'Im(δ)', 'reDelta', 'imDelta'],
  ] as const;

  const sliders: Partial<SliderRefs> = {};
  const values: Partial<ValueRefs> = {};

  for (const [reLabel, imLabel, reId, imId] of sliderRows) {
    const row = document.createElement('div');
    row.className = 'control-row';

    const re = createSlider(reLabel, reId as keyof SliderRefs);
    const im = createSlider(imLabel, imId as keyof SliderRefs);

    (sliders as any)[reId] = re.input;
    (sliders as any)[imId] = im.input;
    (values as any)[reId] = re.value;
    (values as any)[imId] = im.value;

    re.input.addEventListener('input', onSliderChange);
    im.input.addEventListener('input', onSliderChange);

    row.appendChild(re.group);
    row.appendChild(im.group);
    paramCard.appendChild(row);
  }

  const normRow = document.createElement('div');
  normRow.style.cssText = 'margin-top:8px;font-size:0.85rem;color:var(--text-muted);';
  const normDisplay = document.createElement('span');
  normDisplay.textContent = '‖ψ‖ = 1.000000';
  normRow.appendChild(normDisplay);
  paramCard.appendChild(normRow);

  // ── Section: Presets ──
  const presetCard = document.createElement('div');
  presetCard.className = 'card';

  const presetTitle = document.createElement('h2');
  presetTitle.className = 'card-title';
  presetTitle.textContent = 'Presets';
  presetCard.appendChild(presetTitle);

  const presetRow = document.createElement('div');
  presetRow.className = 'control-row';
  presetRow.style.cssText = 'gap:8px;flex-wrap:wrap;';

  const presets: { label: string; id: string; primary?: boolean }[] = [
    { label: 'Φ⁺', id: 'Phi+', primary: true },
    { label: 'Φ⁻', id: 'Phi-', primary: true },
    { label: 'Ψ⁺', id: 'Psi+', primary: true },
    { label: 'Ψ⁻', id: 'Psi-', primary: true },
    { label: '|00⟩', id: '00' },
    { label: '|01⟩', id: '01' },
    { label: '|10⟩', id: '10' },
    { label: '|11⟩', id: '11' },
    { label: 'W-like', id: 'W' },
    { label: 'I/4', id: 'mixed' },
  ];

  for (const p of presets) {
    const btn = document.createElement('button');
    btn.className = `btn ${p.primary ? 'btn-primary' : 'btn-secondary'} btn-sm`;
    btn.textContent = p.label;
    btn.addEventListener('click', () => loadPreset(p.id));
    presetRow.appendChild(btn);
  }
  presetCard.appendChild(presetRow);

  // ── Section: Density Matrix ──
  const dmCard = document.createElement('div');
  dmCard.className = 'card';

  const dmTitle = document.createElement('h2');
  dmTitle.className = 'card-title';
  dmTitle.textContent = 'Density Matrix |ρij|';
  dmCard.appendChild(dmTitle);

  const dmCanvasWrap = document.createElement('div');
  dmCanvasWrap.className = 'canvas-container';
  const densityCanvas = document.createElement('canvas');
  densityCanvas.width = 400;
  densityCanvas.height = 400;
  dmCanvasWrap.appendChild(densityCanvas);
  dmCard.appendChild(dmCanvasWrap);

  // ── Section: Entanglement Measures ──
  const measCard = document.createElement('div');
  measCard.className = 'card';

  const measTitle = document.createElement('h2');
  measTitle.className = 'card-title';
  measTitle.textContent = 'Entanglement Measures';
  measCard.appendChild(measTitle);

  const dataGrid = document.createElement('div');
  dataGrid.className = 'data-grid';

  const measureDefs: { label: string; id: keyof MeasureRefs; formula: string }[] = [
    { label: 'Von Neumann Entropy S(ρA)', id: 'entropy', formula: 'S = −Tr(ρA log ρA)' },
    { label: 'Concurrence C(ρ)', id: 'concurrence', formula: 'C = max(0, λ₁−λ₂−λ₃−λ₄)' },
    { label: 'Negativity N(ρ)', id: 'negativity', formula: 'N = (||ρ^TA||₁ − 1)/2' },
    { label: 'Purity Tr(ρ²)', id: 'purity', formula: 'P = Tr(ρ²)' },
  ];

  const measures: Partial<MeasureRefs> = {};

  for (const m of measureDefs) {
    const item = document.createElement('div');
    item.className = 'data-item';

    const lbl = document.createElement('div');
    lbl.className = 'data-label';
    lbl.textContent = m.label;

    const formula = document.createElement('div');
    formula.style.cssText = 'font-size:0.7rem;color:var(--text-muted);margin-bottom:4px;';
    formula.textContent = m.formula;

    const val = document.createElement('div');
    val.className = 'data-value';
    val.textContent = '0';

    (measures as any)[m.id] = val;

    item.appendChild(lbl);
    item.appendChild(formula);
    item.appendChild(val);
    dataGrid.appendChild(item);
  }
  measCard.appendChild(dataGrid);

  // ── Section: Schmidt Decomposition ──
  const schmidtCard = document.createElement('div');
  schmidtCard.className = 'card';

  const schmidtTitle = document.createElement('h2');
  schmidtTitle.className = 'card-title';
  schmidtTitle.textContent = 'Schmidt Decomposition';
  schmidtCard.appendChild(schmidtTitle);

  const schmidtSubtitle = document.createElement('div');
  schmidtSubtitle.className = 'card-subtitle';
  const schmidtRank = document.createElement('span');
  schmidtRank.textContent = '1';
  schmidtSubtitle.innerHTML = 'Schmidt rank = ';
  schmidtSubtitle.appendChild(schmidtRank);
  schmidtCard.appendChild(schmidtSubtitle);

  const schmidtCanvasWrap = document.createElement('div');
  schmidtCanvasWrap.className = 'canvas-container';
  const schmidtCanvas = document.createElement('canvas');
  schmidtCanvas.width = 400;
  schmidtCanvas.height = 240;
  schmidtCanvasWrap.appendChild(schmidtCanvas);
  schmidtCard.appendChild(schmidtCanvasWrap);

  // ── Section: CHSH Bell Inequality ──
  const chshCard = document.createElement('div');
  chshCard.className = 'card';

  const chshTitle = document.createElement('h2');
  chshTitle.className = 'card-title';
  chshTitle.textContent = 'CHSH Bell Inequality Test';
  chshCard.appendChild(chshTitle);

  const chshContent = document.createElement('div');
  chshContent.style.cssText = 'display:flex;align-items:center;gap:16px;flex-wrap:wrap;';

  const chshLabel = document.createElement('span');
  chshLabel.style.cssText = 'font-size:1rem;color:var(--text-secondary);';
  chshLabel.textContent = 'S_CHSH = ';

  const chshValue = document.createElement('span');
  chshValue.className = 'data-value';
  chshValue.style.cssText = 'font-size:1.3rem;';
  chshValue.textContent = '0';

  const chshIndicator = document.createElement('div');
  chshIndicator.style.cssText = 'font-size:1rem;font-weight:500;';
  chshIndicator.textContent = '';

  chshContent.appendChild(chshLabel);
  chshContent.appendChild(chshValue);
  chshContent.appendChild(chshIndicator);

  const chshExplain = document.createElement('div');
  chshExplain.className = 'card-subtitle';
  chshExplain.innerHTML = '|S| ≤ 2 → classical (local hidden variable) &nbsp;|&nbsp; |S| > 2 → quantum (entangled)';
  chshCard.appendChild(chshExplain);
  chshCard.appendChild(chshContent);

  // Assemble
  container.appendChild(paramCard);
  container.appendChild(presetCard);
  container.appendChild(dmCard);
  container.appendChild(measCard);
  container.appendChild(schmidtCard);
  container.appendChild(chshCard);

  return {
    sliders: sliders as SliderRefs,
    values: values as ValueRefs,
    measures: measures as MeasureRefs,
    densityCanvas,
    schmidtCanvas,
    chshValue,
    chshIndicator,
    schmidtRank,
    normDisplay,
    isMaximallyMixed: false,
    mixedDensityMatrix: null,
  };
}

// ============================================================================
// Public API
// ============================================================================

function mount(container: HTMLElement): void {
  demoState = buildUI(container);
  updateAll();
}

function unmount(): void {
  demoState = null;
}

export default { mount, unmount };
