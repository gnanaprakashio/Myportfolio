# Gnanaprakash D — 3D Developer Portfolio

A Three.js portfolio built from my resume: animated 3D hero, interactive skill sphere, scroll-driven sections.

## Run it
Open `index.html` in a browser. `dist/app.js` is already built (Three.js is bundled in, no server needed).
Google Fonts load from the internet; the site falls back to system fonts offline.

## Edit it
- Content: `index.html`
- Styling / colors: `css/style.css` (CSS variables at the top)
- 3D scenes: `src/scene.js`
- Interactions: `src/main.js`

After editing `src/`, rebuild:

```
npm install
npm run build
```

## Deploy
Upload the folder (with `dist/`) to GitHub Pages, Netlify or Vercel. No build step is needed.
