/**
 * Qubit Playground — Interactive Bloch Sphere Demo
 *
 * Features:
 * - Interactive Bloch Sphere (Canvas 2D projection)
 * - State controls (θ and φ sliders)
 * - Quantum gate buttons (X, Y, Z, H, S, T, Rx(π/2), Ry(π/2))
 * - State display with formula, probability bars, and phase indicator
 * - Measurement simulation with histogram
 *
 * All quantum calculations use the ts-quantum library.
 */

import {
  StateVector,
  createBasisState,
  createPlusState,
  PauliX,
  PauliY,
  PauliZ,
  Hadamard,
  ProjectionOperator,
  TwoLevelSystem,
  MatrixOperator,
  toComplex,
  IOperator,
} from '../../../../src/index';

// ============================================================================
// Types & Constants
// ============================================================================

interface QubitPlayground {
  mount(container: HTMLElement): void;
  unmount(): void;
}

const TAU = 2 * Math.PI;
const RT2 = Math.SQRT2;
const RT2_INV = 1 / RT2;

// Pre-built single-qubit gates not exported from ts-quantum gates module
const SGate = new MatrixOperator(
  [
    [toComplex(1, 0), toComplex(0, 0)],
    [toComplex(0, 0), toComplex(0, 1)],
  ],
  'unitary',
  false
);

const TGate = new MatrixOperator(
  [
    [toComplex(1, 0), toComplex(0, 0)],
    [
      toComplex(0, 0),
      toComplex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)),
    ],
  ],
  'unitary',
  false
);

// Rx(π/2) = cos(π/4) I − i sin(π/4) X
const RxPi2 = new MatrixOperator(
  [
    [toComplex(RT2_INV, 0), toComplex(0, -RT2_INV)],
    [toComplex(0, -RT2_INV), toComplex(RT2_INV, 0)],
  ],
  'unitary',
  false
);

// Ry(π/2) = cos(π/4) I − i sin(π/2) Y  => [[c,−s],[s,c]]
const RyPi2 = new MatrixOperator(
  [
    [toComplex(RT2_INV, 0), toComplex(-RT2_INV, 0)],
    [toComplex(RT2_INV, 0), toComplex(RT2_INV, 0)],
  ],
  'unitary',
  false
);

interface GateDef {
  label: string;
  gate: IOperator;
  cls: string;
}

const GATES: GateDef[] = [
  { label: 'X', gate: PauliX, cls: 'btn-secondary' },
  { label: 'Y', gate: PauliY, cls: 'btn-secondary' },
  { label: 'Z', gate: PauliZ, cls: 'btn-secondary' },
  { label: 'H', gate: Hadamard, cls: 'btn-secondary' },
  { label: 'S', gate: SGate, cls: 'btn-secondary' },
  { label: 'T', gate: TGate, cls: 'btn-secondary' },
  { label: 'Rx(π/2)', gate: RxPi2, cls: 'btn-secondary' },
  { label: 'Ry(π/2)', gate: RyPi2, cls: 'btn-secondary' },
];

// ============================================================================
// State Management
// ============================================================================

let currentState: StateVector;
let theta: number = 0; // 0 … π
let phi: number = 0; // 0 … 2π
let viewRotX: number = 0.3; // radians, drag-controlled
let viewRotY: number = 0.5;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// DOM refs
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let thetaSlider: HTMLInputElement;
let phiSlider: HTMLInputElement;
let thetaVal: HTMLSpanElement;
let phiVal: HTMLSpanElement;
let stateFormula: HTMLDivElement;
let prob0Fill: HTMLDivElement;
let prob1Fill: HTMLDivElement;
let prob0Val: HTMLSpanElement;
let prob1Val: HTMLSpanElement;
let phaseCanvas: HTMLCanvasElement;
let phaseCtx: CanvasRenderingContext2D;
let shotsSlider: HTMLInputElement;
let shotsVal: HTMLSpanElement;
let histCanvas: HTMLCanvasElement;
let histCtx: CanvasRenderingContext2D;
let statsContainer: HTMLDivElement;
let measureBtn: HTMLButtonElement;

