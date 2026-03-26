# OCT 3D Viewer

A standalone, backend-free web application for visualizing OCT (Optical Coherence Tomography) segmentation masks in interactive 3D. All processing runs client-side using Web Workers for marching cubes mesh generation.

## Features

- **Patient Management** — Create, rename, and delete patients with per-eye (OD/OS) data separation
- **Image Upload** — Drag-and-drop upload of OCT B-scan images and pre-computed segmentation masks (PNG)
- **Label Detection** — Automatic detection of unique label classes from uploaded masks with configurable names and colors
- **Image Viewer** — Full-screen OCT image viewer with zoom, pan, keyboard navigation, and thumbnail strip
- **3D Visualization** — Interactive 3D mesh rendering from segmentation masks via marching cubes
  - Per-layer visibility toggles and opacity sliders
  - Taubin mesh smoothing (volume-preserving)
  - Slice grid overlay with per-slice show/hide (filters actual mesh geometry via custom shader)
  - ETDRS grid overlay with N/T/S/I directional labels (eye-aware)
  - ETDRS volume measurements per region per layer (nL)
  - ETDRS circular volume diagram
- **Persistence** — All data stored in IndexedDB (survives page refresh, no server needed)
- **Dark/Light Theme** — Toggle between themes, persisted in localStorage

## Input Format

- **OCT images**: Standard PNG/JPG files (e.g., `p1.png` through `p25.png`)
- **Mask images**: Grayscale PNGs where each pixel value is a label ID (0 = background, 1-N = tissue classes)
  - Example: `0` = background, `1` = NSR, `2` = RPE, `3` = SRF, `4` = KNV-2
- Filenames should match between OCT and mask images for correct slice ordering

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 + TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Persistence | IndexedDB via Dexie |
| 3D Rendering | React Three Fiber + Three.js + @react-three/drei |
| Mesh Generation | Custom marching cubes in Web Worker (~200 lines + lookup tables) |
| Mesh Smoothing | Taubin smoothing (lambda=0.33, nu=-0.34) |
| Icons | Lucide React |
| Notifications | Sonner |
| Animations | Framer Motion |

## Getting Started

```bash
cd oct3d
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. **Create a patient** — Click "New Patient" on the home page, enter a name and select the eye (OD/OS)
2. **Upload images** — Navigate to the patient page, use the OD/OS toggle to select the eye, then drag-and-drop OCT images and masks
3. **Configure labels** — After uploading masks, detected labels appear in the sidebar. Rename them (e.g., "Layer 1" → "NSR") and assign colors
4. **View images** — Click any OCT image thumbnail to open the full-screen viewer
5. **Visualize in 3D** — Click "View in 3D" to generate and render 3D meshes from the masks

## 3D Pipeline

```
Mask PNGs (IndexedDB)
    ↓  Canvas getImageData (R channel)
Pixel arrays (Uint8Array per slice)
    ↓  stackVolume() with Y-flip
3D volume (Uint8Array[D×H×W])
    ↓  extractBinaryVolume() per label
Binary volumes
    ↓  Web Worker: marchingCubes() + taubinSmooth()
Float32Array positions + Uint32Array indices
    ↓  THREE.BufferGeometry (zero-copy transfer)
React Three Fiber scene
```

## ETDRS Volume Calculation

Volumes are calculated per ETDRS region per label:
- **Central (c1)**: 0–500 µm radius
- **Inner ring (s3, i3, n3, t3)**: 500–1500 µm radius
- **Outer ring (s6, i6, n6, t6)**: 1500–3000 µm radius

Nasal/temporal assignment depends on eye laterality (OD vs OS). Volumes are reported in nanoliters (nL).

## Default Scalings

| Axis | Spacing | Description |
|---|---|---|
| X | 11.54 µm | Lateral (within B-scan) |
| Y | 3.87 µm | Axial (depth within B-scan) |
| Z | 246.0 µm | Between B-scans |

## Project Structure

```
src/
├── components/          # Shared UI (Shadcn, ThemeToggle, Layout)
├── db/                  # Dexie database + CRUD helpers
├── utils/               # Natural sort, mask analysis, volume builder, ETDRS calc, color palette
├── workers/             # Marching cubes Web Worker + algorithm implementation
└── pages/
    ├── home/            # Patient list
    ├── patient/         # Patient detail + upload + label config
    ├── viewer/          # Full-screen OCT image viewer
    └── viewer3d/        # Interactive 3D mesh viewer
```

## Axis Mapping

Marching cubes output maps to Three.js coordinates as follows:
- Volume dim0 (depth/slice index) → THREE.x, spaced by Z scaling (246.0 µm)
- Volume dim1 (image height) → THREE.y, spaced by Y scaling (3.87 µm)
- Volume dim2 (image width) → THREE.z, spaced by X scaling (11.54 µm)
