/**
 * Quantum Walk Explorer — Interactive 1D Quantum vs Classical Walk Demo
 *
 * Features:
 * - Side-by-side animated probability distributions (quantum vs classical)
 * - Configurable coin operator (Hadamard / Grover / Custom θ)
 * - Configurable lattice size, step count, animation speed, boundary conditions
 * - Step-by-step or full animation controls
 * - Live statistics (variance, center of mass, max probability, quantum advantage)
 * - Variance growth comparison chart
 *
 * All quantum walk evolution uses ts-quantum operators:
 *   – Coin operator as MatrixOperator
 *   – Shift operator as SparseOperator
 *   – State evolution: apply (coin ⊗ I), then shift, then normalize
 */

import {
  StateVector,
  MatrixOperator,
  SparseOperator,
  createSparseMatrix,
  setSparseEntry,
  Hadamard,
  PauliX,
  Complex,
} from '../../../../src/index';
import * as math from 'mathjs';

// ============================================================================
// Types & Constants
// ============================================================================

interface PositionProb {
  position: number;
  probability: number;
}

interface WalkData {
  step: number;
  probabilities: PositionProb[];
  centerOfMass: number;
  variance: number;
  totalProbability: number;
  maxProbability: number;
}

type CoinType = 'hadamard' | 'grover' | 'custom';
type BoundaryType = 'reflecting' | 'periodic';
type SpeedType = 'slow' | 'normal' | 'fast';

interface QuantumWalkEngine {
  state: StateVector;
  coinOp: MatrixOperator;
  shiftOp: SparseOperator;
  latticeSize: number;
  currentStep: number;
  history: WalkData[];
}

interface ClassicalWalkEngine {
  probabilities: number[];
  latticeSize: number;
  currentStep: number;
  history: WalkData[];
}

interface DemoState {
  quantum: QuantumWalkEngine | null;
  classical: ClassicalWalkEngine | null;
  coin: CoinType;
  customTheta: number;
  latticeSize: number;
  totalSteps: number;
  speed: SpeedType;
  boundary: BoundaryType;
  animating: boolean;
  animTimer: number | null;
  varianceHistory: { step: number; qVar: number; cVar: number }[];
}

const INV_SQRT2 = 1 / Math.SQRT2;

const SPEED_MS: Record<SpeedType, number> = {
  slow: 400,
  normal: 120,
  fast: 40,
};

// ============================================================================
// Module-level state
// ============================================================================

let demo: DemoState | null = null;

// DOM refs
let container: HTMLElement | null = null;
let qCanvas: HTMLCanvasElement;
let qCtx: CanvasRenderingContext2D;
let cCanvas: HTMLCanvasElement;
let cCtx: CanvasRenderingContext2D;
let vCanvas: HTMLCanvasElement;
let vCtx: CanvasRenderingContext2D;
let coinSelect: HTMLSelectElement;
let thetaSlider: HTMLInputElement;
let thetaVal: HTMLSpanElement;
let latticeSlider: HTMLInputElement;
let latticeVal: HTMLSpanElement;
let stepsSlider: HTMLInputElement;
let stepsVal: HTMLSpanElement;
let speedSelect: HTMLSelectElement;
let boundarySelect: HTMLSelectElement;
let btnRun: HTMLButtonElement;
let btnStep: HTMLButtonElement;
let btnStop: HTMLButtonElement;
let btnReset: HTMLButtonElement;
let stepCounter: HTMLSpanElement;
let statsGrid: HTMLDivElement;
let resizeObserver: ResizeObserver | null = null;

// ============================================================================
// Coin & Shift Operator Construction (ts-quantum primitives)
// ============================================================================

function buildCoinOperator(coin: CoinType, theta: number): MatrixOperator {
  switch (coin) {
    case 'hadamard':
      return Hadamard;
    case 'grover': {
      // Grover diffusion for d=2: G = 2|s⟩⟨s| - I, |s⟩ = (1,1)/√2
      // Evaluates to [[0, 1], [1, 0]] — same as PauliX for 2D
      const d = 2;
      const a = 2 / d;
      const matrix: Complex[][] = [
        [math.complex(a - 1, 0), math.complex(a, 0)],
        [math.complex(a, 0), math.complex(a - 1, 0)],
      ];
      return new MatrixOperator(matrix, 'unitary', false);
    }
    case 'custom': {
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const matrix: Complex[][] = [
        [math.complex(c, 0), math.complex(s, 0)],
        [math.complex(s, 0), math.complex(-c, 0)],
      ];
      return new MatrixOperator(matrix, 'unitary', false);
    }
  }
}