let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

// ============================================================================
// Helpers — State ↔ Bloch Coordinates
// ============================================================================

function setStateFromBlochAngles(t: number, p: number): void {
  theta = Math.max(0, Math.min(Math.PI, t));
  phi = ((p % TAU) + TAU) % TAU;
  currentState = TwoLevelSystem.blochState(theta, phi);
  updateUI();
}

function updateAnglesFromState(state: StateVector): void {
  const a0 = state.amplitudes[0];
  const a1 = state.amplitudes[1];

  const mag0 = Math.sqrt(a0.re * a0.re + a0.im * a0.im);
  const mag1 = Math.sqrt(a1.re * a1.re + a1.im * a1.im);

  theta = 2 * Math.acos(Math.min(1, Math.max(0, mag0)));

  if (mag1 > 1e-10) {
    // Remove global phase by making a0 real and non-negative
    const globalPhase = Math.atan2(a0.im, a0.re);
    const relRe = a1.re * Math.cos(-globalPhase) - a1.im * Math.sin(-globalPhase);
    const relIm = a1.re * Math.sin(-globalPhase) + a1.im * Math.cos(-globalPhase);
    phi = Math.atan2(relIm, relRe);
    if (phi < 0) phi += TAU;
  } else {
    phi = 0;
  }

  // Clamp
  theta = Math.max(0, Math.min(Math.PI, theta));
  phi = ((phi % TAU) + TAU) % TAU;
}

function applyGate(gate: IOperator): void {
  currentState = gate.apply(currentState).normalize();
  updateAnglesFromState(currentState);
  updateUI();
  requestBlochDraw();
}

// ============================================================================
// UI Helpers
// ============================================================================

function fmtFixed(n: number, digits: number): string {
  return n.toFixed(digits);
}

function updateUI(): void {
  if (thetaSlider) thetaSlider.value = String(theta);
  if (phiSlider) phiSlider.value = String(phi);
  if (thetaVal) thetaVal.textContent = fmtFixed(theta, 3);
  if (phiVal) phiVal.textContent = fmtFixed(phi, 3);

  // Formula
  const ch = Math.cos(theta / 2);
  const sh = Math.sin(theta / 2);
  const formula = `|ψ⟩ = ${fmtFixed(ch, 3)}|0⟩ + e^{i·${fmtFixed(phi, 2)}}·${fmtFixed(sh, 3)}|1⟩`;
  if (stateFormula) stateFormula.textContent = formula;

  // Probabilities — use ProjectionOperator for |0⟩ measurement probability
  const zeroState = createBasisState(2, 0);
  const proj0 = new ProjectionOperator(zeroState);
  const projected = proj0.apply(currentState);
  const p0 = projected.norm() ** 2; // |⟨0|ψ⟩|²
  const p1 = 1 - p0;

  const pct0 = (p0 * 100).toFixed(2);
  const pct1 = (p1 * 100).toFixed(2);

  if (prob0Fill) prob0Fill.style.width = `${Math.max(2, p0 * 100)}%`;
  if (prob1Fill) prob1Fill.style.width = `${Math.max(2, p1 * 100)}%`;
  if (prob0Val) prob0Val.textContent = `${pct0}%`;
  if (prob1Val) prob1Val.textContent = `${pct1}%`;

  // Phase wheel
  drawPhaseWheel(phi);

  // Stats
  if (statsContainer) {
    const n = currentState.norm();
    const bx = Math.sin(theta) * Math.cos(phi);
    const by = Math.sin(theta) * Math.sin(phi);
    const bz = Math.cos(theta);
    statsContainer.innerHTML = `
      <div class="data-item"><div class="data-label">Norm</div><div class="data-value small">${fmtFixed(n, 6)}</div></div>
      <div class="data-item"><div class="data-label">Bloch x</div><div class="data-value small">${fmtFixed(bx, 4)}</div></div>
      <div class="data-item"><div class="data-label">Bloch y</div><div class="data-value small">${fmtFixed(by, 4)}</div></div>
      <div class="data-item"><div class="data-label">Bloch z</div><div class="data-value small">${fmtFixed(bz, 4)}</div></div>
    `;
  }
}

