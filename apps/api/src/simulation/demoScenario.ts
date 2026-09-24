import type { Server } from "socket.io";
import { AssignmentStatus, IncidentStatus, IncidentType, PrismaClient, RescuerStatus, Severity } from "@prisma/client";
import { createEvidencePackage, queuePrintJob, analyzeIncident } from "../providers/dispatcher";
import { getCurrentEnvironmentalSnapshot } from "../providers/environment";
import { createDriftPrediction } from "../providers/drift";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DemoScenario {
  private running = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly io: Server
  ) {}

  isRunning() {
    return this.running;
  }

  async run() {
    if (this.running) return { status: "already-running" };
    this.running = true;

    try {
      const drone = await this.prisma.drone.findUniqueOrThrow({ where: { serialNumber: "AVATA2-DEMO-001" } });
      const patrol = await this.prisma.patrol.findFirst({ where: { droneId: drone.id }, orderBy: { createdAt: "desc" } });
      this.io.emit("demo:event", { step: 1, label: "Патруль запущен", confidence: 42 });
      await sleep(900);

      await this.prisma.drone.update({
        where: { id: drone.id },
        data: { battery: 84, latitude: 43.6468, longitude: 51.149, altitude: 79, mission: "Патруль пляжа 7А", lastSeenAt: new Date() }
      });
      this.io.emit("telemetry:update", { droneId: drone.id });
      this.io.emit("demo:event", { step: 2, label: "Live видео активно", confidence: 58 });
      await sleep(900);

      const detection = await this.prisma.detection.create({
        data: {
          type: "POTENTIAL_DROWNING",
          confidence: 91,
          latitude: 43.6466,
          longitude: 51.1492,
          droneId: drone.id,
          patrolId: patrol?.id,
          metadata: { box: [42, 31, 18, 26], label: "PERSON #07", source: "mock-ai", deterministic: true }
        }
      });
      this.io.emit("demo:event", { step: 3, label: "Человек обнаружен", confidence: 76, detectionId: detection.id });
      await sleep(900);
      this.io.emit("demo:event", { step: 4, label: "Вероятность утопления растет", confidence: 91, detectionId: detection.id });
      await sleep(900);
      this.io.emit("demo:alert", { detectionId: detection.id, title: "POTENTIAL DROWNING DETECTED", confidence: 91 });
      return { status: "alert-ready", detectionId: detection.id };
    } finally {
      this.running = false;
    }
  }

  async confirmDetection(detectionId?: string) {
    const drone = await this.prisma.drone.findUniqueOrThrow({ where: { serialNumber: "AVATA2-DEMO-001" } });
    const patrol = await this.prisma.patrol.findFirst({ where: { droneId: drone.id }, orderBy: { createdAt: "desc" } });
    const count = await this.prisma.incident.count();
    const publicId = `QT-${String(42 + count).padStart(4, "0")}`;

    const incident = await this.prisma.incident.create({
      data: {
        publicId,
        type: IncidentType.POTENTIAL_DROWNING,
        status: IncidentStatus.CONFIRMED,
        severity: Severity.CRITICAL,
        confidence: 93,
        latitude: 43.6466,
        longitude: 51.1492,
        droneId: drone.id,
        patrolId: patrol?.id,
        detectedAt: new Date(),
        confirmedAt: new Date(),
        events: {
          create: [
            { type: "DETECTION", message: "18:42:31 Person detected" },
            { type: "AI_ALERT", message: "18:42:38 Potential drowning detected" },
            { type: "OPERATOR", message: "18:42:44 Оператор подтвердил инцидент" }
          ]
        }
      },
      include: { drone: true, events: true, assignments: { include: { rescuer: true } } }
    });

    if (detectionId) {
      await this.prisma.detection.update({ where: { id: detectionId }, data: { feedback: "confirmed" } }).catch(() => null);
    }

    const analysis = await analyzeIncident(this.prisma, incident);
    const evidence = await createEvidencePackage(this.prisma, incident.id);
    const snapshot = await getCurrentEnvironmentalSnapshot(this.prisma);
    const drift = await createDriftPrediction(this.prisma, {
      incidentId: incident.id,
      latitude: incident.latitude,
      longitude: incident.longitude,
      elapsedMinutes: 10,
      snapshot
    });

    this.io.emit("dispatcher.analysis", { incidentId: incident.id, analysis });
    this.io.emit("evidence.created", evidence);
    this.io.emit("drift.created", drift);
    this.io.emit("incident:created", incident);
    this.io.emit("incident.created", incident);
    this.io.emit("dashboard:update");
    return incident;
  }

  async markFalseAlarm(detectionId: string) {
    const detection = await this.prisma.detection.update({
      where: { id: detectionId },
      data: { feedback: "false_alarm" }
    });
    this.io.emit("detection:false-alarm", detection);
    return detection;
  }

  async dispatchRescuer(incidentId: string) {
    const incident = await this.prisma.incident.findUniqueOrThrow({ where: { id: incidentId } });
    const rescuer = await this.prisma.rescuer.findFirst({ where: { status: RescuerStatus.AVAILABLE }, orderBy: { callSign: "asc" } });
    if (!rescuer) throw new Error("Нет доступных спасателей");

    const assignment = await this.prisma.rescueAssignment.create({
      data: {
        incidentId: incident.id,
        rescuerId: rescuer.id,
        status: AssignmentStatus.SENT
      },
      include: { incident: true, rescuer: true }
    });
    await this.prisma.rescuer.update({ where: { id: rescuer.id }, data: { status: RescuerStatus.DISPATCHED } });
    await this.prisma.incident.update({ where: { id: incident.id }, data: { status: IncidentStatus.DISPATCHED } });
    await this.prisma.incidentEvent.create({
      data: { incidentId: incident.id, type: "DISPATCH", message: `18:42:50 Спасатель ${rescuer.callSign} направлен к цели` }
    });
    const printJob = await queuePrintJob(this.prisma, incident.id);
    this.io.emit("print.queued", { incidentId: incident.id, status: "QUEUED" });
    this.io.emit("print.printing", { incidentId: incident.id, status: "PRINTING" });
    this.io.emit("print.printed", printJob);
    this.io.emit("rescue:dispatch", assignment);
    this.io.emit("incident.dispatched", assignment);
    this.io.emit("dashboard:update");
    return assignment;
  }
}
