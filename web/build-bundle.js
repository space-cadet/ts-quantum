/**
 * Build script to create browser bundle from simulations.ts
 * Usage: node web/build-bundle.js
 *
 * This script:
 * 1. Takes the simulations.ts file which imports ts-quantum
 * 2. Bundles it with all dependencies using esbuild
 * 3. Creates bundle.js that can be loaded in a browser
 * 4. Generates source maps for debugging
 */

const esbuild = require('esbuild');
const path = require('path');

const buildConfig = {
  entryPoints: [path.resolve(__dirname, 'simulations.ts')],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  outfile: path.resolve(__dirname, 'bundle.js'),
  absWorkingDir: path.resolve(__dirname, '..'),
  sourcemap: true,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': '"browser"'
  }
};

console.log('Building web bundle from simulations.ts...');
console.log('Configuration:', {
  entry: 'web/simulations.ts',
  output: 'web/bundle.js',
  platform: 'browser',
  target: 'es2020'
});

esbuild.build(buildConfig).then(() => {
  console.log('✅ Bundle created successfully!');
  console.log('   Output: web/bundle.js (3.1+ MB with dependencies)');
  console.log('   Source Maps: web/bundle.js.map');
  console.log('\n📖 Open web/showcase.html in a browser to run simulations');
}).catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
