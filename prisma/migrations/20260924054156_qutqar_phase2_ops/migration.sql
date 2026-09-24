-- CreateEnum
CREATE TYPE "ConnectionMethod" AS ENUM ('QR', 'DJI_APP', 'SERIAL');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTING', 'CONNECTED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('QUEUED', 'PRINTING', 'PRINTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ResponseServiceType" AS ENUM ('WATER_RESCUE', 'SEARCH_RESCUE', 'FIRE_SERVICE', 'ECO_SERVICE', 'TECHNICAL_SERVICE');

-- CreateEnum
CREATE TYPE "ResponseServiceStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DataSourceKind" AS ENUM ('LIVE', 'CACHED', 'SIMULATED', 'MOCK');

-- CreateEnum
CREATE TYPE "OfflineSyncStatus" AS ENUM ('QUEUED', 'SYNCING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "SearchCandidate" ADD COLUMN     "visualSimilarity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DroneConnection" (
    "id" TEXT NOT NULL,
    "droneId" TEXT NOT NULL,
    "method" "ConnectionMethod" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "isMock" BOOLEAN NOT NULL DEFAULT true,
    "selectedModel" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DroneConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetSighting" (
    "id" TEXT NOT NULL,
    "searchMissionId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "confidence" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "TargetSighting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "droneId" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingEvent" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "offsetSec" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "RecordingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeDetection" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "compareLabelA" TEXT NOT NULL,
    "compareLabelB" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "reportHtml" TEXT NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceAsset" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintJob" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "stationId" TEXT,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'QUEUED',
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResponseServiceType" NOT NULL,
    "status" "ResponseServiceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponseService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentalSnapshot" (
    "id" TEXT NOT NULL,
    "sourceKind" "DataSourceKind" NOT NULL DEFAULT 'SIMULATED',
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "windDirection" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "visibility" DOUBLE PRECISION NOT NULL,
    "precipitation" DOUBLE PRECISION NOT NULL,
    "weatherStatus" TEXT NOT NULL,
    "waveHeight" DOUBLE PRECISION NOT NULL,
    "wavePeriod" DOUBLE PRECISION NOT NULL,
    "waveDirection" INTEGER NOT NULL,
    "currentSpeed" DOUBLE PRECISION NOT NULL,
    "currentDirection" INTEGER NOT NULL,
    "droneCondition" TEXT NOT NULL,
    "rescueCondition" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "validAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvironmentalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriftPrediction" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "searchMissionId" TEXT,
    "environmentalSnapshotId" TEXT NOT NULL,
    "originLatitude" DOUBLE PRECISION NOT NULL,
    "originLongitude" DOUBLE PRECISION NOT NULL,
    "elapsedMinutes" INTEGER NOT NULL,
    "areas" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriftPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineSyncEvent" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "OfflineSyncStatus" NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "OfflineSyncEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DroneConnection_status_connectedAt_idx" ON "DroneConnection"("status", "connectedAt");

-- CreateIndex
CREATE INDEX "TargetSighting_searchMissionId_timestamp_idx" ON "TargetSighting"("searchMissionId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_publicId_key" ON "Recording"("publicId");

-- CreateIndex
CREATE INDEX "RecordingEvent_recordingId_offsetSec_idx" ON "RecordingEvent"("recordingId", "offsetSec");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_publicId_key" ON "Evidence"("publicId");

-- CreateIndex
CREATE INDEX "PrintJob_incidentId_status_idx" ON "PrintJob"("incidentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OfflineSyncEvent_idempotencyKey_key" ON "OfflineSyncEvent"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "DroneConnection" ADD CONSTRAINT "DroneConnection_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetSighting" ADD CONSTRAINT "TargetSighting_searchMissionId_fkey" FOREIGN KEY ("searchMissionId") REFERENCES "SearchMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_droneId_fkey" FOREIGN KEY ("droneId") REFERENCES "Drone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingEvent" ADD CONSTRAINT "RecordingEvent_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeDetection" ADD CONSTRAINT "ChangeDetection_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceAsset" ADD CONSTRAINT "EvidenceAsset_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriftPrediction" ADD CONSTRAINT "DriftPrediction_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriftPrediction" ADD CONSTRAINT "DriftPrediction_searchMissionId_fkey" FOREIGN KEY ("searchMissionId") REFERENCES "SearchMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriftPrediction" ADD CONSTRAINT "DriftPrediction_environmentalSnapshotId_fkey" FOREIGN KEY ("environmentalSnapshotId") REFERENCES "EnvironmentalSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
