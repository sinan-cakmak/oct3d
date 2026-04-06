# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OCT 3D Viewer — a standalone, backend-free web application for visualizing OCT (Optical Coherence Tomography) segmentation masks in interactive 3D. All processing runs client-side using Web Workers. Data is persisted in IndexedDB via Dexie.

## Commands

- `npm run dev` — Start Vite dev server at http://localhost:5173
- `npm run build` — TypeScript check + Vite production build (output: `dist/`)
- `npm run lint` — ESLint (flat config v9+, TypeScript + React hooks + React Refresh)
- `npm run preview` — Preview production build

No test framework is configured.

## Architecture

**Stack**: React 19, Vite 6, TypeScript 5.9, Tailwind CSS v4, Shadcn/ui, React Three Fiber, Dexie (IndexedDB), Zustand (theme only).

**Routes** (React Router v7):
- `/` — Patient list (home)
- `/patient/:id` — Patient detail, image/mask upload, label configuration
- `/patient/:id/view/:eye/:imageIndex` — Full-screen OCT image viewer (zoom/pan)
- `/patient/:id/3d/:eye` — Interactive 3D mesh viewer

### 3D Mesh Generation Pipeline

The core pipeline runs entirely in Web Workers (one per label):

```
Mask PNGs (IndexedDB blobs)
  → Canvas getImageData (R channel = label values)
  → stackVolume() — stack slices into 3D Uint8Array volume + Y-flip
  → Web Worker per label:
      extractBinary → interpolateZ (Z-upsampling) → gaussianBlur3D
      → marchingCubes (edge-key hashing for vertex dedup)
      → taubinSmooth (volume-preserving: λ=0.33, ν=-0.34)
  → Structured-clone transfer (Float32Array positions, Uint32Array indices)
  → React Three Fiber BufferGeometry rendering
```

Key files: `src/utils/volumeBuilder.ts`, `src/workers/marchingCubes.worker.ts`, `src/workers/marchingCubesImpl.ts`

### Coordinate System & Axis Mapping

This mapping is critical for correctness — volume indices map to Three.js axes as:
- Volume dim0 (depth/slice index) → THREE.x, spacing: 246.0 µm (Z scaling)
- Volume dim1 (image height) → THREE.y, spacing: 3.87 µm (Y scaling)
- Volume dim2 (image width) → THREE.z, spacing: 11.54 µm (X scaling)

Y-flip in `stackVolume`: image top (ILM) maps to high Y in 3D. ETDRS distance/angle uses X and Z only; Z is negated because z=0 is the most superior scan.

### ETDRS Volume Calculation

9 regions (central + inner/outer rings), eye-aware nasal/temporal classification (OD vs OS flip). Volumes in nanoliters (nL). See `src/utils/etdrsCalculation.ts`.

### Database (Dexie v2)

Two tables: `patients` (id, name, eye, labelConfig) and `images` (id, patientId, filename, type, eye, blob, width, height, sortIndex). Key compound index: `[patientId+type+eye]`. Reactive queries via `useLiveQuery` hook.

Schema changes require bumping the Dexie version number and adding upgrade logic in `src/db/index.ts`.

### State Management

- **Zustand** — Theme (dark/light) with localStorage persistence
- **Dexie React Hooks** (`useLiveQuery`) — Reactive database subscriptions
- **React local state** — Everything else (form inputs, visibility toggles, opacity)

### Styling

Tailwind CSS v4 with `@theme` block for Shadcn color variables. Dark mode via `[data-theme="dark"]` attribute on document root. UI components use CVA (class-variance-authority) for variants. Path alias: `@/*` → `src/*`.

## Key Considerations

- **Worker boundary**: CPU-intensive operations (marching cubes, smoothing, blur) must stay in Web Workers. UI-responsive calculations (ETDRS accumulation) can run on the main thread.
- **Structured transfer**: Worker results use zero-copy ArrayBuffer transfer for performance.
- **Medical correctness**: ETDRS regions, eye laterality (OD/OS), and axis orientations have clinical significance — changes need careful validation.
- **No backend**: All data lives in browser IndexedDB. No network requests.
