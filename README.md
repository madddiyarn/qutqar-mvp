# Boltzzmann MVP

Boltzzmann is a working hackathon MVP for an AI-assisted coastal safety and drone operations command center in Aktau, Kazakhstan.

This is an operational web application, not a landing page.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, lucide-react, Recharts
- Backend: Node.js, TypeScript, Express, Socket.IO
- Database: PostgreSQL on Neon, Prisma ORM
- Maps: Leaflet with OpenStreetMap tiles

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
in the dependency tree. I did not run `npm audit fix --force` because it may introduce breaking dependency changes during the MVP build.
