# LabelPress — Barcode Label Generator

Static, client-side barcode label generator. Create labels with product name, optional price, and barcode (Code128 / EAN-13 / UPC-A), preview them live, batch them, then download as PNG or ZIP — or print. No backend, no accounts, no data leaves the browser.

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

Push this repo to GitHub, then import the project in Vercel. No environment variables, databases, or serverless functions are required — the static build is enough.
