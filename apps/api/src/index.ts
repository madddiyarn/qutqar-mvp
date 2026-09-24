import "./lib/env";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { AssignmentStatus, CandidateStatus, ConnectionMethod, ConnectionStatus, IncidentStatus, IncidentType, PatrolStatus, Prisma, RescuerStatus } from "@prisma/client";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";
import { DemoScenario } from "./simulation/demoScenario";
import { analyzeIncident, createEvidencePackage, queuePrintJob } from "./providers/dispatcher";
import { buildSeaForecast, getCurrentEnvironmentalSnapshot } from "./providers/environment";
import { createDriftPrediction } from "./providers/drift";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});
const demo = new DemoScenario(prisma, io);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

const asyncRoute =
  (handler: express.RequestHandler): express.RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

function routeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function getOverview() {
  const [drones, incidents, zones, rescuers, patrols, missions, detections, events, telemetry, activeConnection, sea, driftPredictions, sightings] = await Promise.all([
    prisma.drone.findMany({ orderBy: { name: "asc" } }),
    prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      include: { drone: true, patrol: true, events: { orderBy: { createdAt: "asc" } }, assignments: { include: { rescuer: true } } }
    }),
    prisma.zone.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.rescuer.findMany({ orderBy: { callSign: "asc" } }),
    prisma.patrol.findMany({ orderBy: { createdAt: "desc" }, include: { drone: true, detections: true, incidents: true } }),
    prisma.searchMission.findMany({ orderBy: { createdAt: "desc" }, include: { candidates: true, sightings: { orderBy: { timestamp: "asc" } }, driftPredictions: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    prisma.detection.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.incidentEvent.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { incident: true } }),
    prisma.droneTelemetry.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { drone: true } }),
    prisma.droneConnection.findFirst({ where: { status: "CONNECTED" }, orderBy: { connectedAt: "desc" }, include: { drone: true } }),
    getCurrentEnvironmentalSnapshot(prisma),
    prisma.driftPrediction.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.targetSighting.findMany({ orderBy: { timestamp: "asc" }, take: 12 })
  ]);

  return {
    drones,
    incidents,
    zones,
    rescuers,
    patrols,
    missions,
    detections,
    events,
    telemetry,
    activeConnection,
    sea,
    seaForecast: buildSeaForecast(sea),
    driftPredictions,
    sightings,
    stats: {
      activeDrones: drones.filter((drone) => drone.status === "ONLINE").length,
      activeIncidents: incidents.filter((incident) => !["RESOLVED", "FALSE_ALARM"].includes(incident.status)).length,
      availableRescuers: rescuers.filter((rescuer) => rescuer.status === "AVAILABLE").length,
      patrolsToday: patrols.length
    }
  };
}

type RescueAction = "ACCEPT" | "ARRIVED" | "RESCUED";

async function applyRescueAction(assignmentId: string, action: RescueAction) {
  const assignment = await prisma.rescueAssignment.findUniqueOrThrow({ where: { id: assignmentId }, include: { incident: true, rescuer: true } });
  const now = new Date();
  const status = action === "ACCEPT" ? AssignmentStatus.ACCEPTED : action === "ARRIVED" ? AssignmentStatus.ARRIVED : AssignmentStatus.COMPLETED;
  const incidentStatus = action === "ACCEPT" ? IncidentStatus.RESCUER_ACCEPTED : action === "ARRIVED" ? IncidentStatus.ARRIVED : IncidentStatus.RESOLVED;
  await prisma.rescueAssignment.update({
    where: { id: assignment.id },
    data: {
      status,
      acceptedAt: action === "ACCEPT" ? now : assignment.acceptedAt,
      arrivedAt: action === "ARRIVED" ? now : assignment.arrivedAt,
      completedAt: action === "RESCUED" ? now : assignment.completedAt
    },
    include: { incident: true, rescuer: true }
  });
  await prisma.incident.update({ where: { id: assignment.incidentId }, data: { status: incidentStatus, resolvedAt: action === "RESCUED" ? now : undefined } });
  await prisma.incidentEvent.create({
    data: {
      incidentId: assignment.incidentId,
      type: "RESCUE",
      message: action === "ACCEPT" ? "18:43:02 Спасатель принял вызов" : action === "ARRIVED" ? "18:47:10 Спасатель прибыл к координатам" : "18:49:26 Пострадавший спасен, инцидент закрыт"
    }
  });
  if (action === "RESCUED") {
    await prisma.rescuer.update({ where: { id: assignment.rescuerId }, data: { status: RescuerStatus.AVAILABLE } });
  }
  const updated = await prisma.rescueAssignment.findUniqueOrThrow({
    where: { id: assignment.id },
    include: { incident: true, rescuer: true }
  });
  const realtimeEvent = action === "ACCEPT" ? "rescue.accepted" : action === "ARRIVED" ? "rescue.arrived" : "rescue.completed";
  io.emit("rescue:update", updated);
  io.emit(realtimeEvent, updated);
  if (action === "RESCUED") io.emit("incident.resolved", updated.incident);
  io.emit("dashboard:update");
  return updated;
}