function buildShiftOperator(latticeSize: number, boundary: BoundaryType): SparseOperator {
  const dimension = 2 * latticeSize;
  const shiftMatrix = createSparseMatrix(dimension, dimension);

  for (let pos = 0; pos < latticeSize; pos++) {
    // LEFT coin (index = pos) moves to previous position, becomes RIGHT coin
    const leftIndex = pos;
    if (boundary === 'periodic') {
      const prevPos = (pos - 1 + latticeSize) % latticeSize;
      const rightIndexPrev = latticeSize + prevPos;
      setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
    } else {
      // Reflecting
      if (pos > 0) {
        const rightIndexPrev = latticeSize + (pos - 1);
        setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
      } else {
        // At left boundary: flip coin, stay
        const rightIndex = latticeSize + 0;
        setSparseEntry(shiftMatrix, rightIndex, leftIndex, math.complex(1, 0));
      }
    }

    // RIGHT coin (index = latticeSize + pos) moves to next position, becomes LEFT coin
    const rightIndex = latticeSize + pos;
    if (boundary === 'periodic') {
      const nextPos = (pos + 1) % latticeSize;
      const leftIndexNext = nextPos;
      setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
    } else {
      // Reflecting
      if (pos < latticeSize - 1) {
        const leftIndexNext = pos + 1;
        setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
      } else {
        // At right boundary: flip coin, stay
        const leftIndexBound = pos;
        setSparseEntry(shiftMatrix, leftIndexBound, rightIndex, math.complex(1, 0));
      }
    }
  }

  return new SparseOperator(shiftMatrix, 'unitary');
}

function buildPositionIdentity(latticeSize: number): MatrixOperator {
  const matrix: Complex[][] = [];
  for (let i = 0; i < latticeSize; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < latticeSize; j++) {
      row.push(i === j ? math.complex(1, 0) : math.complex(0, 0));
    }
    matrix.push(row);
  }
  return new MatrixOperator(matrix, 'unitary', false);
}

// ============================================================================
// Walk Evolution
// ============================================================================

function initializeQuantumWalk(latticeSize: number, coin: CoinType, theta: number, boundary: BoundaryType): QuantumWalkEngine {
  const dimension = 2 * latticeSize;
  const coinOp = buildCoinOperator(coin, theta);
  const shiftOp = buildShiftOperator(latticeSize, boundary);

  // Initial state: superposition of both coin directions at center
  const center = Math.floor(latticeSize / 2);
  const amplitudes: Complex[] = new Array(dimension)
    .fill(null)
    .map(() => math.complex(0, 0));
  amplitudes[center] = math.complex(INV_SQRT2, 0);           // LEFT at center
  amplitudes[latticeSize + center] = math.complex(INV_SQRT2, 0); // RIGHT at center

  const state = new StateVector(dimension, amplitudes);
  const data = extractQuantumData(state, latticeSize, 0);

  return {
    state,
    coinOp,
    shiftOp,
    latticeSize,
    currentStep: 0,
    history: [data],
  };
}

function stepQuantumWalk(engine: QuantumWalkEngine): WalkData {
  const { state, coinOp, shiftOp, latticeSize } = engine;
  const identityOp = buildPositionIdentity(latticeSize);

  // Full evolution operator: U = shift · (coin ⊗ identity)
  const coinFullOp = coinOp.tensorProduct(identityOp);
  const evolutionOp = shiftOp.compose(coinFullOp);

  let nextState = evolutionOp.apply(state);
  nextState = nextState.normalize();

  engine.state = nextState;
  engine.currentStep++;

  const data = extractQuantumData(nextState, latticeSize, engine.currentStep);
  engine.history.push(data);
  return data;
}

