# Voronoi Lab

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-2.1-6E9F18?logo=vitest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

> **Explore the geometry of proximity.** An interactive Voronoi diagram studio with Fortune's sweep-line algorithm, Lloyd's relaxation animation, Delaunay triangulation dual, and image mosaicking — all running at 60 fps on the Canvas2D API.

---

## Problem Statement

Voronoi diagrams partition any plane into regions based on distance to a set of seed points. Each region — or *cell* — contains all points closer to its seed than to any other. They appear everywhere in nature: the skin of a giraffe, dragonfly wings, the structure of corneal cells, and the arrangement of foam bubbles. Engineers use them in urban planning, robot navigation, and texture synthesis.

Yet most Voronoi tools are academic black boxes. You paste in coordinates, get back a static SVG, and learn nothing about *how* the diagram was computed or what happens when you nudge a point. Voronoi Lab changes that: every interaction is live and every computation is visualised so you can build real intuition for this fascinating structure.

The companion feature, Lloyd's relaxation, reveals another beautiful property: repeatedly moving each seed to the centroid of its own cell causes the diagram to converge to a *centroidal* Voronoi tessellation — cells that become nearly equal in size and hexagonal in shape. It is the algorithm behind stipple art, blue-noise sampling, and perfect mesh generation.

---

## Features

- **Fortune's Algorithm** — O(n log n) sweep-line Voronoi in pure TypeScript; runs client-side with no server round-trip
- **Live Editing** — left-click to add seeds, right-click to remove; the diagram rebuilds in real time
- **Lloyd's Relaxation** — step-by-step or continuous animation showing convergence to centroidal Voronoi
- **Delaunay Triangulation** — toggle the dual graph overlay to see how Voronoi and Delaunay are related
- **Centroid Display** — visualise where each cell's centroid lies and watch it chase the seed during Lloyd
- **4 Distribution Modes** — Random, Poisson Disk (blue noise), Hexagonal, and Grid seeding
- **6 Colour Palettes** — Pastel, Vivid, Monochrome, Earth, Ocean, Sunset; plus area-based and neighbour-count-based heat maps
- **Image Mosaicking** — upload any photo and each Voronoi cell is painted with the average colour of the pixels it covers
- **PNG & SVG Export** — one-click export of the current diagram at full canvas resolution
- **Pan & Zoom** — smooth mouse-wheel zoom (0.1× – 20×) and Alt-drag panning
- **Dark / Light Mode** — full toggle with glassmorphism sidebar and gradient background
- **Status Bar** — live stats: site count, edge count, average cell area, average neighbour count, Lloyd step

---

## Tech Stack

| Technology | Purpose | Why Chosen |
|---|---|---|
| React 18 | UI component tree | Concurrent mode, hooks, JSX ergonomics |
| TypeScript 5.7 strict | Full type coverage | Catches geometry math bugs at compile time |
| Vite 6 | Build & dev server | Sub-second HMR, native ESM, tiny config |
| Canvas 2D API | Rendering | No WebGL dependency; perfectly fast for 2D geometry |
| Tailwind CSS 3 | Styling | Utility-first, tree-shaken, design-system consistent |
| Vitest 2 | Unit tests | Same config as Vite; near-instant test runs |
| nginx | Static file serving | Gzip, immutable asset caching, SPA routing |
| Docker multi-stage | Production image | Node builder → nginx runner; ~20 MB final image |

---

## Architecture

```
Browser
  │
  ├── App.tsx ─────────────── Root; owns dark-mode & welcome-modal state
  │     │
  │     ├── useVoronoi()        Core state machine for sites, diagram, Lloyd
  │     │     ├── fortune.ts    Sweep-line Voronoi + Lloyd relaxation (pure math)
  │     │     ├── distributions.ts  Random / Poisson / Hex / Grid seed generators
  │     │     └── colors.ts     Palette assignment + hex/rgb utilities
  │     │
  │     ├── useCanvas()         Pan/zoom event handling; returns CanvasTransform
  │     │
  │     ├── ControlPanel.tsx    Glassmorphism sidebar (settings, export, Lloyd)
  │     ├── VoronoiCanvas.tsx   Canvas element + requestAnimationFrame render loop
  │     ├── InfoBar.tsx         Status bar with live stats
  │     └── WelcomeModal.tsx    Onboarding overlay shown once on first load
  │
  └── canvas.ts               Stateless draw functions; exportToPNG / exportToSVG / imageMosaic
```

**Data flow:**
1. User interaction → `useVoronoi` mutates `sites[]`
2. `computeVoronoi(sites, bounds)` → `VoronoiDiagram` (cells + edges)
3. `assignColors(sites, mode, cells)` → colored `Site[]`
4. `VoronoiCanvas` renders on every animation frame via `requestAnimationFrame`

---

## Project Structure

