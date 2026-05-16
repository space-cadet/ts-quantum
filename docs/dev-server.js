/**
 * Development server with hot reload for web showcase
 * Usage: node web/dev-server.js
 * 
 * Features:
 * - Watches simulations.ts and rebuilds bundle on changes
 * - Serves files on http://localhost:8080
 * - Auto-refreshes browser when bundle changes (via polling)
 */

const esbuild = require('esbuild');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WEB_DIR = path.resolve(__dirname);
const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
const BUNDLE_PATH = path.join(WEB_DIR, 'bundle.js');
const PORT = 8080;

let lastBundleTime = 0;

// Build configuration
const buildConfig = {
  entryPoints: [path.resolve(__dirname, 'simulations.ts')],
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  outfile: BUNDLE_PATH,
  absWorkingDir: path.resolve(__dirname, '..'),
  sourcemap: true,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': '"browser"'
  }
};

// Initial build
async function buildBundle() {
  try {
    await esbuild.build(buildConfig);
    lastBundleTime = Date.now();
    console.log('✅ Bundle built successfully');
  } catch (err) {
    console.error('❌ Build failed:', err.message);
  }
}

// Watch mode
async function watchBundle() {
  const context = await esbuild.context(buildConfig);
  await context.watch();
  console.log('👀 Watching for changes...');
}

// Simple HTTP server
function startServer() {
  const server = http.createServer((req, res) => {
    // Parse URL to separate path from query parameters
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // Handle hot reload check endpoint
    if (url.pathname === '/__hotreload__') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ time: lastBundleTime }));
      return;
    }

    // Serve files from web or docs directory
    let filePath;
    if (url.pathname.startsWith('/docs')) {
      const docPath = url.pathname.slice(5) || '/';
      filePath = path.join(DOCS_DIR, docPath === '/' ? 'index.html' : docPath);
    } else if (url.pathname === '/') {
      // Redirect root to docs home page
      res.writeHead(302, { 'Location': '/docs/' });
      res.end();
      return;
    } else {
      filePath = path.join(WEB_DIR, url.pathname === '/' ? 'showcase.html' : url.pathname);
    }
    
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.map': 'application/json',
      '.css': 'text/css',
      '.json': 'application/json'
    };

    const contentType = mimeTypes[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 Dev server running at http://localhost:${PORT}`);
    console.log(`📄 Open http://localhost:${PORT} in your browser`);
    console.log(`\nHot reload enabled: Changes to simulations.ts will rebuild automatically`);
  });
}

// Main
async function main() {
  console.log('🔨 Starting development server with hot reload...\n');
  
  await buildBundle();
  await watchBundle();
  startServer();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