function extractQuantumData(state: StateVector, latticeSize: number, step: number): WalkData {
  const probabilities: PositionProb[] = [];
  let totalProb = 0;
  let centerOfMass = 0;
  let maxProb = 0;

  const x0 = (latticeSize - 1) / 2;

  for (let pos = 0; pos < latticeSize; pos++) {
    const leftAmp = state.amplitudes[pos];
    const rightAmp = state.amplitudes[latticeSize + pos];

    const leftProb = leftAmp.re * leftAmp.re + leftAmp.im * leftAmp.im;
    const rightProb = rightAmp.re * rightAmp.re + rightAmp.im * rightAmp.im;
    const posProb = leftProb + rightProb;

    probabilities.push({ position: pos, probability: posProb });
    totalProb += posProb;
    const x = pos - x0;
    centerOfMass += x * posProb;
    maxProb = Math.max(maxProb, posProb);
  }

  centerOfMass = totalProb > 0 ? centerOfMass / totalProb : 0;

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
    maxProbability: maxProb,
  };
}

// ============================================================================
// Classical Walk
// ============================================================================

function initializeClassicalWalk(latticeSize: number): ClassicalWalkEngine {
  const probs = new Array(latticeSize).fill(0);
  const center = Math.floor(latticeSize / 2);
  probs[center] = 1.0;

  const data = extractClassicalData(probs, latticeSize, 0);

  return {
    probabilities: probs,
    latticeSize,
    currentStep: 0,
    history: [data],
  };
}

function stepClassicalWalk(engine: ClassicalWalkEngine): WalkData {
  const { probabilities, latticeSize } = engine;
  const newProbs = new Array(latticeSize).fill(0);

  for (let pos = 0; pos < latticeSize; pos++) {
    if (probabilities[pos] === 0) continue;
    // Move left or right with equal probability
    const leftPos = pos > 0 ? pos - 1 : 0;
    const rightPos = pos < latticeSize - 1 ? pos + 1 : latticeSize - 1;
    newProbs[leftPos] += probabilities[pos] * 0.5;
    newProbs[rightPos] += probabilities[pos] * 0.5;
  }

  engine.probabilities = newProbs;
  engine.currentStep++;

  const data = extractClassicalData(newProbs, latticeSize, engine.currentStep);
  engine.history.push(data);
  return data;
}

function extractClassicalData(probs: number[], latticeSize: number, step: number): WalkData {
  const probabilities: PositionProb[] = [];
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
    maxProbability: maxProb,
  };
}

// ============================================================================
// Drawing
// ============================================================================