```
voronoi-lab/
├── src/
│   ├── types/
│   │   └── index.ts          All TypeScript interfaces (Point, Site, VoronoiDiagram, …)
│   ├── lib/
│   │   ├── fortune.ts        Fortune's sweep-line algorithm + Lloyd relaxation
│   │   ├── distributions.ts  Poisson disk, hexagonal, grid, random seed generators
│   │   └── canvas.ts         Draw functions, image mosaic, PNG/SVG export
│   ├── hooks/
│   │   ├── useVoronoi.ts     Diagram state management
│   │   └── useCanvas.ts      Pan/zoom transform management
│   ├── components/
│   │   ├── ControlPanel.tsx  Sidebar UI
│   │   ├── VoronoiCanvas.tsx Canvas + render loop
│   │   ├── InfoBar.tsx       Status bar
│   │   └── WelcomeModal.tsx  Welcome overlay
│   ├── tests/
│   │   ├── fortune.test.ts   13 tests for Voronoi algorithm
│   │   ├── distributions.test.ts  8 tests for seed generators
│   │   └── colors.test.ts    11 tests for color utilities
│   ├── App.tsx               Root component
│   ├── main.tsx              React entry point
│   └── index.css             Tailwind + custom animations
├── public/
│   └── favicon.svg           SVG icon
├── Dockerfile                Multi-stage: deps → builder → nginx runner
├── docker-compose.yml        Production one-command deploy
├── docker-compose.dev.yml    Development with live reload
├── nginx.conf                Gzip + SPA routing + security headers
├── vite.config.ts            Build config with path aliases
├── vitest.config.ts          Test config with jsdom environment
├── tsconfig.json             Strict TypeScript config
├── tailwind.config.js        Tailwind content paths + theme extensions
└── .env.example              Environment variable documentation
```

---

## Quick Start (Docker)

```bash
git clone https://github.com/AgastyaTeja1/project-2026-07-01-voronoi-lab.git
cd project-2026-07-01-voronoi-lab
cp .env.example .env
docker-compose up -d
```

Visit **http://localhost:3000** — the app loads instantly (static files served by nginx).

---

## Local Development Setup

### Prerequisites

- Node.js 20+ (`node --version`)
- npm 10+ (`npm --version`)

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env.local
# No changes needed for local dev — the app is fully client-side
```

### Run

```bash
npm run dev
# → http://localhost:5173
```

### Test

```bash
npm test                  # run all tests once
npm run test:watch        # re-run on file changes
npm run typecheck         # TypeScript strict check
npm run lint              # ESLint
```

### Build

```bash
npm run build             # outputs to dist/
npm run preview           # serve the production build locally
```

---

## Environment Variables

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `VITE_APP_TITLE` | No | `"Voronoi Lab"` | Browser tab title | `"My Voronoi"` |

This is a fully client-side application. No server secrets, no database, no API keys required.

---

## API Documentation

This project has no HTTP API — all computation runs client-side. The public interface is the canvas:

| Interaction | Effect |
|---|---|
| Left-click | Add a seed point at clicked world coordinate |
| Right-click | Remove the nearest seed within 15px |
| Scroll wheel | Zoom in/out centred on cursor |
| Alt + drag | Pan the canvas |
| **Generate** button | Regenerate all seeds from selected distribution |
| **Step** button | One iteration of Lloyd's relaxation |
| **Animate** button | Continuous Lloyd relaxation at 8 fps |

---

## Algorithm Notes

### Fortune's Sweep-Line Algorithm

Fortune's algorithm sweeps a horizontal line top-to-bottom over the sorted seed points. A **beachline** of parabolic arcs (one per processed seed) tracks the Voronoi diagram as it forms ahead of the sweep line. Two types of events are processed from a priority queue:

- **Site events** — the sweep line reaches a new seed; a new arc is inserted into the beachline.
- **Circle events** — three adjacent arcs converge; the middle arc disappears and a Voronoi vertex is recorded.

Complexity: O(n log n) time, O(n) space.

### Lloyd's Relaxation

Given a Voronoi diagram, move each seed to the **centroid** of its own cell, then recompute. Repeat.

The centroid is computed as:
```
cx = (1/6A) Σ (xᵢ + xᵢ₊₁)(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)
cy = (1/6A) Σ (yᵢ + yᵢ₊₁)(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)
```
where A is the signed polygon area. The sequence converges to a **centroidal Voronoi tessellation (CVT)** — optimal for blue-noise sampling and mesh generation.

### Poisson Disk Sampling

Uses Bridson's algorithm (dart-throwing with a spatial grid) to generate points with a guaranteed minimum separation of `0.8 · √(area/n)`. The result is visually uniform without obvious clustering or regularity.

### Image Mosaicking

For each Voronoi cell:
1. Iterate over all pixels in the cell's bounding box.
2. Reject pixels outside the convex hull (point-in-polygon test, stride 2 for speed).
3. Compute the average R, G, B of accepted pixels.
4. Paint the cell with that average colour.

---

## Design System

### Colour Palette

| Token | Dark Mode | Light Mode | Usage |
|---|---|---|---|
| Background | `#0f0f1a` → `#1e1b4b` | `#f1f5f9` → `#ede9fe` | Gradient background |
| Sidebar glass | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.7)` | Frosted panel |
| Accent primary | `#7c3aed` (violet-600) | `#7c3aed` | Buttons, sliders |
| Accent secondary | `#4f46e5` (indigo-600) | `#4f46e5` | Gradient endpoints |
| Edge stroke | `rgba(255,255,255,0.6)` | `rgba(0,0,0,0.5)` | Voronoi edge lines |
| Sweep line | `rgba(255,80,80,0.8)` | Same | Fortune's sweep indicator |

