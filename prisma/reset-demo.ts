import "./env";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDemo() {
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
}

resetDemo()
  .then(async () => {
    await prisma.$disconnect();
    const { seed } = await import("./seed");
    await seed();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