function drawBarChart(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  data: WalkData,
  color: string,
  highlightColor: string
): void {
  const w = canvas.width;
  const h = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, w, h);

  const probs = data.probabilities;
  if (probs.length === 0) return;

  const padX = 20 * dpr;
  const padY = 24 * dpr;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;
  const barW = chartW / probs.length;
  const maxP = Math.max(data.maxProbability, 0.01);

  // Grid line at y=0
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--border-medium')
    .trim() || '#dadce0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, h - padY);
  ctx.lineTo(w - padX, h - padY);
  ctx.stroke();

  for (let i = 0; i < probs.length; i++) {
    const p = probs[i].probability;
    const bh = (p / maxP) * chartH * 0.95;
    const bx = padX + i * barW + barW * 0.1;
    const by = h - padY - bh;
    const bw = barW * 0.8;

    // Bar
    const grad = ctx.createLinearGradient(0, by, 0, h - padY);
    grad.addColorStop(0, highlightColor);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw, bh);

    // Outline
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
  }

  // X-axis labels (first, middle, last)
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-muted')
    .trim() || '#80868b';
  ctx.font = `${Math.round(10 * dpr)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';

  const x0 = (probs.length - 1) / 2;
  const labels = [0, Math.floor(probs.length / 2), probs.length - 1];
  for (const idx of labels) {
    const x = padX + idx * barW + barW / 2;
    const label = String(Math.round(idx - x0));
    ctx.fillText(label, x, h - padY + 14 * dpr);
  }
  ctx.textAlign = 'start';

  // Title overlay
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-secondary')
    .trim() || '#5f6368';
  ctx.font = `bold ${Math.round(12 * dpr)}px system-ui, sans-serif`;
  ctx.fillText(`Step ${data.step}`, padX, padY - 4 * dpr);
}

function drawVarianceChart(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  history: { step: number; qVar: number; cVar: number }[]
): void {
  const w = canvas.width;
  const h = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, w, h);

  if (history.length < 1) return;

  const padX = 28 * dpr;
  const padY = 20 * dpr;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const maxStep = Math.max(...history.map(h => h.step), 1);
  const maxVar = Math.max(...history.map(h => Math.max(h.qVar, h.cVar)), 0.1);

  // Grid
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--border-medium')
    .trim() || '#dadce0';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 3]);
  for (let i = 0; i <= 4; i++) {
    const y = padY + (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(padX + chartW, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Axes
  ctx.strokeStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-secondary')
    .trim() || '#5f6368';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, padY);
  ctx.lineTo(padX, h - padY);
  ctx.lineTo(w - padX, h - padY);
  ctx.stroke();

  // Y labels
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-muted')
    .trim() || '#80868b';
  ctx.font = `${Math.round(9 * dpr)}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = (maxVar * (1 - i / 4));
    const y = padY + (i / 4) * chartH;
    ctx.fillText(val.toFixed(1), padX - 4 * dpr, y + 3 * dpr);
  }
  ctx.textAlign = 'center';
  ctx.fillText('Step', w / 2, h - 2 * dpr);
  ctx.textAlign = 'start';

  // Classical line (gray)
  drawLine(ctx, history, padX, padY, chartW, chartH, maxStep, maxVar, 'cVar', '#9aa0a6');

  // Quantum line (blue)
  drawLine(ctx, history, padX, padY, chartW, chartH, maxStep, maxVar, 'qVar', '#1a73e8');

  // Legend
  const legendY = padY;
  ctx.fillStyle = '#1a73e8';
  ctx.fillRect(w - padX - 80 * dpr, legendY, 10 * dpr, 4 * dpr);
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-secondary')
    .trim() || '#5f6368';
  ctx.font = `${Math.round(9 * dpr)}px system-ui, sans-serif`;
  ctx.fillText('Quantum', w - padX - 68 * dpr, legendY + 6 * dpr);

  ctx.fillStyle = '#9aa0a6';
  ctx.fillRect(w - padX - 80 * dpr, legendY + 12 * dpr, 10 * dpr, 4 * dpr);
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-secondary')
    .trim() || '#5f6368';
  ctx.fillText('Classical', w - padX - 68 * dpr, legendY + 18 * dpr);
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  history: { step: number; qVar: number; cVar: number }[],
  padX: number,
  padY: number,
  chartW: number,
  chartH: number,
  maxStep: number,
  maxVar: number,
  field: 'qVar' | 'cVar',
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const x = padX + (h.step / maxStep) * chartW;
    const val = field === 'qVar' ? h.qVar : h.cVar;
    const y = padY + chartH - (val / maxVar) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ============================================================================
// Statistics
// ============================================================================

function updateStats(qData: WalkData, cData: WalkData): void {
  if (!statsGrid || !stepCounter) return;

  stepCounter.textContent = String(qData.step);

  const advantage = cData.variance > 0 ? qData.variance / cData.variance : 0;

  statsGrid.innerHTML = `
    <div class="data-item">
      <div class="data-label">Current Step</div>
      <div class="data-value">${qData.step}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Variance (Q)</div>
      <div class="data-value">${qData.variance.toFixed(3)}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Variance (C)</div>
      <div class="data-value">${cData.variance.toFixed(3)}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Center of Mass (Q)</div>
      <div class="data-value">${qData.centerOfMass.toFixed(3)}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Max Probability (Q)</div>
      <div class="data-value">${(qData.maxProbability * 100).toFixed(1)}%</div>
    </div>
    <div class="data-item">
      <div class="data-label">Quantum Advantage</div>
      <div class="data-value">${advantage.toFixed(2)}×</div>
    </div>
  `;
}

// ============================================================================
// Animation & Controls
// ============================================================================

function performStep(): void {
  if (!demo || !demo.quantum || !demo.classical) return;

  const qData = stepQuantumWalk(demo.quantum);
  const cData = stepClassicalWalk(demo.classical);

  demo.varianceHistory.push({
    step: qData.step,
    qVar: qData.variance,
    cVar: cData.variance,
  });

  drawBarChart(qCanvas, qCtx, qData, '#1a73e8', '#4285f4');
  drawBarChart(cCanvas, cCtx, cData, '#9aa0a6', '#bdc1c6');
  drawVarianceChart(vCanvas, vCtx, demo.varianceHistory);
  updateStats(qData, cData);

  // Update slider to show progress
  if (stepsSlider) {
    stepsSlider.value = String(Math.min(qData.step, demo.totalSteps));
    stepsVal.textContent = `${qData.step} / ${demo.totalSteps}`;
  }
}

