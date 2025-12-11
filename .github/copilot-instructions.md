# HTML Studio - AI Coding Agent Instructions

## Project Overview
HTML Studio is a live HTML/CSS/JS editor with real-time preview, built as a React SPA and deployed to Cloudflare Workers. Think CodePen/JSFiddle clone with Monaco Editor integration.

## Architecture & Data Flow

**State Management**: Zustand with persistence middleware ([src/store/useCodeStore.ts](../src/store/useCodeStore.ts))
- Single store manages `html`, `css`, `js` code state
- Auto-persists to localStorage under key `html-studio-storage`
- Default starter code defined in store initialization

**Component Architecture**:
1. [App.tsx](../src/App.tsx): Main container with tab navigation and split-panel layout
2. [CodeEditor.tsx](../src/components/CodeEditor.tsx): Monaco Editor wrapper for each language
3. [Preview.tsx](../src/components/Preview.tsx): Sandboxed iframe with 500ms debounced rendering

**Preview Rendering Flow**:
- Store updates → Preview component subscribes → 500ms debounce → iframe srcDoc update
- Full HTML document constructed with inline `<style>` and `<script>` tags
- JavaScript wrapped in try-catch to prevent preview crashes

## Key Development Patterns

### Monaco Editor Integration
```tsx
// Language prop must be 'html', 'css', or 'javascript' (not 'js')
<CodeEditor language="javascript" value={js} onChange={setJs} />
```
- Editor auto-sizes with `automaticLayout: true`
- VS Dark theme hardcoded, no light theme support

### Styling Conventions
- **Tailwind utility classes** for all styling (no CSS modules)
- VS Code dark theme colors: `bg-[#1e1e1e]`, `bg-[#252526]` for editor UI
- Use `clsx` for conditional classes on tabs (see tab buttons in [App.tsx](../src/App.tsx))
- Icons from `lucide-react` library

### Split Panel Layout
```tsx
<PanelGroup direction="horizontal">
  <Panel defaultSize={50} minSize={20}>{/* Editor */}</Panel>
  <PanelResizeHandle className="..." />
  <Panel minSize={20}>{/* Preview */}</Panel>
</PanelGroup>
```
Uses `react-resizable-panels` - panels must have `minSize` to prevent collapse.

## Development Workflow

### Commands
```bash
npm run dev         # Vite dev server (http://localhost:5173)
npm run build       # TypeScript check + Vite build → dist/
npm run lint        # ESLint with flat config (eslint.config.js)
npm run deploy      # Build + deploy to Cloudflare Workers
```

### Cloudflare Workers Deployment
- Static assets served via [src/worker.js](../src/worker.js) using `@cloudflare/kv-asset-handler`
- Config: [wrangler.toml](../wrangler.toml) points to `dist/` bucket
- **Critical**: Worker uses CommonJS syntax (`export default { async fetch() }`)

## Critical Gotchas

1. **Monaco language names**: Use `'javascript'` not `'js'` for the language prop
2. **Preview debouncing**: 500ms hardcoded - changing affects UX significantly
3. **Store persistence**: Clearing localStorage wipes user's work (no cloud backup)
4. **Iframe sandbox**: `allow-scripts` only - no modals, popups, or form submissions work
5. **No server-side features**: Pure static SPA, no API routes or backend logic

## Adding New Features

**New UI buttons** (Download/Share pattern):
```tsx
<button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm">
  <Icon size={14} /> Label
</button>
```

**New editor tabs**: Add to tab array in [App.tsx](../src/App.tsx), extend `activeTab` type, add store state slice

**Toast notifications**: Use `react-hot-toast` (already configured), see `handleDownload` example

## TypeScript Configuration
- Strict mode enabled (`tsconfig.json`)
- Separate configs for app (`tsconfig.app.json`) and Node tooling (`tsconfig.node.json`)
- React 19 types - use new `React.FC` patterns without children prop by default

## Testing & Validation
- No test suite currently configured
- Manual testing via `npm run dev` and live preview
- ESLint catches common React/TypeScript issues
- Validate Cloudflare deployment locally: `wrangler dev` (uses local worker)
