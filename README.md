# ProTrux — Signal Desk

Local-first collaborative document editor: real-time multi-author editing, offline merge via Yjs CRDT, and an original Signal Desk UI.

**Stack:** React · Vite · TipTap · Yjs · Fastify · WebSockets · SQLite · IndexedDB

---

## Run (dev)

**Need:** Node 20+, [pnpm](https://pnpm.io) 9+

```bash
# 1. Install
pnpm install

# 2. Start API + web together
pnpm dev
```

Wait until both processes are up, then open:

| What | URL |
| :--- | :--- |
| **App** | http://localhost:5173 |
| API + WebSocket | http://localhost:4000 |

Vite proxies `/api` and `/ws` to the server — use **5173** only.

### Cold start (video / demo)

1. `pnpm install`
2. `pnpm dev`
3. Open http://localhost:5173 in Chrome
4. Open a specimen or create a doc → share link in a second window for collab

If a port is busy: stop whatever is on `4000` / `5173`, then run `pnpm dev` again.

### Other commands

```bash
pnpm test      # Vitest — CRDT, ACL, REST
pnpm lint      # ESLint
pnpm build     # shared → server → web
pnpm start     # production server (after build; serves web if built)
```

No `.env` required. SQLite is created automatically under `apps/server/data/`.

---

## What it covers

| Requirement | Delivery |
| :--- | :--- |
| Rich text | TipTap toolbar (bold, italic, headings, lists, color, images, …) |
| Live collab (≥2 users) | Yjs over WebSocket — no refresh |
| Offline → merge | IndexedDB + Fork/Rejoin; CRDT merge on reconnect |
| Presence | Named colored carets + peer facepile |
| Persistence | SQLite (server) + IndexedDB (client) |
| Original design | Signal Desk (carbon / bone / amber) — not a Docs clone |

---

## Quick demo (3–5 min)

1. **Design** — Home → open a specimen; show carbon desk + bone paper + `MERGED · N`.
2. **Live sync** — Same doc URL in two windows; type in both; changes appear without refresh.
3. **Offline merge** — Window 2 → **Fork**; edit both sides differently; Window 2 → **Rejoin** — both edits keep, no conflict dialog.
4. **Extras** — Page setup / image resize / File → Download (PDF or Word).

---

## Architecture (short)

```
Browser A / B          Server
TipTap ↔ Y.Doc  ←WS→  y-websocket rooms
         ↕                  ↕
     IndexedDB           SQLite
```

- **Monorepo:** `apps/web`, `apps/server`, `packages/shared`
- **Share modes:** private / view / edit — enforced on REST **and** WebSocket
- **Fork** disconnects WS but keeps writing to IndexedDB; **Rejoin** syncs state vectors and merges

---

## Project layout

```
apps/web/          React + Vite + TipTap (Signal Desk UI)
apps/server/       Fastify + WebSocket + SQLite
packages/shared/   Types, templates, presence helpers
tests/             Vitest (CRDT convergence, ACL, REST)
```

---

## License

MIT — ProTrux collaborative-docs challenge.