function tickAnimation(): void {
  if (!demo || !demo.animating) return;

  if (!demo.quantum || !demo.classical) {
    stopAnimation();
    return;
  }

  if (demo.quantum.currentStep >= demo.totalSteps) {
    stopAnimation();
    return;
  }

  performStep();

  if (demo.quantum.currentStep < demo.totalSteps && demo.animating) {
    demo.animTimer = window.setTimeout(() => {
      requestAnimationFrame(tickAnimation);
    }, SPEED_MS[demo.speed]);
  }
}

function startAnimation(): void {
  if (!demo) return;

  if (demo.quantum && demo.quantum.currentStep >= demo.totalSteps) {
    // Already reached the end, reset first
    resetWalks();
  }

  demo.animating = true;
  if (btnRun) btnRun.disabled = true;
  if (btnStop) btnStop.disabled = false;
  if (btnStep) btnStep.disabled = true;

  tickAnimation();
}

function stopAnimation(): void {
  if (!demo) return;
  demo.animating = false;
  if (demo.animTimer !== null) {
    clearTimeout(demo.animTimer);
    demo.animTimer = null;
  }
  if (btnRun) btnRun.disabled = false;
  if (btnStop) btnStop.disabled = true;
  if (btnStep) btnStep.disabled = false;
}

function resetWalks(): void {
  stopAnimation();
  if (!demo) return;

  demo.quantum = initializeQuantumWalk(demo.latticeSize, demo.coin, demo.customTheta, demo.boundary);
  demo.classical = initializeClassicalWalk(demo.latticeSize);
  demo.varianceHistory = [{ step: 0, qVar: demo.quantum.history[0].variance, cVar: demo.classical.history[0].variance }];

  drawBarChart(qCanvas, qCtx, demo.quantum.history[0], '#1a73e8', '#4285f4');
  drawBarChart(cCanvas, cCtx, demo.classical.history[0], '#9aa0a6', '#bdc1c6');
  drawVarianceChart(vCanvas, vCtx, demo.varianceHistory);
  updateStats(demo.quantum.history[0], demo.classical.history[0]);

  if (stepsSlider) {
    stepsSlider.value = '0';
    stepsVal.textContent = `0 / ${demo.totalSteps}`;
  }
}

function rebuildWalks(): void {
  stopAnimation();
  if (!demo) return;

  demo.quantum = initializeQuantumWalk(demo.latticeSize, demo.coin, demo.customTheta, demo.boundary);
  demo.classical = initializeClassicalWalk(demo.latticeSize);
  demo.varianceHistory = [{ step: 0, qVar: demo.quantum.history[0].variance, cVar: demo.classical.history[0].variance }];

  drawBarChart(qCanvas, qCtx, demo.quantum.history[0], '#1a73e8', '#4285f4');
  drawBarChart(cCanvas, cCtx, demo.classical.history[0], '#9aa0a6', '#bdc1c6');
  drawVarianceChart(vCanvas, vCtx, demo.varianceHistory);
  updateStats(demo.quantum.history[0], demo.classical.history[0]);

  if (stepsSlider) {
    stepsSlider.value = '0';
    stepsVal.textContent = `0 / ${demo.totalSteps}`;
  }
}

// ============================================================================
// HTML Construction
// ============================================================================