app.get("/api/health", asyncRoute(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, database: "connected", mocked: ["DJI", "telemetry", "GPS", "AI inference", "live stream"] });
}));

app.get("/api/connections/active", asyncRoute(async (_req, res) => {
  const active = await prisma.droneConnection.findFirst({
    where: { status: ConnectionStatus.CONNECTED },
    orderBy: { connectedAt: "desc" },
    include: { drone: true }
  });
  res.json(active);
}));

app.post("/api/connections/connect", asyncRoute(async (req, res) => {
  const input = z.object({
    model: z.string().min(2),
    method: z.nativeEnum(ConnectionMethod),
    serialNumber: z.string().min(1).optional()
  }).parse(req.body);

  const serialNumber = input.serialNumber?.trim() || `DEMO-${input.model.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
  await prisma.droneConnection.updateMany({
    where: { status: ConnectionStatus.CONNECTED },
    data: { status: ConnectionStatus.DISCONNECTED, disconnectedAt: new Date() }
  });
  const count = await prisma.drone.count();
  const drone = await prisma.drone.upsert({
    where: { serialNumber },
    update: {
      model: input.model,
      status: "ONLINE",
      battery: 87,
      gpsStatus: "READY",
      cameraStatus: "ONLINE",
      latitude: 43.6509,
      longitude: 51.1406,
      altitude: 82,
      lastSeenAt: new Date()
    },
    create: {
      serialNumber,
      name: count === 0 ? "QUTQAR-01" : `QUTQAR-${String(count + 1).padStart(2, "0")}`,
      model: input.model,
      status: "ONLINE",
      battery: 87,
      gpsStatus: "READY",
      cameraStatus: "ONLINE",
      latitude: 43.6509,
      longitude: 51.1406,
      altitude: 82,
      station: "Спасательная станция 7А",
      mission: "Операционная сессия"
    }
  });
  const connection = await prisma.droneConnection.create({
    data: {
      droneId: drone.id,
      method: input.method,
      status: ConnectionStatus.CONNECTED,
      isMock: true,
      selectedModel: input.model,
      serialNumber,
      metadata: {
        label: "DEMO CONNECTION",
        flow: input.method === ConnectionMethod.DJI_APP ? ["Поиск устройства", "Устройство найдено", "Установка соединения", "Получение телеметрии", "Синхронизация камеры", "Подключено"] : []
      }
    },
    include: { drone: true }
  });
  io.emit("drone.connected", connection);
  io.emit("dashboard:update");
  res.json(connection);
}));

app.post("/api/connections/disconnect", asyncRoute(async (_req, res) => {
  const result = await prisma.droneConnection.updateMany({
    where: { status: ConnectionStatus.CONNECTED },
    data: { status: ConnectionStatus.DISCONNECTED, disconnectedAt: new Date() }
  });
  io.emit("drone.disconnected", result);
  io.emit("dashboard:update");
  res.json({ ok: true, disconnected: result.count });
}));

app.get("/api/overview", asyncRoute(async (_req, res) => {
  res.json(await getOverview());
}));

app.get("/api/incidents", asyncRoute(async (_req, res) => {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    include: { drone: true, events: { orderBy: { createdAt: "asc" } }, assignments: { include: { rescuer: true } } }
  });
  res.json(incidents);
}));

app.get("/api/incidents/:id", asyncRoute(async (req, res) => {
  const incident = await prisma.incident.findUniqueOrThrow({
    where: { id: routeParam(req.params.id) },
    include: { drone: true, events: { orderBy: { createdAt: "asc" } }, assignments: { include: { rescuer: true } } }
  });
  res.json(incident);
}));

app.post("/api/incidents/:id/dispatch", asyncRoute(async (req, res) => {
  res.json(await demo.dispatchRescuer(routeParam(req.params.id)));
}));

app.post("/api/incidents/:id/status", asyncRoute(async (req, res) => {
  const input = z.object({ status: z.nativeEnum(IncidentStatus), message: z.string().optional() }).parse(req.body);
  const data = {
    status: input.status,
    confirmedAt: input.status === IncidentStatus.CONFIRMED ? new Date() : undefined,
    resolvedAt: ([IncidentStatus.RESOLVED, IncidentStatus.FALSE_ALARM] as IncidentStatus[]).includes(input.status) ? new Date() : undefined
  };
  const incident = await prisma.incident.update({ where: { id: routeParam(req.params.id) }, data });
  await prisma.incidentEvent.create({
    data: { incidentId: incident.id, type: "STATUS", message: input.message ?? `Статус изменен на ${input.status}` }
  });
  io.emit("incident:updated", incident);
  io.emit("dashboard:update");
  res.json(incident);
}));

app.post("/api/drones/connect", asyncRoute(async (req, res) => {
  const input = z.object({
    serialNumber: z.string().min(1),
    name: z.string().min(2).optional(),
    station: z.string().min(2).optional(),
    model: z.string().optional()
  }).parse(req.body);

  const allowed: Record<string, { model: string; battery: number }> = {
    "AVATA2-DEMO-001": { model: "DJI Avata 2", battery: 87 },
    "M3E-DEMO-002": { model: "DJI Mavic 3 Enterprise", battery: 42 },
    "M30-DEMO-003": { model: "DJI Matrice 30", battery: 12 }
  };
  const profile = allowed[input.serialNumber] ?? { model: input.model ?? "Other / Demo Drone", battery: 87 };

  const drone = await prisma.drone.upsert({
    where: { serialNumber: input.serialNumber },
    update: {
      name: input.name ?? "QUTQAR-01",
      model: profile.model,
      station: input.station ?? "Спасательная станция 7А",
      status: "ONLINE",
      battery: profile.battery,
      gpsStatus: "READY",
      cameraStatus: "ONLINE",
      latitude: 43.6509,
      longitude: 51.1406,
      altitude: 82,
      lastSeenAt: new Date()
    },
    create: {
      serialNumber: input.serialNumber,
      name: input.name ?? "QUTQAR-01",
      model: profile.model,
      station: input.station ?? "Спасательная станция 7А",
      status: "ONLINE",
      battery: profile.battery,
      gpsStatus: "READY",
      cameraStatus: "ONLINE",
      latitude: 43.6509,
      longitude: 51.1406,
      altitude: 82
    }
  });
  io.emit("drone:connected", drone);
  res.json(drone);
}));

app.get("/api/sea", asyncRoute(async (_req, res) => {
  const snapshot = await getCurrentEnvironmentalSnapshot(prisma);
  res.json({ snapshot, forecast: buildSeaForecast(snapshot), source: "MockMarineProvider" });
}));

app.post("/api/drift", asyncRoute(async (req, res) => {
  const input = z.object({
    incidentId: z.string().optional(),
    searchMissionId: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    elapsedMinutes: z.number().min(0).max(240)
  }).parse(req.body);
  const snapshot = await getCurrentEnvironmentalSnapshot(prisma);
  const prediction = await createDriftPrediction(prisma, { ...input, snapshot });
  io.emit("drift.created", prediction);
  res.json(prediction);
}));

app.get("/api/playback", asyncRoute(async (_req, res) => {
  const recordings = await prisma.recording.findMany({
    orderBy: { startedAt: "desc" },
    include: { drone: true, events: { orderBy: { offsetSec: "asc" } }, changes: true }
  });
  res.json(recordings);
}));

app.get("/api/evidence", asyncRoute(async (_req, res) => {
  const evidence = await prisma.evidence.findMany({
    orderBy: { createdAt: "desc" },
    include: { incident: { include: { drone: true, events: { orderBy: { createdAt: "asc" } }, assignments: { include: { rescuer: true } } } }, assets: true }
  });
  res.json(evidence);
}));

app.post("/api/evidence/:incidentId", asyncRoute(async (req, res) => {
  const evidence = await createEvidencePackage(prisma, routeParam(req.params.incidentId));
  io.emit("evidence.created", evidence);
  res.json(evidence);
}));

app.post("/api/dispatcher/analyze-text", asyncRoute(async (req, res) => {
  const input = z.object({ text: z.string().min(4) }).parse(req.body);
  const lower = input.text.toLowerCase();
  const hasBackpack = lower.includes("рюкзак");
  const hasRed = lower.includes("красн");
  const timeMatch = input.text.match(/(\d{1,2}[:.]\d{2})/);
  res.json({
    source: "MockAIProvider",
    type: lower.includes("пропал") ? "Missing person" : "Operator report",
    approximateTime: timeMatch?.[1]?.replace(".", ":") ?? "не указано",
    location: lower.includes("скал") ? "Скальная зона Актау" : "требует выбора оператором",
    object: "Person",
    distinctiveItems: [hasRed ? "Красная одежда" : null, hasBackpack ? "Рюкзак" : null].filter(Boolean),
    suggestedResponse: "SEARCH & RESCUE",
    requiresConfirmation: true
  });
}));

app.get("/api/drones", asyncRoute(async (_req, res) => {
  const drones = await prisma.drone.findMany({
    orderBy: { name: "asc" },
    include: { telemetry: { orderBy: { createdAt: "desc" }, take: 24 }, incidents: { orderBy: { createdAt: "desc" }, take: 5 } }
  });
  res.json(drones);
}));

app.post("/api/patrols", asyncRoute(async (req, res) => {
  const input = z.object({
    droneId: z.string(),
    area: z.string().min(2),
    missionType: z.string().min(2),
    modules: z.array(z.string()).min(1)
  }).parse(req.body);
  const count = await prisma.patrol.count();
  const patrol = await prisma.patrol.create({
    data: {
      publicId: `PT-2409-${String(count + 2).padStart(2, "0")}`,
      droneId: input.droneId,
      area: input.area,
      missionType: input.missionType,
      modules: input.modules,
      status: PatrolStatus.ACTIVE,
      route: [[43.676, 51.125], [43.646, 51.149], [43.622, 51.157]],
      startedAt: new Date()
    }
  });
  io.emit("patrol:created", patrol);
  res.json(patrol);
}));

app.get("/api/analytics", asyncRoute(async (_req, res) => {
  const [incidents, detections, patrols] = await Promise.all([
    prisma.incident.findMany(),
    prisma.detection.findMany(),
    prisma.patrol.findMany()
  ]);
  const byType = Object.values(IncidentType).map((type) => ({ type, count: incidents.filter((incident) => incident.type === type).length }));
  const byStatus = Object.values(IncidentStatus).map((status) => ({ status, count: incidents.filter((incident) => incident.status === status).length }));
  const byDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return { day: key.slice(5), count: incidents.filter((incident) => incident.createdAt.toISOString().slice(0, 10) === key).length };
  });
  const confirmed = detections.filter((detection) => detection.feedback === "confirmed").length;
  const falseAlarms = detections.filter((detection) => detection.feedback === "false_alarm").length;
  res.json({
    totals: {
      patrols: patrols.length,
      detections: detections.length,
      confirmedIncidents: incidents.filter((incident) => incident.status !== "FALSE_ALARM").length,
      resolvedIncidents: incidents.filter((incident) => incident.status === "RESOLVED").length,
      averageResponseMin: 7
    },
    byType,
    byStatus,
    byDay,
    confidence: detections.map((detection) => ({ confidence: detection.confidence })),
    feedback: { total: detections.length, confirmed, falseAlarms }
  });
}));

app.post("/api/search-missions", asyncRoute(async (req, res) => {
  const input = z.object({
    centerLatitude: z.number(),
    centerLongitude: z.number(),
    radius: z.number().min(100).max(5000),
    approximateTime: z.string(),
    description: z.string().min(3),
    distinctiveItems: z.array(z.string()).default([]),
    visualReferenceUrl: z.string().optional()
  }).parse(req.body);
  const count = await prisma.searchMission.count();
  const mission = await prisma.searchMission.create({
    data: {
      publicId: `SR-${1025 + count}`,
      status: "ACTIVE",
      centerLatitude: input.centerLatitude,
      centerLongitude: input.centerLongitude,
      radius: input.radius,
      approximateTime: new Date(input.approximateTime),
      description: input.description,
      distinctiveItems: input.distinctiveItems,
      startedAt: new Date()
    }
  });
  await prisma.targetSighting.createMany({
    data: [
      {
        searchMissionId: mission.id,
        sourceType: "Operator report",
        latitude: input.centerLatitude,
        longitude: input.centerLongitude,
        timestamp: new Date(input.approximateTime),
        confidence: 68,
        metadata: { label: "LAST KNOWN POSITION", visualReferenceUrl: input.visualReferenceUrl ?? null }
      }
    ]
  });
  io.emit("search:created", mission);
  res.json(mission);
}));

app.post("/api/search-missions/:id/generate-candidate", asyncRoute(async (req, res) => {
  const mission = await prisma.searchMission.findUniqueOrThrow({ where: { id: routeParam(req.params.id) } });
  const candidateNumber = (await prisma.searchCandidate.count({ where: { searchMissionId: mission.id } })) + 1;
  const candidate = await prisma.searchCandidate.create({
    data: {
      searchMissionId: mission.id,
      confidence: 82,
      visualSimilarity: 82,
      latitude: mission.centerLatitude + 0.0018,
      longitude: mission.centerLongitude - 0.0012,
      imageUrl: `/demo/possible-match-${candidateNumber}.jpg`,
      matchedItems: ["Красная куртка", "Черный рюкзак"],
      status: CandidateStatus.NEW
    }
  });
  await prisma.targetSighting.create({
    data: {
      searchMissionId: mission.id,
      sourceType: "Search detection",
      sourceId: candidate.id,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      timestamp: candidate.detectedAt,
      confidence: candidate.confidence,
      metadata: { label: `POSSIBLE MATCH #${String(candidateNumber).padStart(2, "0")}` }
    }
  });
  io.emit("search.candidate", candidate);
  res.json(candidate);
}));

