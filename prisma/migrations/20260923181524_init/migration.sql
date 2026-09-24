-- CreateEnum
CREATE TYPE "DroneStatus" AS ENUM ('ONLINE', 'CHARGING', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('POTENTIAL_DROWNING', 'SAFE_ZONE_VIOLATION', 'RESTRICTED_ZONE', 'PERSON_OVERBOARD', 'CHILD_RISK', 'FISHERMAN_SAFETY', 'SEARCH_TARGET');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('NEW', 'CONFIRMED', 'DISPATCHED', 'RESCUER_ACCEPTED', 'ARRIVED', 'RESOLVED', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PatrolStatus" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SearchStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'POSSIBLE_TARGET', 'REJECTED');

-- CreateEnum
CREATE TYPE "RescuerStatus" AS ENUM ('AVAILABLE', 'DISPATCHED', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('SENT', 'ACCEPTED', 'ARRIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('SAFE', 'RESTRICTED', 'SEARCH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drone" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "DroneStatus" NOT NULL DEFAULT 'OFFLINE',
    "battery" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "station" TEXT,
    "gpsStatus" TEXT NOT NULL DEFAULT 'READY',
    "cameraStatus" TEXT NOT NULL DEFAULT 'ONLINE',
    "mission" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Drone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DroneTelemetry" (
    "id" TEXT NOT NULL,
    "droneId" TEXT NOT NULL,
    "battery" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "heading" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DroneTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'NEW',
    "severity" "Severity" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "droneId" TEXT,
    "patrolId" TEXT,
    "searchMissionId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patrol" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "droneId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "missionType" TEXT NOT NULL,
    "modules" JSONB NOT NULL,
    "status" "PatrolStatus" NOT NULL DEFAULT 'PLANNED',
    "route" JSONB NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patrol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchMission" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "status" "SearchStatus" NOT NULL DEFAULT 'ACTIVE',
    "approximateTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "distinctiveItems" JSONB NOT NULL,
    "centerLatitude" DOUBLE PRECISION NOT NULL,
    "centerLongitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL,
    "areaChecked" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SearchMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchCandidate" (
    "id" TEXT NOT NULL,
    "searchMissionId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "matchedItems" JSONB NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detection" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL,
    "feedback" TEXT,
    "droneId" TEXT,
    "patrolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Detection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ZoneType" NOT NULL,
    "polygon" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rescuer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "callSign" TEXT NOT NULL,
    "status" "RescuerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Rescuer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RescueAssignment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "rescuerId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'SENT',
    "acceptedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RescueAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Drone_serialNumber_key" ON "Drone"("serialNumber");

-- CreateIndex
CREATE INDEX "DroneTelemetry_droneId_createdAt_idx" ON "DroneTelemetry"("droneId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_publicId_key" ON "Incident"("publicId");

-- CreateIndex
CREATE INDEX "Incident_status_type_createdAt_idx" ON "Incident"("status", "type", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentEvent_incidentId_createdAt_idx" ON "IncidentEvent"("incidentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Patrol_publicId_key" ON "Patrol"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchMission_publicId_key" ON "SearchMission"("publicId");

-- AddForeignKey
ALTER TABLE "DroneTelemetry" ADD CONSTRAINT "DroneTelemetry_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_searchMissionId_fkey" FOREIGN KEY ("searchMissionId") REFERENCES "SearchMission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patrol" ADD CONSTRAINT "Patrol_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchCandidate" ADD CONSTRAINT "SearchCandidate_searchMissionId_fkey" FOREIGN KEY ("searchMissionId") REFERENCES "SearchMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescueAssignment" ADD CONSTRAINT "RescueAssignment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RescueAssignment" ADD CONSTRAINT "RescueAssignment_rescuerId_fkey" FOREIGN KEY ("rescuerId") REFERENCES "Rescuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
