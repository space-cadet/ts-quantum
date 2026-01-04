# Documentation System Design - Implementation Overview
*Created: 2026-01-04 16:10:28 IST*

## Architecture

### Layout Structure
- **Fixed Header**: Theme toggle button (top-right), sidebar toggle (mobile only)
- **Fixed Sidebar**: Collapsible navigation with organized sections
- **Main Content Area**: Dynamic content loading (markdown/HTML)
- **Responsive Design**: Mobile-first approach with breakpoints

### Navigation System
Sidebar contains organized sections:
- **Getting Started**: Interactive Showcase, API Documentation
- **Implementation**: Angular Momentum, Architecture, Clebsch-Gordan, Wigner symbols
- **Advanced Plans**: Graph Entanglement, Intertwiner Module, Sparse Operations, etc.
- **Research**: Academic papers and research documentation
- **References**: PDF references and data files

### Content Loading System
**Unified Content Loading**:
- Markdown files: Processed with remark/unified ecosystem
- HTML files: Loaded via fetch, body content extracted
- API docs: Open in new tabs (external documentation)
- All local content loads in right pane (no new tabs)

### Theme System
**CSS Variables Architecture**:
```css
:root {
  --primary-color: #2563eb;
  --background: #ffffff;
  --surface: #f8fafc;
  --text-primary: #1e293b;
  /* ... */
}

[data-theme="dark"] {
  --primary-color: #3b82f6;
  --background: #0f172a;
  /* ... */
}
```

- Light/Dark themes with localStorage persistence
- Smooth transitions between theme changes
- Consistent color scheme across all components

## Technical Implementation

### Markdown Processing
**Parser Stack**: remark-parse → remark-rehype → rehype-stringify
- Module script: ESM imports from esm.sh CDN
- Global function: `window.renderMarkdown()` for cross-script access
- MathJax integration: Inline math ($...$) and display math ($$...$$)

### Content Loading Functions
```javascript
// Markdown files
showMarkdown(file) → fetch → remark processing → display

// HTML files  
showHtmlPage(page) → fetch → DOMParser → extract body → display

// URL parameter support
?file=architecture.md → showMarkdown()
?page=architecture.html → showHtmlPage()
```

### Navigation State Management
**History API Integration**:
- Push state for each content load
- Back button handling for both content types
- URL parameter support for direct linking
- Active link highlighting

### Mobile Responsiveness
**Breakpoints**:
- **Desktop (>768px)**: Fixed sidebar, full content width
- **Mobile (<768px)**: Collapsible sidebar, overlay backdrop, single column

**Mobile Features**:
- Hamburger menu toggle
- Swipe/close functionality
- Auto-close sidebar after navigation
- Touch-friendly link targets

## Server Infrastructure

### Dev Server Enhancements
**URL Parsing Fix**:
```javascript
const url = new URL(req.url, `http://localhost:${PORT}`);
// Properly separates pathname from query parameters
```

**Routing Logic**:
- `/` → 302 redirect to `/docs/`
- `/docs/*` → Serve documentation files
- `/showcase.html` → Interactive showcase
- `/api/*` → API documentation (new tabs)

## Key Files

### Core Documentation
- `docs/index.html`: Complete redesign with sidebar navigation
- `web/dev-server.js`: Enhanced URL parsing and routing

### Content Files
- All `.md` files: Processed via remark (math support)
- All `.html` files: Loaded via fetch, body extracted
- API docs: External links (preserve new tab behavior)

## Performance Optimizations

### Content Loading
- Fetch API with proper error handling
- DOMParser for HTML content extraction
- Lazy loading of mathematical expressions
- Efficient CSS variable switching

### Caching Strategy
- localStorage for theme preference
- Browser cache for static assets
- Minimal JavaScript dependencies

## Accessibility Features

### Navigation
- Keyboard accessible sidebar
- Focus management for mobile interactions
- Screen reader friendly structure
- High contrast theme support

### Content
- Semantic HTML structure
- Proper heading hierarchy
- MathJax accessibility mode
- Responsive typography

## Status

**Implementation Complete**: All core features implemented and tested
- ✅ Theme system with persistence
- ✅ Mobile-responsive design
- ✅ Unified content loading
- ✅ Navigation state management
- ✅ MathJax integration
- ✅ Server routing fixes

**Future Enhancements**:
- Search functionality
- Print-friendly styles
- Advanced theme customization
- Content caching improvements