app.post("/api/search-missions/:id/candidates", asyncRoute(async (req, res) => {
  const input = z.object({ status: z.nativeEnum(CandidateStatus) }).parse(req.body);
  const candidate = await prisma.searchCandidate.update({ where: { id: routeParam(req.params.id) }, data: { status: input.status } });
  res.json(candidate);
}));

app.post("/api/demo/start", asyncRoute(async (_req, res) => {
  res.json(await demo.run());
}));

app.post("/api/demo/confirm", asyncRoute(async (req, res) => {
  const input = z.object({ detectionId: z.string().optional() }).parse(req.body ?? {});
  res.json(await demo.confirmDetection(input.detectionId));
}));

app.post("/api/demo/false-alarm", asyncRoute(async (req, res) => {
  const input = z.object({ detectionId: z.string() }).parse(req.body);
  res.json(await demo.markFalseAlarm(input.detectionId));
}));

app.post("/api/demo/reset", asyncRoute(async (_req, res) => {
  await prisma.offlineSyncEvent.deleteMany();
  await prisma.driftPrediction.deleteMany();
  await prisma.environmentalSnapshot.deleteMany();
  await prisma.printJob.deleteMany();
  await prisma.evidenceAsset.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.changeDetection.deleteMany();
  await prisma.recordingEvent.deleteMany();
  await prisma.recording.deleteMany();
  await prisma.targetSighting.deleteMany();
  await prisma.droneConnection.deleteMany();
  await prisma.responseService.deleteMany();
  await prisma.rescueAssignment.deleteMany();
  await prisma.incidentEvent.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.searchCandidate.deleteMany();
  await prisma.searchMission.deleteMany();
  await prisma.detection.deleteMany();
  await prisma.droneTelemetry.deleteMany();
  await prisma.patrol.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.rescuer.deleteMany();
  await prisma.drone.deleteMany();
  await prisma.user.deleteMany();
  const { seed } = await import("../../../prisma/seed");
  await seed();
  io.emit("demo:reset");
  io.emit("dashboard:update");
  res.json({ ok: true });
}));