### Design Trends Implemented

1. **Glassmorphism** — sidebar uses `backdrop-blur-md bg-white/5 border border-white/10` for a frosted glass effect that separates controls from the canvas without obscuring it.
2. **Gradient accents** — primary buttons use `bg-gradient-to-r from-violet-600 to-indigo-600`; the welcome modal CTA glows with a matching shadow.
3. **Micro-interactions** — all buttons have `active:scale-95 transition-all` for physical press feedback; checkboxes snap; the slider thumb glows violet on focus.
4. **Dark / Light toggle** — full theme switch with tailored opacity values for every element.
5. **Motion UI** — welcome modal animates in with `fadeInUp 0.3s ease`; Lloyd relaxation creates continuous movement on-canvas.
6. **Neubrutalism accents** — InfoBar uses a bold border-top separator with high-contrast stat labels (`<strong>` values vs muted labels).

---

## Performance

| Technique | Impact |
|---|---|
| Canvas 2D vs DOM | Avoids DOM diffing overhead for 300+ dynamic polygons |
| `requestAnimationFrame` | Renders only when needed; auto-throttles to display refresh rate |
| Stride-2 pixel sampling in mosaic | ~4× faster than per-pixel sampling with negligible quality loss |
| Convex hull cell representation | Cheaper than Sutherland-Hodgman clipping for rendering |
| Vite code splitting | React tree split from app code; React chunk cached separately |
| nginx immutable caching | JS/CSS assets served with `Cache-Control: public, immutable, max-age=31536000` |
| nginx gzip | 70% size reduction for JS bundles |

---

## Security

| Concern | Mitigation |
|---|---|
| XSS | No `dangerouslySetInnerHTML`; all user-supplied data rendered via React's escaped output |
| Image URL leaks | `URL.createObjectURL` → `URL.revokeObjectURL` immediately after `img.onload` |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` header in nginx |
| MIME sniffing | `X-Content-Type-Options: nosniff` header in nginx |
| Referrer leaks | `Referrer-Policy: strict-origin-when-cross-origin` header |
| Hardcoded secrets | None; `.env.example` documents only non-secret config |

---

## Known Limitations

- **Fortune's cell assembly** uses convex hull approximation; non-convex cells near the bounding box may be slightly clipped. A full half-edge DCEL implementation would be more precise.
- **Lloyd animation** reruns the full O(n log n) algorithm each frame. For n > 500, step interval may exceed 120 ms on low-end devices. A native WASM port would help.
- **Image mosaic** processes on the main thread. For large images or many sites, this may briefly block the UI. An OffscreenCanvas + Web Worker port would fix this.
- **No touch support** — pan/zoom/add/remove interactions use mouse events only. Adding pointer events would enable mobile use.
- **No undo/redo** — site additions and removals cannot be reversed without regenerating.

---

## Deployment

### Railway

```bash
# Push to GitHub, then:
railway init
railway up
# → auto-detected as Docker; deploys Dockerfile
```

### Fly.io

```bash
fly launch --dockerfile Dockerfile
fly deploy
```

### DigitalOcean App Platform

1. Connect your GitHub repo.
2. Select **Dockerfile** as the build method.
3. Set the exposed port to `80`.
4. Deploy.

### Plain VPS

```bash
# On the server:
git clone https://github.com/AgastyaTeja1/project-2026-07-01-voronoi-lab.git
cd project-2026-07-01-voronoi-lab
docker-compose up -d
# → http://your-ip:3000
```

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes with strong TypeScript types — `tsc --noEmit` must pass
3. Add or update tests in `src/tests/` — `npm test` must show 0 failures
4. Run `npm run lint` and `npm run format`
5. Open a PR with a clear description of what and why

### Coding Standards

- **No `any` types** — use `unknown` and narrow, or create a proper interface
- **Pure functions** for all math in `lib/` — no side effects, easy to test
- **Comments only for non-obvious invariants** — e.g. why we use convex hull vs DCEL
- **Mobile-first responsive** for any new UI (sidebar collapses at < 640 px)

---

## License

MIT © 2026 — do whatever you like with it.