function buildHTML(root: HTMLElement): void {
  root.innerHTML = `
    <!-- Title -->
    <div class="card">
      <div class="card-title">🚶 Quantum Walk Explorer</div>
      <div class="card-subtitle">Compare the spreading of a quantum walker (blue) against a classical random walker (gray).
      The quantum walk spreads quadratically faster due to quantum interference.</div>
    </div>

    <!-- Parameters Panel -->
    <div class="card">
      <div class="card-title">🎛️ Parameters</div>
      <div class="control-row" style="flex-wrap: wrap;">
        <div class="control-group">
          <label for="coin-select">Coin Operator</label>
          <select id="coin-select" class="input">
            <option value="hadamard">Hadamard</option>
            <option value="grover">Grover</option>
            <option value="custom">Custom θ</option>
          </select>
        </div>
        <div class="control-group" id="theta-group" style="display: none;">
          <label for="theta-slider">θ (radians)</label>
          <input type="range" id="theta-slider" min="0" max="6.283" step="0.001" value="0.785">
          <span id="theta-val" class="data-value small">0.785</span>
        </div>
        <div class="control-group">
          <label for="lattice-slider">Lattice Size</label>
          <input type="range" id="lattice-slider" min="5" max="31" step="2" value="15">
          <span id="lattice-val" class="data-value small">15</span>
        </div>
        <div class="control-group">
          <label for="steps-slider">Total Steps</label>
          <input type="range" id="steps-slider" min="1" max="100" step="1" value="30">
          <span id="steps-val" class="data-value small">30</span>
        </div>
        <div class="control-group">
          <label for="speed-select">Animation Speed</label>
          <select id="speed-select" class="input">
            <option value="slow">Slow</option>
            <option value="normal" selected>Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
        <div class="control-group">
          <label for="boundary-select">Boundary</label>
          <select id="boundary-select" class="input">
            <option value="reflecting">Reflecting</option>
            <option value="periodic">Periodic</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="card">
      <div class="card-title">▶️ Controls</div>
      <div class="control-row">
        <button id="btn-run" class="btn btn-primary">Run</button>
        <button id="btn-step" class="btn btn-secondary">Step</button>
        <button id="btn-stop" class="btn btn-danger" disabled>Stop</button>
        <button id="btn-reset" class="btn btn-secondary">Reset</button>
        <span class="data-value" style="margin-left: auto;">Step: <span id="step-counter">0</span></span>
      </div>
    </div>

    <!-- Walk Visualizations -->
    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
      <div class="card" style="flex: 1; min-width: 300px;">
        <div class="card-title">🔷 Quantum Walk</div>
        <div class="canvas-container">
          <canvas id="quantum-canvas" width="500" height="260"></canvas>
        </div>
      </div>
      <div class="card" style="flex: 1; min-width: 300px;">
        <div class="card-title">◽ Classical Walk</div>
        <div class="canvas-container">
          <canvas id="classical-canvas" width="500" height="260"></canvas>
        </div>
      </div>
    </div>

    <!-- Variance Comparison -->
    <div class="card">
      <div class="card-title">📈 Variance Growth Comparison</div>
      <div class="canvas-container">
        <canvas id="variance-canvas" width="700" height="220"></canvas>
      </div>
    </div>

    <!-- Statistics -->
    <div class="card">
      <div class="card-title">📊 Statistics</div>
      <div id="stats-grid" class="data-grid"></div>
    </div>
  `;
}

// ============================================================================
// Event Wiring
// ============================================================================

