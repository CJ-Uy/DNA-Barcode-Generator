# DNA Barcode Generator — CLAUDE.md

## Project Overview

A single-page web app that visualizes DNA sequences as color-coded barcodes and allows PNG export. Deployed to GitHub Pages.

- **Stack:** Nuxt 3 (static/SSG), @nuxt/ui, Tailwind CSS, html2canvas
- **Entry point:** `app.vue` — the entire app lives in one component (no pages/, components/ subdirs)
- **Deploy:** Cloudflare Pages (Git integration — push to `main` triggers a build)

## Key Files

| File | Purpose |
|------|---------|
| `app.vue` | Full app UI and logic |
| `nuxt.config.ts` | Nuxt config (base URL, modules) |
| `app.config.ts` | @nuxt/ui theme (primary color, gray) |
| `NoConsensusCounter.py` | Standalone Python script — counts non-ACGT characters |
| `nuxt.config.ts` | Nuxt config — Cloudflare prerender settings, modules |

## Architecture Notes

- `barcodeColors` is a `ref([])` populated by splitting the input sequence and mapping each nucleotide to a color (`A=green`, `C=blue`, `G=black`, `T=red`, `other=gray`)
- `html2canvas` captures the barcode DOM element and saves it as PNG
- `USlider` controls barcode width (100–1500px) dynamically via `:style`

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run generate   # Build static output to dist/
npm run preview    # Preview production build
```

## Deploy Notes

- Hosted on Cloudflare Pages via Git integration (push to `main` → auto-build)
- In the Cloudflare UI: build command = `pnpm run generate`, output dir = `.output/public`
- `nitro.prerender.autoSubfolderIndex: false` is required to match Cloudflare's route matching rules
- No `app.baseURL` needed — Cloudflare serves from root `/`

## Dependency Decisions

- **@nuxt/ui v3** (not v4): v4 requires Tailwind v4 which is a bigger migration; v3 is the stable middle ground
- **html2canvas**: Kept at v1.x — no viable drop-in replacement that handles the current DOM capture pattern
- **Nuxt 3.x** (not 4): Nuxt 4 requires an `app/` directory restructure; staying on 3.x avoids that churn

## Coding Conventions

- Use `<script setup>` (no Options API)
- Prefer `ref()` over `reactive()` for simple scalar state
- Tailwind utility classes only — no custom CSS files
- No TypeScript strict typing required (project is JS-flavored Vue)
