# DNA Barcode Generator

A single-page web app that visualizes DNA sequences as color-coded barcodes and exports them as PNG, JPG, or SVG. Sequences can be typed or pasted manually, loaded from built-in examples, or fetched live from NCBI using a species name search.

Live at: [https://dna-barcode-generator.pages.dev](https://dna-barcode-generator.pages.dev)

## Features

- Search by species name (e.g. "dog", "Homo sapiens", "E. coli") to auto-populate a real DNA sequence from the NCBI Entrez API
- Supports gene type selection: COI (mtDNA), 16S rRNA, 18S rRNA, ITS, or custom keyword
- Color-coded bars: A (green), C (blue), G (black), T (red), other (gray)
- Sequence stats: length, GC content, per-nucleotide counts
- Rectangle lock: snaps the barcode to a clean grid where the last row is at most 5 bars short; defaults to the layout closest to a square
- Advanced settings: bar width, bar height, column gap, row gap, per-nucleotide color pickers
- Export as PNG, JPG, SVG, or transparent PNG with a configurable background color
- Light and dark mode with light as default

## Stack

- Nuxt 3 with static site generation
- @nuxt/ui v3 and Tailwind CSS
- NCBI Entrez E-utilities API (no API key required)
- Canvas API and SVG string generation for exports (no html2canvas dependency)
- Deployed to Cloudflare Pages via Git integration

## Development

Install dependencies:

```bash
pnpm install
```

Start the dev server at `http://localhost:3000`:

```bash
npm run dev
```

Build static output:

```bash
npm run generate
```

Preview the production build:

```bash
npm run preview
```

## Deploy

Hosted on Cloudflare Pages. Pushing to `main` triggers an automatic build.

- Build command: `pnpm run build`
- Deploy command: leave blank (Cloudflare Pages auto-deploys)
- Nitro preset: `cloudflare-pages`

## Color Defaults

| Nucleotide | Color  | Hex     |
|------------|--------|---------|
| A          | Green  | #22c55e |
| C          | Blue   | #3b82f6 |
| G          | Black  | #000000 |
| T          | Red    | #ef4444 |
| Other      | Gray   | #9ca3af |

Colors are fully customizable per nucleotide in the advanced settings panel and reset to these defaults at any time.