function wireEvents(): void {
  if (!container) return;

  qCanvas = document.getElementById('quantum-canvas') as HTMLCanvasElement;
  qCtx = qCanvas.getContext('2d')!;
  cCanvas = document.getElementById('classical-canvas') as HTMLCanvasElement;
  cCtx = cCanvas.getContext('2d')!;
  vCanvas = document.getElementById('variance-canvas') as HTMLCanvasElement;
  vCtx = vCanvas.getContext('2d')!;

  coinSelect = document.getElementById('coin-select') as HTMLSelectElement;
  thetaSlider = document.getElementById('theta-slider') as HTMLInputElement;
  thetaVal = document.getElementById('theta-val') as HTMLSpanElement;
  latticeSlider = document.getElementById('lattice-slider') as HTMLInputElement;
  latticeVal = document.getElementById('lattice-val') as HTMLSpanElement;
  stepsSlider = document.getElementById('steps-slider') as HTMLInputElement;
  stepsVal = document.getElementById('steps-val') as HTMLSpanElement;
  speedSelect = document.getElementById('speed-select') as HTMLSelectElement;
  boundarySelect = document.getElementById('boundary-select') as HTMLSelectElement;

  btnRun = document.getElementById('btn-run') as HTMLButtonElement;
  btnStep = document.getElementById('btn-step') as HTMLButtonElement;
  btnStop = document.getElementById('btn-stop') as HTMLButtonElement;
  btnReset = document.getElementById('btn-reset') as HTMLButtonElement;

  stepCounter = document.getElementById('step-counter') as HTMLSpanElement;
  statsGrid = document.getElementById('stats-grid') as HTMLDivElement;

  // Coin select
  coinSelect.addEventListener('change', () => {
    const thetaGroup = document.getElementById('theta-group')!;
    if (coinSelect.value === 'custom') {
      thetaGroup.style.display = 'flex';
    } else {
      thetaGroup.style.display = 'none';
    }
    if (demo) {
      demo.coin = coinSelect.value as CoinType;
      rebuildWalks();
    }
  });

  // Theta slider
  thetaSlider.addEventListener('input', () => {
    const val = parseFloat(thetaSlider.value);
    thetaVal.textContent = val.toFixed(3);
    if (demo) {
      demo.customTheta = val;
      if (demo.coin === 'custom') rebuildWalks();
    }
  });

  // Lattice size
  latticeSlider.addEventListener('input', () => {
    const val = parseInt(latticeSlider.value, 10);
    latticeVal.textContent = String(val);
    if (demo) {
      demo.latticeSize = val;
      rebuildWalks();
    }
  });

  // Total steps
  stepsSlider.addEventListener('input', () => {
    const val = parseInt(stepsSlider.value, 10);
    stepsVal.textContent = `${demo?.quantum?.currentStep ?? 0} / ${val}`;
    if (demo) {
      demo.totalSteps = val;
    }
  });

  // Speed
  speedSelect.addEventListener('change', () => {
    if (demo) {
      demo.speed = speedSelect.value as SpeedType;
    }
  });

  // Boundary
  boundarySelect.addEventListener('change', () => {
    if (demo) {
      demo.boundary = boundarySelect.value as BoundaryType;
      rebuildWalks();
    }
  });

  // Buttons
  btnRun.addEventListener('click', startAnimation);
  btnStep.addEventListener('click', () => {
    if (demo && demo.quantum && demo.quantum.currentStep < demo.totalSteps) {
      performStep();
    }
  });
  btnStop.addEventListener('click', stopAnimation);
  btnReset.addEventListener('click', () => {
    stopAnimation();
    rebuildWalks();
  });
}

// ============================================================================
// Resize Handling
// ============================================================================

function setupCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.floor(rect.width || 500);
  const h = Math.floor(rect.height || 260);

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function handleResize(): void {
  if (!qCanvas || !cCanvas || !vCanvas) return;

  setupCanvas(qCanvas, qCtx);
  setupCanvas(cCanvas, cCtx);
  setupCanvas(vCanvas, vCtx);

  if (demo && demo.quantum && demo.classical) {
    const qData = demo.quantum.history[demo.quantum.history.length - 1];
    const cData = demo.classical.history[demo.classical.history.length - 1];
    drawBarChart(qCanvas, qCtx, qData, '#1a73e8', '#4285f4');
    drawBarChart(cCanvas, cCtx, cData, '#9aa0a6', '#bdc1c6');
    drawVarianceChart(vCanvas, vCtx, demo.varianceHistory);
  }
}

// ============================================================================
// Public API
// ============================================================================

interface QuantumWalkDemo {
  mount(el: HTMLElement): void;
  unmount(): void;
}

const quantumWalkDemo: QuantumWalkDemo = {
  mount(el: HTMLElement): void {
    container = el;
    buildHTML(el);
    wireEvents();

    // Initialize demo state
    const latticeSize = parseInt(latticeSlider.value, 10);
    const totalSteps = parseInt(stepsSlider.value, 10);
    const coin = coinSelect.value as CoinType;
    const customTheta = parseFloat(thetaSlider.value);
    const speed = speedSelect.value as SpeedType;
    const boundary = boundarySelect.value as BoundaryType;

    const quantum = initializeQuantumWalk(latticeSize, coin, customTheta, boundary);
    const classical = initializeClassicalWalk(latticeSize);

    demo = {
      quantum,
      classical,
      coin,
      customTheta,
      latticeSize,
      totalSteps,
      speed,
      boundary,
      animating: false,
      animTimer: null,
      varianceHistory: [
        { step: 0, qVar: quantum.history[0].variance, cVar: classical.history[0].variance },
      ],
    };

    // Initial draw
    handleResize();
    updateStats(quantum.history[0], classical.history[0]);

    // Resize observer
    resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(el);

    // Show theta slider if custom is selected
    const thetaGroup = document.getElementById('theta-group')!;
    thetaGroup.style.display = coin === 'custom' ? 'flex' : 'none';
  },

  unmount(): void {
    stopAnimation();
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    container = null;
    demo = null;
  },
};

export default quantumWalkDemo;
