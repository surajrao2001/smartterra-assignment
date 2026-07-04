# Water Network Editor

SmartTerra Full Stack Engineer take-home assignment. A browser-only React SPA for editing water distribution networks with role-based access control and an edit-approval workflow.

## How to run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

Other scripts:

```bash
npm run build      # production build
npm run typecheck  # TypeScript check
npm run lint       # ESLint
npm run data:filter-vancouver   # Regenerate filtered Vancouver mains JSON
```

## Seeded users

No password required — pick a user on the login screen:

| Name         | Role     | What to demo                                                   |
| ------------ | -------- | -------------------------------------------------------------- |
| Priya Sharma | Admin    | Review pending edits, approve/reject, view audit trail         |
| Rohan Mehta  | Editor   | Edit network elements, assign field tasks, submit for approval |
| Karan Verma  | Operator | Fill field verification forms for assigned tasks               |

## Demo workflow

1. **Editor** (Rohan): Log in → select a pipe or junction → modify properties → changes accumulate in a draft Edit → optionally assign field task to operator OR submit directly for approval
2. **Operator** (Karan): Log in → open assigned Edit in Edits tab → fill field form (observed value, condition, notes)
3. **Editor** (Rohan): Submit edit for approval after operator completes field form (or skip field step)
4. **Admin** (Priya): Open pending edit → review changes + field input + thread → approve (merges into published network) or reject with reason
5. **Editor** (Rohan): If rejected, resume editing the same Edit and resubmit

## State shape

All state lives in a single Zustand store (`src/store/useAppStore.ts`), persisted to `localStorage` under key `water-network-editor-store`.

| Slice              | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `currentUser`      | Logged-in user (id, name, role)                                 |
| `publishedNetwork` | The live network everyone sees — only mutated on admin approval |
| `edits`            | Map of all Edits keyed by ID, filtered by `status` in the UI    |

Each `Edit` contains:

- `changes[]` — `PropertyChange` entries with `before`/`after` snapshots
- `fieldTask` — optional operator assignment and submission
- `thread[]` — conversation messages (all roles can post)
- `audit[]` — system-generated timeline of actions

## Assumptions & trade-offs

