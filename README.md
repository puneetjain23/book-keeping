# Home Builder Bookkeeping

Minimal starter skeleton built to the user's specification:

- React + TypeScript + Dexie + Tailwind
- Export / Import Excel (xlsx) + Clear DB
- Floating cards & high-contrast typography
- Single-file bundling via `vite-plugin-singlefile` (after build)

## How to run

1. `npm install`
2. `npm run dev` (development)
3. `npm run build` to create a production bundle (single-file will be produced by plugin)

Files included: basic DB schema, excel utils, pages, and styles. This is a starting scaffold — fill in business logic per the detailed spec.

Added: Full CRUD pages for Projects, Parties, Flats, Transactions, Reports and shadcn-like UI components.
