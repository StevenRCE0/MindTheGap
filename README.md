# Mind the Gap

Offline-first SvelteKit app for newcomers in London.  
It includes:

- Starter guides for settling in London
- Home page guide card grid; each card opens its own guide (`/guide/[id]`)
- Users read a selected guide and log photo achievements directly on that guide page
- Camera/photo logging as achievements (photo-only, no text fields required)
- IndexedDB persistence so achievements stay available offline
- Native sharing of achievement photos (with download fallback)
- Service worker app-shell caching for offline access

## Run locally

```bash
npm install
npm run dev -- --open
```

## Production build

```bash
npm run check
npm run build
npm run preview
```

## Offline notes

- Service worker is active in production builds (`npm run build && npm run preview`)
- The app shell is precached, and navigation has offline fallback to `/`
- Achievements are saved in IndexedDB per browser profile
