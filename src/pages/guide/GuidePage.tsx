import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "1. Overview",
    content: `3D OCT Viewer is a web-based analysis tool for visualizing and quantifying OCT (Optical Coherence Tomography) segmentation masks in interactive 3D. It computes ETDRS-based volume measurements and average layer thicknesses in real physical scale, and renders 3D meshes of retinal layers and fluid accumulations. All processing runs entirely in your browser — no server or data upload is required.`,
  },
  {
    title: "2. Getting Started",
    steps: [
      {
        label: "Create a Patient",
        text: 'Click "New Patient" on the home page. Enter a name and select the eye laterality (OD or OS).',
      },
      {
        label: "Upload OCT Images",
        text: 'Open the patient page, switch to the "OCT Images" tab, and drag-and-drop your OCT images (PNG or JPG). File names should follow a natural order (e.g., p1.png through p25.png).',
      },
      {
        label: "Upload Segmentation Masks",
        text: 'Switch to the "Masks" tab and upload the corresponding segmentation mask PNGs. Each pixel\'s R-channel value represents a label ID (0 = background, 1\u2013N = tissue classes). Filenames must match the OCT images for correct pairing.',
      },
      {
        label: "Configure Labels",
        text: "After uploading masks, detected labels appear in the sidebar. Rename them (e.g., Layer 1 \u2192 NSR, Layer 3 \u2192 SRF) and assign colors by clicking the color swatch.",
      },
    ],
  },
  {
    title: "3. Image Viewer",
    content: `Click any OCT image thumbnail to open the full-screen viewer. When both images and masks are uploaded for the same eye, colored edges of each segmentation label are automatically overlaid on the OCT images.`,
    features: [
      "Zoom in/out with scroll wheel or the on-screen controls, pan by clicking and dragging",
      "Navigate between images with arrow keys or the bottom controls",
      "Toggle edge overlay with the Layers button (bottom-left)",
      "Adjust edge thickness with the slider in the legend panel (bottom-right)",
    ],
  },
  {
    title: "4. 3D Visualization",
    content: `Click "View in 3D" on the patient page to generate interactive 3D meshes from the segmentation masks. The pipeline uses marching cubes with Z-axis interpolation, anisotropic Gaussian blur, and Taubin smoothing to produce smooth, volume-preserving surfaces.`,
    features: [
      "Rotate: left-click and drag",
      "Pan: right-click and drag",
      "Zoom: scroll wheel",
      "Per-layer visibility toggles and opacity sliders",
      "Cross-section slider to clip the volume along the depth axis",
      "Slices panel: toggle the slice grid to see where each uploaded image corresponds to in the 3D render, show or hide individual slices to inspect specific cross-sections within the volume",
    ],
  },
  {
    title: "5. Measurements",
    content: `All measurements are computed in real physical scale using the default OCT spacings (X: 11.54 \u00b5m, Y: 3.87 \u00b5m, Z: 246.0 \u00b5m).`,
    features: [
      "Average thickness (\u00b5m): mean layer thickness across all D\u00d7W columns",
      "Total volume (nL): overall volume per label",
      "ETDRS volumes (nL): per-region volumes displayed on a 9-sector circular grid",
      "ETDRS regions: center (1 mm), inner ring (3 mm), outer ring (6 mm)",
      "Nasal/Temporal orientation adapts to the selected eye (OD vs OS)",
      "Export all measurements to CSV via the sidebar export button",
    ],
  },
  {
    title: "6. Input Format",
    content: `Masks must be grayscale PNGs where each pixel value encodes a class label (R channel). A typical set-up:`,
    table: [
      ["Pixel value", "Meaning"],
      ["0", "Background"],
      ["1", "NSR (Neurosensory Retina)"],
      ["2", "RPE (Retinal Pigment Epithelium)"],
      ["3", "SRF (Sub-Retinal Fluid)"],
      ["4", "PED (Pigment Epithelial Detachment)"],
      ["5+", "Additional custom labels"],
    ],
  },
  {
    title: "7. Data Privacy",
    content: `All data (images, masks, measurements) is stored locally in your browser's IndexedDB. Nothing is uploaded to any server. Clearing your browser data will remove all stored patients and images.`,
  },
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usage Guide</h1>
        <p className="text-muted-foreground mt-2">
          Learn how to use the 3D OCT Viewer for segmentation visualization and
          quantitative analysis.
        </p>
      </div>

      {sections.map((section) => (
        <Card key={section.title} className="gap-2 py-4">
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.content && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.content}
              </p>
            )}

            {section.steps && (
              <ol className="space-y-3">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {section.features && (
              <ul className="space-y-1.5">
                {section.features.map((f, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="text-muted-foreground/50 shrink-0">
                      &bull;
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      {section.table[0].map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.slice(1).map((row, ri) => (
                      <tr key={ri} className="border-t">
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-3 py-1.5 text-muted-foreground"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
