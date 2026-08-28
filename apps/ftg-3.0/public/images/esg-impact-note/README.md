# ESG Impact Note Image Generation Guide

## Overview
This directory contains specification files for generating RWD-compliant PNG images for the ESG Impact Note.

## Image Templates
All HTML templates are in: `apps/ftg-3.0/scripts/generate-esg-images.html`

## Manual Image Generation (Browser-based)

### Option 1: Using html2canvas (Recommended)
1. Open `generate-esg-images.html` in Chrome/Edge
2. Open Developer Tools (F12)
3. For each image element:

```javascript
// Employee Feedback (1024px desktop)
const el = document.getElementById('employee-feedback');
const canvas = await html2canvas(el, {
  scale: 2,
  width: 1024,
  height: 768,
  backgroundColor: '#f3ede1'
});
const img = canvas.toDataURL('image/png');
// Save to file...

// Next Steps (tablet 768px)
const ns = document.getElementById('next-steps');
const nsCanvas = await html2canvas(ns, {
  scale: 2,
  width: 768,
  height: 1024
});

// Activity Info (mobile 480px)
const ai = document.getElementById('activity-info');
const aiCanvas = await html2canvas(ai, {
  scale: 2,
  width: 480,
  height: 800
});
```

### Option 2: Using Puppeteer
```bash
cd /c/Project/esggo && pnpm add -D puppeteer
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + process.cwd() + '/apps/ftg-3.0/scripts/generate-esg-images.html');
  await page.setViewport({width: 1024, height: 768, deviceScaleFactor: 2});
  const el = await page.$("#employee-feedback");
  await el.screenshot({path: 'apps/ftg-3.0/public/images/esg-impact-note/employee-feedback-replacement-desktop.png'});
  await browser.close();
})();
"
```

## RWD Breakpoints
| Breakpoint | Width  | Height | Usage |
|------------|--------|--------|-------|
| Desktop    | 1024px | 768px  | Desktop views |
| Tablet     | 768px  | 1024px | Tablet views |
| Mobile     | 480px  | 800px  | Mobile portrait |
| Compact    | 360px  | 640px  | Small screens |
| Full       | 1920px | Auto   | High-res preview |

## 5T Protocol Compliance
- **Traceable**: Each spec includes source template path + element ID
- **Trackable**: Generation report tracks all RWD sizes
- **Tangible**: Visual content verified in browser preview
- **Transparent**: Zero hallucination - content from validated specs
- **Trustworthy**: SHA-256 hash verification after generation

## Files
- `.spec.json` files: Generation parameters for each PNG
- `generation-report.json`: Overall status and summary
