/**
 * ts-quantum Showcase v2 — Main App Controller
 *
 * Handles:
 * - Sidebar navigation
 * - Demo loading/unloading
 * - Theme toggle
 * - Routing between demos
 */

// Demo registry — maps demo IDs to their loader functions
interface DemoModule {
  mount(container: HTMLElement): void;
  unmount(): void;
}

const demoRegistry: Record<string, () => Promise<DemoModule>> = {
  'qubit-playground': () => import('./demos/qubit-playground').then(m => m.default),
  'quantum-walk': () => import('./demos/quantum-walk').then(m => m.default),
  'entanglement-lab': () => import('./demos/entanglement-lab').then(m => m.default),
};

let currentDemo: DemoModule | null = null;
let currentDemoId: string = '';

// ============================================================================
// Sidebar Navigation
// ============================================================================

function initSidebar(): void {
  const sidebar = document.getElementById('sidebar')!;
  const toggle = document.getElementById('sidebarToggle')!;
  const navItems = document.querySelectorAll('.nav-item[data-demo]');

  // Toggle collapse
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Nav item clicks
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const demoId = item.getAttribute('data-demo');
      if (demoId) {
        switchDemo(demoId);

        // Update active state
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

// ============================================================================
// Demo Switching
// ============================================================================

async function switchDemo(demoId: string): Promise<void> {
  if (demoId === currentDemoId) return;

  const container = document.getElementById('demo-container')!;
  const titleEl = document.getElementById('page-title')!;

  // Unmount current
  if (currentDemo) {
    currentDemo.unmount();
    currentDemo = null;
  }

  // Clear container
  container.innerHTML = '';

  // Update title
  const titles: Record<string, string> = {
    'qubit-playground': 'Qubit Playground',
    'quantum-walk': 'Quantum Walk Explorer',
    'entanglement-lab': 'Entanglement Lab',
    'angular-momentum': 'Angular Momentum',
    'circuit-builder': 'Circuit Builder',
  };
  titleEl.textContent = titles[demoId] || 'ts-quantum';

  // Load and mount new demo
  const loader = demoRegistry[demoId];
  if (!loader) {
    container.innerHTML = `<div class="card"><p>Demo "${demoId}" not found.</p></div>`;
    return;
  }

  try {
    const demo = await loader();
    currentDemo = demo;
    currentDemoId = demoId;
    demo.mount(container);
  } catch (err) {
    console.error('Failed to load demo:', err);
    container.innerHTML = `
      <div class="card">
        <p style="color: var(--accent-danger)">Failed to load demo: ${err instanceof Error ? err.message : String(err)}</p>
      </div>
    `;
  }
}

// ============================================================================
// Theme Toggle
// ============================================================================

function initTheme(): void {
  const toggle = document.getElementById('themeToggle')!;
  const icon = document.getElementById('themeIcon')!;
  const html = document.documentElement;

  // Load saved preference
  const saved = localStorage.getItem('tsq-theme');
  if (saved === 'dark') {
    html.classList.add('dark-theme');
    icon.textContent = '☀️';
  }

  toggle.addEventListener('click', () => {
    const isDark = html.classList.toggle('dark-theme');
    icon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('tsq-theme', isDark ? 'dark' : 'light');
  });
}

// ============================================================================
// Mobile Sidebar Overlay
// ============================================================================

function initMobile(): void {
  // Add mobile hamburger if needed
  const topBar = document.querySelector('.top-bar')!;
  const hamburger = document.createElement('button');
  hamburger.className = 'mobile-menu-btn';
  hamburger.innerHTML = '☰';
  hamburger.style.cssText = `
    background: none; border: none; font-size: 1.3rem; cursor: pointer;
    color: var(--text-secondary); padding: 4px; margin-right: 8px;
  `;
  hamburger.addEventListener('click', () => {
    document.getElementById('sidebar')!.classList.toggle('open');
  });
  topBar.insertBefore(hamburger, topBar.firstChild);
}

// ============================================================================
// Initialization
// ============================================================================

function init(): void {
  initSidebar();
  initTheme();
  initMobile();

  // Load default demo
  switchDemo('qubit-playground');
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
