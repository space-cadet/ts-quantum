/**
 * Build script for web showcase bundles
 *
 * Produces:
 * - web/bundle.js                  (legacy bundle from web/simulations.ts, used by showcase.html)
 * - web/qrw-refactored.bundle.js    (refactored QRW app bundle from web/js/bundle.js)
 */

const path = require('path');
const esbuild = require('esbuild');

const repoRoot = process.cwd().replace(/\/web$/, ''); // Remove /web if we're in web dir
const webDir = path.join(repoRoot, 'web');

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

  console.log(`Built: ${path.join(webDir, 'bundle.js')}`);
  console.log(`Built: ${path.join(webDir, 'qrw-refactored.bundle.js')}`);
}

build().catch(function(err) {
  console.error('Build failed:', err);
  process.exit(1);
});