// ============================================================================
// Canvas — Bloch Sphere
// ============================================================================

function project3D(x: number, y: number, z: number): [number, number, number] {
  // Rotate around Y by viewRotY
  const x1 = x * Math.cos(viewRotY) + z * Math.sin(viewRotY);
  const z1 = -x * Math.sin(viewRotY) + z * Math.cos(viewRotY);
  const y1 = y;

  // Rotate around X by viewRotX
  const x2 = x1;
  const y2 = y1 * Math.cos(viewRotX) - z1 * Math.sin(viewRotX);
  const z2 = y1 * Math.sin(viewRotX) + z1 * Math.cos(viewRotX);

  return [x2, y2, z2];
}

function requestBlochDraw(): void {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    drawBlochSphere();
  });
}

function drawBlochSphere(): void {
  if (!ctx || !canvas) return;
  // Use CSS/client dimensions for logical coordinates (after ctx.scale(dpr))
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.35;

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // --- Sphere outline (circle) ---
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-medium').trim() || '#dadce0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, R, 0, 0, TAU);
  ctx.stroke();

  // --- Equator (ellipse for perspective) ---
  // Equator is the XY plane (z=0). After projection, it becomes an ellipse.
  // We draw it by sampling points.
  ctx.save();
  ctx.beginPath();
  for (let a = 0; a <= TAU; a += 0.05) {
    const [px, py] = project3D(Math.cos(a), Math.sin(a), 0);
    const sx = cx + px * R;
    const sy = cy - py * R; // canvas Y is flipped
    if (a === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#80868b';
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // --- Axes ---
  const axes: [number, number, number, string, string][] = [
    [1, 0, 0, 'X', '#ea4335'],
    [0, 1, 0, 'Y', '#34a853'],
    [0, 0, 1, 'Z', '#1a73e8'],
  ];

  for (const [ax, ay, az, label, color] of axes) {
    const [px, py, pz] = project3D(ax, ay, az);
    // Draw line from center through axis tip (extend slightly beyond sphere)
    const extend = 1.15;
    const sx0 = cx;
    const sy0 = cy;
    const sx1 = cx + px * R * extend;
    const sy1 = cy - py * R * extend;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx0, sy0);
    ctx.lineTo(sx1, sy1);
    ctx.stroke();

    // Small ticks at ±1
    for (const sign of [1, -1]) {
      const [tpx, tpy] = project3D(ax * sign, ay * sign, az * sign);
      const tx = cx + tpx * R;
      const ty = cy - tpy * R;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tx, ty, 3, 0, TAU);
      ctx.fill();
    }

    // Label near the positive tip
    ctx.fillStyle = color;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(label, sx1 + 6, sy1 + 4);
  }

  // --- State vector ---
  const sx = Math.sin(theta) * Math.cos(phi);
  const sy = Math.sin(theta) * Math.sin(phi);
  const sz = Math.cos(theta);

  const [psx, psy, psz] = project3D(sx, sy, sz);
  const screenX = cx + psx * R;
  const screenY = cy - psy * R;

  // Draw line from center to state point
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#1a73e8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(screenX, screenY);
  ctx.stroke();

  // Draw state point
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-danger').trim() || '#ea4335';
  ctx.beginPath();
  ctx.arc(screenX, screenY, 6, 0, TAU);
  ctx.fill();

  // Glow ring
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#1a73e8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(screenX, screenY, 10, 0, TAU);
  ctx.stroke();

  // Small label near state point
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1a1a2e';
  ctx.font = '12px system-ui, sans-serif';
  const labelOffsetX = psx > 0 ? 12 : -42;
  const labelOffsetY = psy > 0 ? -10 : 18;
  ctx.fillText(`|ψ⟩`, screenX + labelOffsetX, screenY + labelOffsetY);
}

// ============================================================================
// Canvas — Phase Wheel
// ============================================================================

