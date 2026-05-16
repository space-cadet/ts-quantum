
/**
 * Build script for web showcase bundles
 *
 * Produces:
 * - web/bundle.js                  (legacy bundle from web/simulations.ts, used by showcase.html)
 * - web/qrw-refactored.bundle.js    (refactored QRW app bundle from web/js/bundle.js)
 * - web/showcase-v2/showcase-v2.bundle.js  (new modular showcase v2 app)
 * - Copies built files to docs/ for GitHub Pages
 */

const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const repoRoot = process.cwd().replace(/\/web$/, ''); // Remove /web if we're in web dir
const webDir = path.join(repoRoot, 'web');
const docsDir = path.join(repoRoot, 'docs');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${src} -> ${dest}`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  // Legacy bundle (window.simulations)
  await esbuild.build({
    entryPoints: [path.join(webDir, 'simulations.ts')],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    outfile: path.join(webDir, 'bundle.js'),
    absWorkingDir: repoRoot,
    sourcemap: true,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': '"browser"'
    }
  });

  // Refactored QRW bundle
  await esbuild.build({
    entryPoints: [path.join(webDir, 'js', 'bundle.js')],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    outfile: path.join(webDir, 'qrw-refactored.bundle.js'),
    absWorkingDir: repoRoot,
    sourcemap: true,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': '"browser"'
    }
  });

  // Showcase v2 bundle (modular app + demos)
  await esbuild.build({
    entryPoints: [path.join(webDir, 'showcase-v2', 'js', 'app.ts')],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    outfile: path.join(webDir, 'showcase-v2', 'showcase-v2.bundle.js'),
    absWorkingDir: repoRoot,
    sourcemap: true,
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': '"browser"'
    }
  });

  console.log(`Built: ${path.join(webDir, 'bundle.js')}`);
  console.log(`Built: ${path.join(webDir, 'qrw-refactored.bundle.js')}`);
  console.log(`Built: ${path.join(webDir, 'showcase-v2', 'showcase-v2.bundle.js')}`);

  // ── Copy to docs/ for GitHub Pages ──────────────────────────
  console.log('\n--- Copying to docs/ for GitHub Pages ---');
  
  // Showcase v1
  copyFile(path.join(webDir, 'showcase.html'), path.join(docsDir, 'showcase.html'));
  copyFile(path.join(webDir, 'bundle.js'), path.join(docsDir, 'bundle.js'));
  copyFile(path.join(webDir, 'bundle.js.map'), path.join(docsDir, 'bundle.js.map'));
  
  // Showcase v2 (full directory)
  copyDir(path.join(webDir, 'showcase-v2'), path.join(docsDir, 'showcase-v2'));
  
  // Docs index
  // (docs/index.html is maintained directly in docs/, not copied from web/)
  
  console.log('--- Done copying to docs/ ---\n');
}

build().catch(function(err) {
  console.error('Build failed:', err);
  process.exit(1);
});