- **Hybrid routing**: react-router separates `/login` and `/app`; all domain state is in Zustand (not Redux)
- **SVG map** instead of Leaflet/Mapbox — full control over selection, pipe-split hit-testing, and pending-edit overlays without fighting a map library
- **Planar distance** for pipe lengths after split — no geodesic precision (assignment explicitly excludes hydraulic simulation)
- **Field verification is optional** — editor can go `draft` → `pending_approval` without operator step
- **Rejected edits are reused** — same Edit object resumes to `draft` to preserve audit trail and thread
- **Cascade delete** records each removed pipe as a separate `PropertyChange` for honest audit trails
- **Pipe coordinates** are recomputed from connected node positions, not trusted from stale GeoJSON
- **Vancouver open data** — optional seed source; see [Vancouver open data (assignment §12)](#vancouver-open-data-assignment-12) below

## Vancouver open data (assignment §12)

The assignment references [City of Vancouver open data](https://opendata.vancouver.ca/). This project supports the **water-distribution-mains** GeoJSON export alongside the PDF §7 sample network.

### Source dataset

| Metric | Value |
| ------ | ----- |
| Dataset | `water-distribution-mains` (GeoJSON export) |
| Total features | **67,293** |
| File size (full export) | **~23 MB** |
| LineString (pipe mains) | 67,284 |
| Point | 9 (edge / zero-length records) |

**Properties on each main** (different from the PDF sample):

| Vancouver field | Example |
| ---------------- | ------- |
| `diameter_mm` | 150, 200 |
| `material` | `"Ductile Iron Concrete Lined"`, `"Cast Iron"` |
| `installation_date` | `"2010-05-06"` |
| `lining_material` | `"Cement Lined"` or `null` |
| `geo_point_2d` | `{ lon, lat }` centroid |

**Not in Vancouver mains data** (present in PDF §7 sample): element `id`, pipe `start`/`end`, junctions, valves, reservoirs, `elevation`, `demand`, `roughness`, `status`. The app converts mains into our graph model (see below).

### Why we filter

PDF §12 says the Vancouver dataset is city-scale — filter to a **bounding box** or render a subset rather than loading everything at once. We filter because:

1. **Performance** — parsing 67k features / 23 MB on every app load would be slow
2. **UX** — tens of thousands of SVG lines would be unreadable and hard to select
3. **Scope** — the assignment evaluates workflow and RBAC, not city-wide GIS viewing

### How we filter

**Script:** `scripts/filter-vancouver-mains.mjs`  
**Command:** `npm run data:filter-vancouver`

1. **Bounding box** (Kitsilano area, lng/lat):

   ```
   Longitude: -123.065 → -123.058
   Latitude:   49.230 →  49.235
   ```

   A main is kept if **any** point on its LineString falls inside the box.

2. **Feature cap:** `MAX_FEATURES = 120`

| Stage | Count |
| ----- | ----- |
| Segments in bbox (uncapped) | 141 |
| Written to filtered file | **120** |
| Filtered file size | **~40 KB** |

**Files:**

```
src/data/water-distribution-mains.geojson   ← full download (gitignored, local only)
src/data/vancouver-mains-filtered.json      ← filtered subset (committed, used by app)
```

### How the app converts it

**Loader:** `src/store/vancouverMainsOps.ts` → `vancouverMainsToNetwork()`

| Our model | Source |
| --------- | ------ |
| **Pipe** | One Vancouver main → one `Pipe` (`P-1`, `P-2`, …) |
| **start / end** | Junction IDs at the line’s first and last coordinate |
| **Junctions** | Inferred at endpoints; shared coordinates → same junction |
| **diameter** | `diameter_mm` |
| **length** | Sum of segment distances along the LineString (planar × 111000 m) |
| **roughness** | 140 if Cast Iron, else 130 (not in open data) |
| **status** | `'open'` (default) |
| **coordinates** | Full LineString (curved mains render on SVG) |

**Synthetic additions** (open data has no supply node):

- **Reservoir R1** — placed west of the first junction
- **One feed pipe** — connects R1 to that junction (mirrors PDF sample topology)

**Runtime cap:** `createSeedNetwork()` uses `maxPipes: 100`, so at most 100 real mains plus one synthetic feed pipe.

**Approximate published network** (when Vancouver mode is on):

| Element | ~Count |
| ------- | ------ |
| Junctions | ~124 |
| Pipes | ~101 (100 mains + 1 R1 feed) |
| Reservoir | 1 |
| Valves | 0 (mains dataset only; valves would need `water-control-valves`) |
| **Total** | **~226** |

Filtered subset diameter mix: 150 mm (38 segments), 200 mm (82 segments).

### Setup & toggle

1. Export **water-distribution-mains** as GeoJSON from Vancouver open data
2. Save as `src/data/water-distribution-mains.geojson`
3. Run `npm run data:filter-vancouver`
4. Set `USE_VANCOUVER_OPEN_DATA = true` in `src/data/seedNetwork.ts`
5. Clear `localStorage` key `water-network-editor-store` if you previously loaded the PDF sample

To use the **assignment PDF sample** instead (R1, J1–J3, V1, P1–P3), set:

```ts
// src/data/seedNetwork.ts
const USE_VANCOUVER_OPEN_DATA = false;
```

### Reviewer notes

1. Filtering follows assignment §12 — not the entire city
2. Junctions are **inferred** from line endpoints; Vancouver does not ship a connected graph
3. `elevation` / `demand` default to **0** where absent
4. **R1 is synthetic** — added for demo supply connectivity
5. **No valves** in mains-only export; hydrants/valves are separate Vancouver datasets
6. **Two-step pipeline** — filter offline (`npm run data:filter-vancouver`), convert at seed time in the app

## Implemented vs stretch goals

### Core (implemented)

- Login with hardcoded users and role-based UI
- RBAC enforced in Zustand store actions + UI guards
- SVG network map with element selection
- Editor: modify/add/delete elements, cascade delete, insert junction on pipe (splits pipe)
- Field task assignment and operator form
- Admin approve/reject workflow with merge into published network
- Conversation thread and audit trail per Edit
- State persistence across page refresh
- Pending-edit map overlay toggle (stretch)
- Diff snippets in edit detail for modify changes (stretch)

### Skipped (time-boxed)

- Undo/redo on edits
- Search/filter for elements
- Mock photo attachment on field form
- JSON import/export of network

## Project structure

```
src/
  types/          # Domain TypeScript types
  data/           # Seed users, PDF sample, Vancouver filtered JSON
  store/          # Zustand store, permissions, networkOps, vancouverMainsOps
  components/
    auth/         # LoginScreen
    layout/       # Guard
    map/          # SVG canvas, pipes, markers
    panels/       # Properties, edits, approval, thread, audit
  hooks/          # useCan, useActiveEdit
  pages/          # EditorPage
  routes/         # Login/app routing with auth guards
```

## Build spec

See [water-network-editor-build-spec.md](water-network-editor-build-spec.md) for the full implementation specification.