function drawPhaseWheel(phase: number): void {
  if (!phaseCtx || !phaseCanvas) return;
  const w = phaseCanvas.width;
  const h = phaseCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.4;

  phaseCtx.clearRect(0, 0, w, h);

  // Background circle
  phaseCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-medium').trim() || '#dadce0';
  phaseCtx.lineWidth = 2;
  phaseCtx.beginPath();
  phaseCtx.arc(cx, cy, R, 0, TAU);
  phaseCtx.stroke();

  // Arrow
  const arrowX = cx + Math.cos(phase) * R * 0.8;
  const arrowY = cy + Math.sin(phase) * R * 0.8;

  phaseCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#1a73e8';
  phaseCtx.lineWidth = 2.5;
  phaseCtx.beginPath();
  phaseCtx.moveTo(cx, cy);
  phaseCtx.lineTo(arrowX, arrowY);
  phaseCtx.stroke();

  // Arrow head
  phaseCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#1a73e8';
  phaseCtx.beginPath();
  phaseCtx.arc(arrowX, arrowY, 4, 0, TAU);
  phaseCtx.fill();

  // Phase text
  phaseCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5f6368';
  phaseCtx.font = '11px system-ui, sans-serif';
  phaseCtx.textAlign = 'center';
  phaseCtx.fillText(`φ = ${fmtFixed(phase, 3)}`, cx, cy + R + 14);
  phaseCtx.textAlign = 'start';
}

// ============================================================================
// Measurement Histogram
// ============================================================================

function runMeasurement(): void {
  const shots = parseInt(shotsSlider.value, 10);
  // Use ProjectionOperator for probability extraction
  const zeroState = createBasisState(2, 0);
  const proj0 = new ProjectionOperator(zeroState);
  const projected = proj0.apply(currentState);
  const p0 = projected.norm() ** 2;
  const p1 = 1 - p0;

  let count0 = 0;
  for (let i = 0; i < shots; i++) {
    if (Math.random() < p0) count0++;
  }
  const count1 = shots - count0;

  drawHistogram(count0, count1, p0, p1, shots);
}

function drawHistogram(
  count0: number,
  count1: number,
  theorP0: number,
  theorP1: number,
  shots: number
): void {
  if (!histCtx || !histCanvas) return;
  const w = histCanvas.width;
  const h = histCanvas.height;
  const pad = 24;
  const barW = (w - pad * 3) / 2;
  const maxH = h - pad * 2 - 20;

  histCtx.clearRect(0, 0, w, h);

  const maxCount = Math.max(count0, count1, 1);

  // Bars
  const bars = [
    { count: count0, label: '|0⟩', x: pad, color: '#1a73e8', theor: theorP0 * shots },
    { count: count1, label: '|1⟩', x: pad * 2 + barW, color: '#34a853', theor: theorP1 * shots },
  ];

  for (const bar of bars) {
    const bh = (bar.count / maxCount) * maxH;
    const by = h - pad - bh;

    // Bar
    histCtx.fillStyle = bar.color;
    histCtx.fillRect(bar.x, by, barW, bh);

    // Count label
    histCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1a1a2e';
    histCtx.font = 'bold 13px system-ui, sans-serif';
    histCtx.textAlign = 'center';
    histCtx.fillText(String(bar.count), bar.x + barW / 2, by - 6);

    // Basis label
    histCtx.font = '12px system-ui, sans-serif';
    histCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5f6368';
    histCtx.fillText(bar.label, bar.x + barW / 2, h - pad + 14);

    // Theoretical line
    const theorH = (bar.theor / maxCount) * maxH;
    const theorY = h - pad - theorH;
    histCtx.strokeStyle = '#ea4335';
    histCtx.lineWidth = 2;
    histCtx.setLineDash([4, 3]);
    histCtx.beginPath();
    histCtx.moveTo(bar.x, theorY);
    histCtx.lineTo(bar.x + barW, theorY);
    histCtx.stroke();
    histCtx.setLineDash([]);

    histCtx.textAlign = 'start';
  }

  // Legend
  histCtx.font = '11px system-ui, sans-serif';
  histCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#5f6368';
  histCtx.fillText('Red dashed = theoretical', pad, 14);
}

