/**
 * ts-quantum Shared Layout Script
 * Handles: component injection, theme toggle, sidebar collapse, mobile sidebar
 */

(function () {
  'use strict';

  // ── Component Loading ──────────────────────────────────────────────

  /**
   * Fetch an HTML component and inject it into an element.
   * @param {string} elementId - ID of the target element
   * @param {string} url - URL of the HTML fragment to load
   */
  window.loadComponent = function (elementId, url) {
    const el = document.getElementById(elementId);
    if (!el) {
      console.warn('Layout: target element #' + elementId + ' not found');
      return Promise.resolve();
    }
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load ' + url + ': ' + r.status);
        return r.text();
      })
      .then(function (html) {
        el.outerHTML = html;
        return html;
      })
      .catch(function (err) {
        console.error('Layout: failed to load component from', url, err);
      });
  };

  /**
   * Load multiple components, then run a callback.
   * @param {Array<{id:string, url:string}>} specs
   * @param {Function} [done]
   */
  window.loadComponents = function (specs, done) {
    const promises = specs.map(function (s) {
      return window.loadComponent(s.id, s.url);
    });
    Promise.all(promises).then(function () {
      if (typeof done === 'function') done();
    });
  };

  // ── Theme Toggle ─────────────────────────────────────────────────

  function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem('tsq-theme');
    if (saved === 'dark') {
      html.classList.add('dark-theme');
    }

    // Delegate to document so dynamically-injected toggles work
    document.addEventListener('click', function (e) {
      const toggle = e.target.closest('#themeToggle');
      if (!toggle) return;
      const isDark = html.classList.toggle('dark-theme');
      localStorage.setItem('tsq-theme', isDark ? 'dark' : 'light');
      const icon = document.getElementById('themeIcon');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    });

    // Set initial icon
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = html.classList.contains('dark-theme') ? '☀️' : '🌙';
  }

  // ── Sidebar Collapse ─────────────────────────────────────────────

  function initSidebarCollapse() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('#sidebarToggle');
      if (!btn) return;
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('collapsed');
    });
  }

  // ── Mobile Sidebar ───────────────────────────────────────────────

  function initMobileSidebar() {
    document.addEventListener('click', function (e) {
      const hamburger = e.target.closest('#hamburger');
      if (hamburger) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
        return;
      }

      // Close when clicking outside on mobile
      if (window.innerWidth > 768) return;
      const sidebar = document.getElementById('sidebar');
      if (!sidebar || !sidebar.classList.contains('open')) return;
      const target = e.target;
      if (!sidebar.contains(target) && !target.closest('#hamburger')) {
        sidebar.classList.remove('open');
        const overlay = document.getElementById('mobileOverlay');
        if (overlay) overlay.classList.remove('show');
      }
    });
  }

  // ── Overlay click to close ───────────────────────────────────────

  function initOverlay() {
    document.addEventListener('click', function (e) {
      const overlay = e.target.closest('#mobileOverlay');
      if (!overlay) return;
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // ── Init ───────────────────────────────────────────────────────────

  function init() {
    initTheme();
    initSidebarCollapse();
    initMobileSidebar();
    initOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