app.post("/api/demo/full-scenario", asyncRoute(async (_req, res) => {
  const start = await demo.run();
  const incident = await demo.confirmDetection(start.detectionId);
  const assignment = await demo.dispatchRescuer(incident.id);
  const accepted = await applyRescueAction(assignment.id, "ACCEPT");
  const arrived = await applyRescueAction(assignment.id, "ARRIVED");
  const completed = await applyRescueAction(assignment.id, "RESCUED");
  res.json({ start, incident, assignment, accepted, arrived, completed });
}));

app.post("/api/demo/search-scenario", asyncRoute(async (_req, res) => {
  const count = await prisma.searchMission.count();
  const mission = await prisma.searchMission.create({
    data: {
      publicId: `SR-${1100 + count}`,
      status: "ACTIVE",
      approximateTime: new Date(Date.now() - 75 * 60 * 1000),
      description: "Демо-поиск: мужчина возле скал, красная куртка, черный рюкзак.",
      distinctiveItems: ["Красная куртка", "Черный рюкзак"],
      centerLatitude: 43.6218,
      centerLongitude: 51.1567,
      radius: 650,
      areaChecked: 62,
      startedAt: new Date()
    }
  });
  const candidate = await prisma.searchCandidate.create({
    data: {
      searchMissionId: mission.id,
      confidence: 86,
      visualSimilarity: 82,
      latitude: 43.6231,
      longitude: 51.1554,
      imageUrl: "/demo/possible-match-03.jpg",
      matchedItems: ["Красная куртка", "Черный рюкзак"],
      status: "POSSIBLE_TARGET"
    }
  });
  await prisma.targetSighting.createMany({
    data: [
      { searchMissionId: mission.id, sourceType: "Camera", sourceId: "CAM-04", latitude: 43.629, longitude: 51.151, timestamp: new Date(Date.now() - 70 * 60 * 1000), confidence: 74, metadata: { label: "18:21 Camera 04" } },
      { searchMissionId: mission.id, sourceType: "Drone", sourceId: "QUTQAR-01", latitude: 43.624, longitude: 51.155, timestamp: new Date(Date.now() - 61 * 60 * 1000), confidence: 84, metadata: { label: "18:27 Drone QUTQAR-01" } },
      { searchMissionId: mission.id, sourceType: "Search detection", sourceId: candidate.id, latitude: candidate.latitude, longitude: candidate.longitude, timestamp: candidate.detectedAt, confidence: 86, metadata: { label: "POSSIBLE MATCH #03" } }
    ]
  });
  io.emit("search.created", mission);
  io.emit("search.candidate", candidate);
  io.emit("dashboard:update");
  res.json({ mission, candidate });
}));