// ============================================================================
// DOM Construction
// ============================================================================

function buildHTML(container: HTMLElement): void {
  container.innerHTML = `
    <!-- Row 1: Bloch Sphere + Controls -->
    <div class="card">
      <div class="card-title">🌐 Interactive Bloch Sphere</div>
      <div class="card-subtitle">Drag the sphere to rotate the view. Use sliders or gate buttons to change the qubit state.</div>
      <div class="canvas-container">
        <canvas id="bloch-canvas" width="400" height="320" style="cursor: grab;"></canvas>
      </div>
    </div>

    <!-- Row 2: State Controls -->
    <div class="card">
      <div class="card-title">🎛️ State Controls</div>
      <div class="control-row">
        <div class="control-group">
          <label for="theta-slider">θ (theta)</label>
          <input type="range" id="theta-slider" min="0" max="3.14159" step="0.001" value="0">
          <span id="theta-val" class="data-value small">0.000</span>
        </div>
        <div class="control-group">
          <label for="phi-slider">φ (phi)</label>
          <input type="range" id="phi-slider" min="0" max="6.28318" step="0.001" value="0">
          <span id="phi-val" class="data-value small">0.000</span>
        </div>
      </div>
    </div>

    <!-- Row 3: Gate Buttons -->
    <div class="card">
      <div class="card-title">⚡ Apply Quantum Gates</div>
      <div class="control-row" id="gate-row"></div>
      <div class="control-row">
        <button id="btn-reset" class="btn btn-primary">Reset to |0⟩</button>
        <button id="btn-plus" class="btn btn-primary">Set to |+⟩</button>
      </div>
    </div>

    <!-- Row 4: State Display -->
    <div class="card">
      <div class="card-title">📊 State Display</div>
      <div class="equation-box" id="state-formula">|ψ⟩ = 1.000|0⟩ + e^{i·0.00}·0.000|1⟩</div>
      <div style="margin-top: 12px;">
        <div class="prob-bar">
          <span class="prob-label">|0⟩</span>
          <div class="prob-track"><div class="prob-fill" id="prob-0" style="width: 100%;"></div></div>
          <span class="prob-value" id="prob-0-val">100.00%</span>
        </div>
        <div class="prob-bar">
          <span class="prob-label">|1⟩</span>
          <div class="prob-track"><div class="prob-fill" id="prob-1" style="width: 0%;"></div></div>
          <span class="prob-value" id="prob-1-val">0.00%</span>
        </div>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Relative Phase φ</div>
          <canvas id="phase-canvas" width="100" height="100"></canvas>
        </div>
        <div id="stats-container" class="data-grid" style="flex: 1; min-width: 200px;"></div>
      </div>
    </div>

    <!-- Row 5: Measurement -->
    <div class="card">
      <div class="card-title">🔬 Measurement Simulation</div>
      <div class="control-row">
        <div class="control-group">
          <label for="shots-slider">Shots</label>
          <input type="range" id="shots-slider" min="1" max="10000" step="1" value="1000">
          <span id="shots-val" class="data-value small">1000</span>
        </div>
        <button id="btn-measure" class="btn btn-primary">Run Measurement</button>
      </div>
      <div class="canvas-container" style="margin-top: 12px;">
        <canvas id="hist-canvas" width="500" height="200"></canvas>
      </div>
    </div>
  `;
}

