/**
 * Refactored QRW entrypoint (esbuild bundling entry)
 */

import { QuantumWalkController } from './simulation-controller.ts';
import { AnalysisPanel } from './analysis-panel.ts';

globalThis.QuantumWalkApp = {
  QuantumWalkController,
  AnalysisPanel
};

globalThis.switchTab = function (tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  const headers = document.querySelectorAll('.tab-header');

  tabs.forEach(tab => tab.classList.remove('active'));
  headers.forEach(header => header.classList.remove('active'));

  const tab = document.getElementById(tabName + '-tab');
  if (tab) tab.classList.add('active');

  if (typeof event !== 'undefined' && event && event.target && event.target.classList) {
    event.target.classList.add('active');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const vizContainer = document.getElementById('visualization-tab');
  const analysisContainer = document.getElementById('analysis-tab');

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