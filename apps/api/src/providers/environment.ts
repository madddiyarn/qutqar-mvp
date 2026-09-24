import { DataSourceKind, type PrismaClient } from "@prisma/client";

export async function getCurrentEnvironmentalSnapshot(prisma: PrismaClient) {
  const existing = await prisma.environmentalSnapshot.findFirst({ orderBy: { validAt: "desc" } });
  if (existing) return existing;

  return prisma.environmentalSnapshot.create({
    data: {
      sourceKind: DataSourceKind.SIMULATED,
      windSpeed: 8.4,
      windDirection: 286,
      temperature: 24.2,
      visibility: 9.5,
      precipitation: 0,
      weatherStatus: "Ясно, simulated",
      waveHeight: 1.2,
      wavePeriod: 5.8,
      waveDirection: 301,
      currentSpeed: 0.34,
      currentDirection: 312,
      droneCondition: "NORMAL",
      rescueCondition: "ELEVATED",
      explanation: "SIMULATED: демо-порог. Ветер и волна умеренные, спасательные операции требуют повышенного внимания.",
      validAt: new Date()
    }
  });
}

export function buildSeaForecast(base: Awaited<ReturnType<typeof getCurrentEnvironmentalSnapshot>>) {
  return [
    { label: "NOW", windSpeed: base.windSpeed, waveHeight: base.waveHeight, sourceKind: base.sourceKind },
    { label: "+1H", windSpeed: +(base.windSpeed + 0.6).toFixed(1), waveHeight: +(base.waveHeight + 0.1).toFixed(1), sourceKind: DataSourceKind.SIMULATED },
    { label: "+3H", windSpeed: +(base.windSpeed + 1.4).toFixed(1), waveHeight: +(base.waveHeight + 0.3).toFixed(1), sourceKind: DataSourceKind.SIMULATED },
    { label: "+6H", windSpeed: +(base.windSpeed + 0.9).toFixed(1), waveHeight: +(base.waveHeight + 0.2).toFixed(1), sourceKind: DataSourceKind.SIMULATED }
  ];
}
