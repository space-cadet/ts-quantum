# Deployment Guide - ts-quantum Showcase

This guide explains how to deploy the ts-quantum interactive showcase to Vercel.

## Prerequisites

- Node.js >= 14
- pnpm (or npm)
- Git account (GitHub, GitLab, Bitbucket)
- Vercel account (free tier available at vercel.com)

## Quick Start - Vercel Deployment

### 1. Create a Vercel Account
Visit [vercel.com](https://vercel.com) and sign up with GitHub/GitLab/Bitbucket.

### 2. Connect Your Repository
1. Push your code to GitHub (or GitLab/Bitbucket)
2. Go to Vercel Dashboard
3. Click "New Project"
4. Select "Import Git Repository"
5. Search for `ts-quantum`
6. Click "Import"

### 3. Configure Build Settings
Vercel should auto-detect the configuration from `vercel.json`:

- **Build Command:** `pnpm build && node web/build-bundle.js`
- **Output Directory:** `web`
- **Install Command:** `pnpm install`

Click "Deploy" and wait for the build to complete.

### 4. Access Your Site
After deployment:
- **Live URL:** `https://your-project.vercel.app`
- **Showcase:** `https://your-project.vercel.app/showcase.html`

The root URL will automatically redirect to `showcase.html`.

---

## Local Testing Before Deployment

Test locally to ensure everything works before deploying:

```bash
# Build library and web bundle
pnpm web:build

# Start local server
pnpm web:serve

# Open http://localhost:8080/showcase.html
```

---

## Environment Setup

### vercel.json Configuration

The `vercel.json` file contains:

```json
{
  "buildCommand": "pnpm build && node web/build-bundle.js",
  "outputDirectory": "web",
  "rewrites": [
    {
      "source": "/",
      "destination": "/showcase.html"
    }
  ]
}
```

**Explanation:**
- `buildCommand`: Compiles TypeScript library, then bundles for web
- `outputDirectory`: Only `web/` directory is deployed
- `rewrites`: Root path (`/`) redirects to `showcase.html`

### .vercelignore Configuration

The `.vercelignore` file excludes unnecessary files from deployment:
- Dependencies not needed at runtime
- Source documentation
- Test files
- Development configuration

This reduces deployment time and size.

---

## Rebuilding After Changes

### After modifying simulations.ts:

```bash
pnpm web:build
git add .
git commit -m "Update web simulations"
git push origin main
```

Vercel automatically deploys on push (if configured with Git integration).

### After modifying library (src/):

```bash
pnpm build           # Compile TypeScript
node web/build-bundle.js  # Rebuild browser bundle
git add .
git commit -m "Update library and bundle"
git push
```

---

## Manual Deployment with Vercel CLI

For advanced users, deploy directly with CLI:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project root
vercel

# Or use npm script
pnpm deploy:vercel
```

---

## Troubleshooting

### Build Fails

**Error:** "Could not resolve 'ts-quantum'"
- **Solution:** Ensure `pnpm build` runs first to create `dist/` directory
- **Fix:** Vercel config has correct order: `pnpm build && node web/build-bundle.js`

**Error:** "esbuild not found"
- **Solution:** Ensure `esbuild` is in devDependencies (it is)
- **Fix:** Vercel installs dev dependencies during build

### Bundle.js Too Large

The bundle (3.1 MB) is normal and includes:
- Compiled ts-quantum library
- All mathjs dependencies
- Source maps for debugging

This is acceptable for Vercel's free tier (up to 100 MB per deployment).

### Local Build Works, Vercel Fails

1. Check Node version: Vercel uses specific versions
2. Clear Vercel cache:
   - Dashboard → Project Settings → Build Cache → Clear All
3. Verify `vercel.json` and `.vercelignore` exist
4. Check git history: ensure all files are committed

---

## Performance Optimization

### Current Setup
- Bundle: 3.1 MB (acceptable for web app)
- Load Time: ~2-3 seconds (includes download + execution)
- Runtime: Instant (calculations in browser)

### To Optimize Further:
1. **Enable compression:** Vercel does automatically
2. **Remove source maps:** Delete `bundle.js.map` to save 5.5 MB (optional)
3. **Lazy load:** Only load bundle when showcase page accessed

---

## Domain Setup

To use a custom domain:

1. Go to Vercel Dashboard → Project Settings
2. Click "Domains"
3. Add your domain (e.g., `quantum-showcase.com`)
4. Follow DNS setup instructions
5. Vercel provides free SSL certificate

---

## Continuous Deployment

With Vercel + GitHub integration:
- Every push to main branch auto-deploys
- Pull request previews generated automatically
- Rollback to previous versions in seconds

To disable auto-deployment:
1. Vercel Dashboard → Project Settings
2. Git → "Automatic Deployments" → Turn off

---

## Monitoring

After deployment:
- **Analytics:** Vercel Dashboard shows performance metrics
- **Logs:** View build and runtime logs in Dashboard
- **Status:** Check `https://status.vercel.com` for platform status

---

## Support

If deployment fails:
1. Check Vercel build logs
2. Verify `vercel.json` syntax
3. Ensure `pnpm` works locally with `pnpm web:build`
4. Check GitHub for any uncommitted changes
5. See [Vercel Docs](https://vercel.com/docs) for more help

---

## Rollback to Previous Version

In Vercel Dashboard:
1. Go to "Deployments" tab
2. Find previous working version
3. Click three dots → "Promote to Production"
4. Confirms with message

---

## Next Steps

After successful deployment:
- Share your URL: `https://your-project.vercel.app`
- Monitor performance in Vercel Dashboard
- Update README with live demo link
- Set up analytics/monitoring if needed

---

**Version:** 0.9.0
**Last Updated:** January 2026
