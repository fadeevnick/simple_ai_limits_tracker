<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project: AI Limits

Track usage limits for AI services and life deadlines.

### Architecture

- **Stack**: Next.js (App Router) + file-based JSON store (`../data/store.json`)
- **Data flow**: Client → REST API (`/api/*`) → `src/lib/store.ts` (read/write JSON) → `store.json`
- **No database** — all persistence is a single JSON file on disk

### Key files

| Path | Purpose |
|---|---|
| `src/lib/types.ts` | `Service`, `Account`, `LifeLimit`, `Store` interfaces |
| `src/lib/store.ts` | CRUD functions + migrations; reads/writes `store.json` |
| `src/lib/api.ts` | Client-side fetch helpers for all API endpoints |
| `src/lib/time.ts` | Time utilities (expiry, formatting, `calcResetsAt`) |
| `src/lib/useModal.ts` | Generic modal state hook |
| `src/components/Dashboard.tsx` | Main page component, orchestrates all state |
| `src/components/ServiceGroup.tsx` | Renders one service + its accounts |
| `src/components/AccountRow.tsx` | Single account row with progress bar |
| `src/app/api/` | Server-side API routes (services, accounts, life-limits) |

### Store schema

```ts
Store {
  services: Service[]      // { id, name, order, activeAccountId? }
  accounts: Account[]      // { id, serviceId, name, usagePercent, resetsAt? }
  lifeLimits: LifeLimit[]  // { id, name, deadline }
}
```

- `activeAccountId` on Service — which account is highlighted; persisted in store, toggled via PATCH `/api/services/:id` with `{ activeAccountId }`
- Deleting an account clears `activeAccountId` on its service automatically

### Conventions

- Migrations go in `readStore()` — add field defaults for existing data
- API routes are thin wrappers around store functions
- Client state lives in `Dashboard.tsx`; individual components are presentational
- `stopPropagation` on edit/del buttons so they don't trigger row click

### Build & dev

```bash
npm run dev    # dev server
npx next build # production build check
```
