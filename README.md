# GameVault (Offline-first PWA)

GameVault is a local-first Progressive Web App for managing games + DLC with tags, custom fields, advanced search/filter/sort, and JSON import/export.

## Run locally
1. `npm install`
2. `npm run dev`
3. `npm run build`
4. `npm run preview`

## Features
- React + TypeScript + Vite + PWA service worker
- Dexie + IndexedDB persistence (no backend / no cloud)
- Library with game detail + DLC detail flows
- Per-item typed custom fields: text, number, boolean, date, choice
- Tag CRUD + multi-select filtering
- Include-DLC toggle for search/filter with matched DLC indicators
- Sort options: A→Z, Z→A, newest, oldest
- Import/export backup JSON with merge/replace modes and validation
- Toast notifications and mobile-first UI

## Project structure
- `src/components` reusable UI/forms
- `src/pages` route pages
- `src/db` Dexie schema and repository methods
- `src/models` TypeScript data models
- `src/utils` search/filter + validation helpers

## How to extend
- Add new custom field types in `src/models/types.ts` and update rendering/validation in `src/components/CustomFieldEditor.tsx` + `src/utils/validation.ts`.
- Add new filters by extending `SearchOptions` and `filterGames` in `src/utils/search.ts`, then wiring controls in `src/pages/LibraryPage.tsx`.
- Add additional import policies in `src/db/repository.ts` inside `importLibrary`.
