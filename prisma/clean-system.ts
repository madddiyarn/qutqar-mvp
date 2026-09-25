import "./env";
import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { seedWith } from "./seed";

const prisma = new PrismaClient();

export async function cleanSystemData() {
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
  await seedWith(prisma);
}

export async function disconnectCleanSystem() {
  await prisma.$disconnect();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cleanSystemData()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await disconnectCleanSystem();
    });
}
