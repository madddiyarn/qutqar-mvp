# Boltzzmann MVP

Boltzzmann is a working hackathon MVP for an AI-assisted coastal safety and drone operations command center in Aktau, Kazakhstan.

This is an operational web application, not a landing page.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, lucide-react, Recharts
- Backend: Node.js, TypeScript, Express, Socket.IO
- Database: PostgreSQL on Neon, Prisma ORM
- Maps: Leaflet with OpenStreetMap tiles

## Real vs mocked

Real:

- PostgreSQL database on Neon
- Prisma schema, migrations, and seed data
- REST API
- Socket.IO realtime events
- Incident creation and status transitions
- Search mission creation
- Patrol creation
- Rescue assignment transitions
- Analytics from stored database rows
- Russian command-center UI

Mocked for MVP:

- DJI connection
- Drone telemetry and GPS movement
- Live drone stream
- AI inference and detection boxes
- Autonomous flight
- Rescue dispatch logistics and payload delivery
- Smartwatch hardware
- Printer hardware
- Marine/weather/satellite providers where live APIs are not connected
- Visual similarity inference

The UI labels demo/mocked AI and stream pieces clearly.

## Neon setup used

The project was linked to Neon project `mute-hat-82341837` on branch `production`.

Commands run:

```bash
npm i -g neon@latest && neon login
neon skills -y
neon mcp -y
neon link --project-id mute-hat-82341837 --branch production -y
neon config init
```

`neon.ts` is intentionally minimal:

```ts
import { defineConfig } from "@neon/config/v1";

export default defineConfig({});
```

Then:

```bash
neon deploy
```

Neon writes real connection strings to `.env.local`. That file is ignored by git.

## Install and run

```bash
npm install
```

Generate Prisma Client:

```bash
set -a; source .env.local; set +a; npm run db:generate
```

Apply migrations:

```bash
set -a; source .env.local; set +a; DATABASE_URL="$DATABASE_URL_UNPOOLED" npx prisma migrate deploy
```

Seed/reset demo data:

```bash
set -a; source .env.local; set +a; npm run demo:reset
```

If you are pointing at a shared/production Neon branch and do not want to wipe existing rows, use:

```bash
set -a; source .env.local; set +a; npm run db:seed
```

Run API and web:

```bash
npm run dev:api
npm run dev:web
```

Open:

- Command center: http://localhost:5173/overview
- Live operations: http://localhost:5173/live
- Mobile rescuer view: http://localhost:5173/rescue

API runs at:

- http://localhost:4100/api/health

## Implemented routes

- Connection gateway - shown before the command center when no active `DroneConnection` exists
- `/overview` - main command center with KPIs, Leaflet map, zones, drones, rescuers, search areas, drift areas, last-seen points, sea summary, timeline
- `/live` - drone live operations with mocked stream, deterministic AI alert, confirm/false alarm actions, full scenario trigger
- `/incidents` - incident table, detail panel, timeline, confirm/dispatch/evidence/resolve/false-alarm actions
- `/search` - search mission form with map point selection, radius, last-seen time, tags, visual reference field, candidates, last-seen network, drift
- `/playback` - prerecorded recording metadata, timeline events, synchronized map, AI overlay marker, change detection
- `/evidence` - evidence package list and printable official report view with QR payload
- `/sea` - simulated Sea Intelligence, operational indicators, map, forecast timeline, offline queue demo controls
- `/patrols` - patrol creation and patrol status cards
- `/analytics` - Recharts dashboard from database data
- `/drones` - fleet page and telemetry chart
- `/rescue` - phone/watch-sized rescuer workflow for accept/arrived/rescued

## Database tables

Prisma models:

- `User`
- `Drone`
- `DroneTelemetry`
- `Incident`
- `IncidentEvent`
- `Patrol`
- `SearchMission`
- `SearchCandidate`
- `Detection`
- `Zone`
- `Rescuer`
- `RescueAssignment`
- `DroneConnection`
- `TargetSighting`
- `Recording`
- `RecordingEvent`
- `ChangeDetection`
- `Evidence`
- `EvidenceAsset`
- `PrintJob`
- `ResponseService`
- `EnvironmentalSnapshot`
- `DriftPrediction`
- `OfflineSyncEvent`

Migrations are in `prisma/migrations`.

## Demo credentials / serials

No login is required.

Seeded mocked drone serials:

- `AVATA2-DEMO-001`
- `M3E-DEMO-002`
- `M30-DEMO-003`

The connection gateway also accepts any non-empty serial number in demo mode.

## Hackathon demo sequence

Fast deterministic path:

1. Open `/overview` or `/live`.
2. Click `Запустить сценарий`.
3. The backend runs the complete deterministic flow:
   - mocked DJI Avata 2 session
   - mocked live detection
   - potential drowning incident
   - Boltzzmann AI dispatcher analysis
   - PostgreSQL incident/events
   - evidence package
   - print job `QUEUED -> PRINTING -> PRINTED`
   - rescue dispatch
   - rescuer `ACCEPT -> ARRIVED -> RESCUED`
   - incident `RESOLVED`
   - drift prediction using the Sea Intelligence snapshot
4. Open `/evidence`, `/playback`, `/analytics`, and `/sea` to show persisted outputs.

Operator-in-the-loop path:

1. Open `/live`.
2. Click `Запустить demo flow`.
3. Wait for `POTENTIAL DROWNING DETECTED`.
4. Click `Подтвердить инцидент`.
5. Open `/incidents`, select the incident, and click `Dispatch`.
6. Open `/rescue`; click `ПРИНЯТЬ`, `ПРИБЫЛ`, then `СПАСЁН`.

Search and rescue path:

1. Open `/search`.
2. Enter approximate location/time, radius, description, distinctive tags, and optional visual reference.
3. Create the mission, then use `Симулировать скан`.
4. Candidate similarity, matched items, last-seen timeline, and drift areas are persisted in PostgreSQL.

Reset between demos:

```bash
set -a; source .env.local; set +a; npm run demo:reset
```

## Verification performed

- Prisma migration `20260924054156_qutqar_phase2_ops` was created and applied to Neon branch `production`.
- Prisma Client generation completed.
- Non-destructive `npm run db:seed` completed against Neon.
- `npm run build` passed for API and web.
- API health returned `database: connected`.
- `/api/overview`, `/api/sea`, `/api/playback`, and `/api/evidence` returned PostgreSQL-backed data.
- `/api/demo/full-scenario` was exercised end-to-end and produced a resolved incident (`QT-0047`) with no active rescue assignment remaining.
- Browser smoke test rendered `/overview`, `/live`, `/incidents`, `/search`, `/playback`, `/evidence`, `/sea`, and `/rescue` from `http://localhost:5174` with no client console errors.

Note: `npm install` reported three high-severity audit findings in the dependency tree. I did not run `npm audit fix --force` because it may introduce breaking dependency changes during the MVP build.
