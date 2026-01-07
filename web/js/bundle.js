/**
 * Refactored QRW entrypoint (esbuild bundling entry)
 */

import { QuantumWalkController } from './simulation-controller.ts';
import { AnalysisPanel } from './analysis-panel.ts';

globalThis.QuantumWalkApp = {
  QuantumWalkController,
  AnalysisPanel
};

// Sidebar functionality
globalThis.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
};

// View switching for sidebar navigation
globalThis.switchView = function(viewName) {
  // Update navigation active states
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  
  const activeNav = document.getElementById('nav-' + viewName);
  if (activeNav) activeNav.classList.add('active');

  // Update content view visibility
  const views = document.querySelectorAll('.content-view');
  views.forEach(view => view.classList.remove('active'));
  
  const activeView = document.getElementById(viewName + '-view');
  if (activeView) activeView.classList.add('active');

  // Special handling for education view
  if (viewName === 'education') {
    setupEducationView();
  }
};

// Quick controls synchronization
globalThis.updateFromQuickControls = function() {
  const quickLattice = document.getElementById('quickLatticeSize');
  const quickCoin = document.getElementById('quickCoinType');
  const mainLattice = document.getElementById('latticeSize');
  const mainCoin = document.getElementById('coinType');
  
  if (quickLattice && mainLattice) {
    mainLattice.value = quickLattice.value;
  }
  if (quickCoin && mainCoin) {
    mainCoin.value = quickCoin.value;
  }
};

// Setup education view content
function setupEducationView() {
  const educationView = document.getElementById('education-view');
  if (educationView && educationView.children.length === 0) {
    educationView.innerHTML = `
      <div class="education-content">
        <h2>Understanding Quantum Random Walks</h2>
        
        <section class="edu-section">
          <h3>What is a Quantum Random Walk?</h3>
          <p>A quantum random walk is the quantum analogue of a classical random walk. Instead of a walker being at definite positions, the quantum walker exists in a <strong>superposition</strong> of positions, creating interference patterns that lead to fundamentally different spreading behavior.</p>
          
          <div class="equation-box">
            <h4>Quantum Evolution Equation</h4>
            $$|\psi(t+1)\rangle = S(C \otimes I)|\psi(t)\rangle$$
            <ul>
              <li><strong>C</strong>: Coin operator (creates superposition)</li>
              <li><strong>S</strong>: Shift operator (moves based on coin state)</li>
              <li><strong>I</strong>: Identity operator on position space</li>
            </ul>
          </div>
        </section>

        <section class="edu-section">
          <h3>Ballistic vs Diffusive Spreading</h3>
          <p>The key difference between quantum and classical walks is their spreading behavior:</p>
          
          <div class="comparison-box">
            <div class="quantum-side">
              <h4>🔬 Quantum Walk</h4>
              <p><strong>Ballistic spreading:</strong> σ² ∝ t²</p>
              <p>The walker spreads quadratically with time due to quantum interference and coherent superposition.</p>
            </div>
            <div class="classical-side">
              <h4>🎲 Classical Walk</h4>
              <p><strong>Diffusive spreading:</strong> σ² ∝ t</p>
              <p>The walker spreads linearly with time due to random, uncorrelated steps.</p>
            </div>
          </div>
        </section>

        <section class="edu-section">
          <h3>Coin Operators</h3>
          <p>The coin operator determines how the quantum walker's "coin state" evolves, creating the superposition that enables quantum interference.</p>
          
          <div class="coin-examples">
            <div class="coin-card">
              <h4>Hadamard Coin</h4>
              $$H = \frac{1}{\sqrt{2}}\begin{bmatrix} 1 & 1 \\ 1 & -1 \end{bmatrix}$$
              <p>Creates equal superposition with relative phase, leading to symmetric spreading patterns.</p>
            </div>
            
            <div class="coin-card">
              <h4>Grover Coin (d=2)</h4>
              $$G = 2|s\rangle\langle s| - I = \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$$>
              <p>For 2-dimensional coin space, reduces to NOT gate. Creates classical-like behavior without dispersion.</p>
            </div>
            
            <div class="coin-card">
              <h4>Rotation Coin</h4>
              $$C(\theta) = \begin{bmatrix} \cos\theta & \sin\theta \\ \sin\theta & -\cos\theta \end{bmatrix}$$
              <p>Generalized coin with tunable parameter θ. Controls the balance between superposition and bias.</p>
            </div>
          </div>
        </section>

        <section class="edu-section">
          <h3>Boundary Conditions</h3>
          <p>How the walk behaves at the edges of the lattice dramatically affects the interference patterns:</p>
          
          <div class="boundary-examples">
            <div class="boundary-card">
              <h4>Reflecting Boundaries</h4>
              <p>At the edges, the coin state flips (LEFT ↔ RIGHT), causing the walker to reflect back into the lattice. This creates standing wave patterns and enhances interference effects.</p>
            </div>
            
            <div class="boundary-card">
              <h4>Periodic Boundaries</h4>
              <p>The lattice wraps around like a torus. Walking off one edge brings you back to the opposite side. This preserves translational symmetry and creates different interference patterns.</p>
            </div>
          </div>
        </section>

        <section class="edu-section">
          <h3>Applications of Quantum Walks</h3>
          <p>Quantum random walks are not just theoretical curiosities - they have practical applications in:</p>
          
          <ul class="applications-list">
            <li><strong>Quantum Algorithms:</strong> Search algorithms, element distinctness, graph traversal</li>
            <li><strong>Quantum Simulation:</strong> Modeling transport phenomena, energy transfer in photosynthesis</li>
            <li><strong>Universal Quantum Computation:</strong> Quantum walks can be used to build quantum computers</li>
            <li><strong>Complex Systems:</strong> Modeling biological processes, financial markets, social networks</li>
          </ul>
        </section>

        <div class="action-box">
          <h3>🚀 Try It Yourself!</h3>
          <p>Now that you understand the theory, switch to the <strong>Visualization</strong> tab to see these concepts in action. Experiment with different coins and boundary conditions to observe how they affect the quantum walk's behavior.</p>
          <button onclick="switchView('visualization')" class="primary-btn">Go to Visualization</button>
        </div>
      </div>
    `;
  }
}

// Legacy tab function for backward compatibility
globalThis.switchTab = function (tabName) {
  // Map old tab names to new view names
  const viewMapping = {
    'visualization': 'visualization',
    'analysis': 'analysis'
  };
  
  const viewName = viewMapping[tabName];
  if (viewName) {
    switchView(viewName);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const vizContainer = document.getElementById('visualization-view');
  const analysisContainer = document.getElementById('analysis-view');

  if (vizContainer) {
    const controller = new QuantumWalkController(vizContainer);
    controller.initialize();
  }

  if (analysisContainer) {
    const analysisPanel = new AnalysisPanel(analysisContainer);
    const panelElement = analysisPanel.createPanel();
    analysisContainer.appendChild(panelElement);
  }
});