app.get("/api/offline/events", asyncRoute(async (_req, res) => {
  const events = await prisma.offlineSyncEvent.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  res.json(events);
}));

app.post("/api/offline/events", asyncRoute(async (req, res) => {
  const input = z.object({
    idempotencyKey: z.string().min(4),
    type: z.string().min(2),
    payload: z.record(z.string(), z.unknown()).default({})
  }).parse(req.body);
  const payload = input.payload as Prisma.InputJsonObject;
  const event = await prisma.offlineSyncEvent.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: { payload },
    create: { idempotencyKey: input.idempotencyKey, type: input.type, payload }
  });
  io.emit("offline.started", event);
  res.json(event);
}));

app.post("/api/offline/sync", asyncRoute(async (_req, res) => {
  await prisma.offlineSyncEvent.updateMany({ where: { status: "QUEUED" }, data: { status: "SYNCING" } });
  io.emit("offline.syncing");
  const result = await prisma.offlineSyncEvent.updateMany({ where: { status: "SYNCING" }, data: { status: "SYNCED", syncedAt: new Date() } });
  io.emit("offline.synced", result);
  res.json({ ok: true, synced: result.count });
}));

app.get("/api/rescue/current", asyncRoute(async (_req, res) => {
  const assignment = await prisma.rescueAssignment.findFirst({
    where: { status: { in: [AssignmentStatus.SENT, AssignmentStatus.ACCEPTED, AssignmentStatus.ARRIVED] } },
    orderBy: { createdAt: "desc" },
    include: { incident: true, rescuer: true }
  });
  res.json(assignment);
}));

app.post("/api/rescue/:assignmentId/action", asyncRoute(async (req, res) => {
  const input = z.object({ action: z.enum(["ACCEPT", "ARRIVED", "RESCUED"]) }).parse(req.body);
  res.json(await applyRescueAction(routeParam(req.params.assignmentId), input.action));
}));

io.on("connection", (socket) => {
  socket.emit("system:ready", { ok: true });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Неизвестная ошибка";
  res.status(500).json({ message });
});

if (process.env.VERCEL !== "1") {
  httpServer.listen(env.port, () => {
    console.log(`QUTQAR API listening on http://localhost:${env.port}`);
  });
}

export default app;
export { app, httpServer, io };