function wireEvents(): void {
  canvas = document.getElementById('bloch-canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;

  thetaSlider = document.getElementById('theta-slider') as HTMLInputElement;
  phiSlider = document.getElementById('phi-slider') as HTMLInputElement;
  thetaVal = document.getElementById('theta-val') as HTMLSpanElement;
  phiVal = document.getElementById('phi-val') as HTMLSpanElement;

  stateFormula = document.getElementById('state-formula') as HTMLDivElement;
  prob0Fill = document.getElementById('prob-0') as HTMLDivElement;
  prob1Fill = document.getElementById('prob-1') as HTMLDivElement;
  prob0Val = document.getElementById('prob-0-val') as HTMLSpanElement;
  prob1Val = document.getElementById('prob-1-val') as HTMLSpanElement;

  phaseCanvas = document.getElementById('phase-canvas') as HTMLCanvasElement;
  phaseCtx = phaseCanvas.getContext('2d')!;

  shotsSlider = document.getElementById('shots-slider') as HTMLInputElement;
  shotsVal = document.getElementById('shots-val') as HTMLSpanElement;
  histCanvas = document.getElementById('hist-canvas') as HTMLCanvasElement;
  histCtx = histCanvas.getContext('2d')!;
  measureBtn = document.getElementById('btn-measure') as HTMLButtonElement;
  statsContainer = document.getElementById('stats-container') as HTMLDivElement;

  // Sliders
  thetaSlider.addEventListener('input', () => {
    setStateFromBlochAngles(parseFloat(thetaSlider.value), phi);
    requestBlochDraw();
  });

  phiSlider.addEventListener('input', () => {
    setStateFromBlochAngles(theta, parseFloat(phiSlider.value));
    requestBlochDraw();
  });

  // Gate buttons
  const gateRow = document.getElementById('gate-row')!;
  for (const g of GATES) {
    const btn = document.createElement('button');
    btn.className = `btn ${g.cls}`;
    btn.textContent = g.label;
    btn.addEventListener('click', () => applyGate(g.gate));
    gateRow.appendChild(btn);
  }

  // Reset / |+⟩
  document.getElementById('btn-reset')!.addEventListener('click', () => {
    setStateFromBlochAngles(0, 0);
    requestBlochDraw();
  });
  document.getElementById('btn-plus')!.addEventListener('click', () => {
    currentState = createPlusState();
    updateAnglesFromState(currentState);
    updateUI();
    requestBlochDraw();
  });

  // Measurement
  shotsSlider.addEventListener('input', () => {
    shotsVal.textContent = shotsSlider.value;
  });
  measureBtn.addEventListener('click', runMeasurement);

  // Canvas drag
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    viewRotY += dx * 0.01;
    viewRotX += dy * 0.01;
    viewRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, viewRotX));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    requestBlochDraw();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (canvas) canvas.style.cursor = 'grab';
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMouseX;
    const dy = e.touches[0].clientY - lastMouseY;
    viewRotY += dx * 0.01;
    viewRotX += dy * 0.01;
    viewRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, viewRotX));
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
    requestBlochDraw();
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });
}

function handleResize(): void {
  const container = canvas.parentElement!;
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  const w = Math.min(400, rect.width - 32);
  const h = 320;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.scale(dpr, dpr);
  requestBlochDraw();

  // Phase canvas
  phaseCanvas.width = 100 * dpr;
  phaseCanvas.height = 100 * dpr;
  phaseCanvas.style.width = '100px';
  phaseCanvas.style.height = '100px';
  phaseCtx.scale(dpr, dpr);
  drawPhaseWheel(phi);

  // Hist canvas
  const histContainer = histCanvas.parentElement!;
  const hRect = histContainer.getBoundingClientRect();
  const hw = Math.min(500, hRect.width - 32);
  histCanvas.width = hw * dpr;
  histCanvas.height = 200 * dpr;
  histCanvas.style.width = `${hw}px`;
  histCanvas.style.height = '200px';
  histCtx.scale(dpr, dpr);
}

// ============================================================================
// Public API
// ============================================================================

const qubitPlayground: QubitPlayground = {
  mount(container: HTMLElement): void {
    currentState = createBasisState(2, 0);
    theta = 0;
    phi = 0;
    viewRotX = 0.3;
    viewRotY = 0.5;

    buildHTML(container);
    wireEvents();

    // Initial sizing + draw
    handleResize();
    updateUI();
    requestBlochDraw();

    // Resize observer
    resizeObserver = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
  },

  unmount(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    isDragging = false;
  },
};

export default qubitPlayground;
