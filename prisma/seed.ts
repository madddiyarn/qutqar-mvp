import "./env";
import {
  ConnectionMethod,
  ConnectionStatus,
  DataSourceKind,
  PrismaClient,
  DroneStatus,
  IncidentStatus,
  IncidentType,
  PatrolStatus,
  PrintJobStatus,
  RescuerStatus,
  ResponseServiceStatus,
  ResponseServiceType,
  Severity,
  ZoneType
} from "@prisma/client";
import { pathToFileURL } from "node:url";

const prisma = new PrismaClient();

const aktau = {
  station: [43.6369, 51.1688],
  beach: [43.6509, 51.1406],
  rocks: [43.6218, 51.1567],
  port: [43.6019, 51.2281],
  coastNorth: [43.6742, 51.1262]
};

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function seed() {
  await prisma.user.upsert({
    where: { email: "operator@qutqar.kz" },
    update: {},
    create: { name: "Айдана Сарсенова", role: "Оператор смены", email: "operator@qutqar.kz" }
  });

  const drone1 = await prisma.drone.upsert({
    where: { serialNumber: "AVATA2-DEMO-001" },
    update: {
      name: "QUTQAR-01",
      status: DroneStatus.ONLINE,
      battery: 87,
      latitude: aktau.beach[0],
      longitude: aktau.beach[1],
      altitude: 82,
      station: "Спасательная станция 7А",
      mission: "Патруль набережной"
    },
    create: {
      serialNumber: "AVATA2-DEMO-001",
      name: "QUTQAR-01",
      model: "DJI Avata 2",
      status: DroneStatus.ONLINE,
      battery: 87,
      latitude: aktau.beach[0],
      longitude: aktau.beach[1],
      altitude: 82,
      station: "Спасательная станция 7А",
      mission: "Патруль набережной"
    }
  });

  await prisma.droneConnection.create({
    data: {
      droneId: drone1.id,
      method: ConnectionMethod.DJI_APP,
      status: ConnectionStatus.CONNECTED,
      isMock: true,
      selectedModel: "DJI Avata 2",
      serialNumber: "AVATA2-DEMO-001",
      metadata: {
        label: "DEMO CONNECTION",
        gps: "READY",
        camera: "ONLINE",
        telemetry: "ONLINE"
      }
    }
  });

  await prisma.drone.upsert({
    where: { serialNumber: "M3E-DEMO-002" },
    update: {},
    create: {
      serialNumber: "M3E-DEMO-002",
      name: "QUTQAR-02",
      model: "DJI Mavic 3 Enterprise",
      status: DroneStatus.CHARGING,
      battery: 42,
      latitude: aktau.station[0],
      longitude: aktau.station[1],
      altitude: 0,
      station: "Штаб набережной",
      mission: "Зарядка"
    }
  });

  await prisma.drone.upsert({
    where: { serialNumber: "M30-DEMO-003" },
    update: {},
    create: {
      serialNumber: "M30-DEMO-003",
      name: "QUTQAR-03",
      model: "DJI Matrice 30",
      status: DroneStatus.OFFLINE,
      battery: 12,
      latitude: aktau.port[0],
      longitude: aktau.port[1],
      altitude: 0,
      station: "Портовая группа",
      mission: "Технический осмотр"
    }
  });

  const patrol = await prisma.patrol.upsert({
    where: { publicId: "PT-2409-01" },
    update: {},
    create: {
      publicId: "PT-2409-01",
      droneId: drone1.id,
      area: "Набережная Актау - скальная зона",
      missionType: "Береговой мониторинг",
      modules: ["Утопление", "Заплыв за границу", "Дети", "Рыбаки"],
      status: PatrolStatus.ACTIVE,
      route: [
        [43.676, 51.125],
        [43.657, 51.139],
        [43.636, 51.151],
        [43.622, 51.157]
      ],
      progress: 38,
      startedAt: hoursAgo(1.2)
    }
  });

  const rescuers = [
    ["Арман Касымов", "RESCUE-1", RescuerStatus.AVAILABLE, 43.6422, 51.1501],
    ["Диана Тлеуберген", "RESCUE-2", RescuerStatus.AVAILABLE, 43.6351, 51.1614],
    ["Ерлан Омаров", "RESCUE-3", RescuerStatus.BUSY, 43.6032, 51.2204]
  ] as const;

  for (const rescuer of rescuers) {
    await prisma.rescuer.upsert({
      where: { callSign: rescuer[1] },
      update: { status: rescuer[2], latitude: rescuer[3], longitude: rescuer[4] },
      create: {
        name: rescuer[0],
        callSign: rescuer[1],
        status: rescuer[2],
        latitude: rescuer[3],
        longitude: rescuer[4]
      }
    });
  }

  await prisma.responseService.createMany({
    data: [
      {
        name: "Water Rescue Aktau",
        type: ResponseServiceType.WATER_RESCUE,
        status: ResponseServiceStatus.AVAILABLE,
        latitude: 43.6422,
        longitude: 51.1501,
        metadata: { callSign: "WATER-01", isMock: true }
      },
      {
        name: "Search & Rescue Mobile Group",
        type: ResponseServiceType.SEARCH_RESCUE,
        status: ResponseServiceStatus.AVAILABLE,
        latitude: 43.6351,
        longitude: 51.1614,
        metadata: { callSign: "SAR-02", isMock: true }
      },
      {
        name: "Eco Monitoring",
        type: ResponseServiceType.ECO_SERVICE,
        status: ResponseServiceStatus.AVAILABLE,
        latitude: 43.6019,
        longitude: 51.2281,
        metadata: { callSign: "ECO-03", isMock: true }
      }
    ]
  });

  const zones = [
    {
      name: "Безопасная зона пляжа 7А",
      type: ZoneType.SAFE,
      polygon: [
        [43.655, 51.134],
        [43.647, 51.138],
        [43.641, 51.153],
        [43.649, 51.158],
        [43.659, 51.143]
      ]
    },
    {
      name: "Запрещенная зона возле порта",
      type: ZoneType.RESTRICTED,
      polygon: [
        [43.609, 51.211],
        [43.595, 51.221],
        [43.601, 51.241],
        [43.616, 51.231]
      ]
    },
    {
      name: "Поисковый сектор скал",
      type: ZoneType.SEARCH,
      polygon: [
        [43.629, 51.146],
        [43.618, 51.151],
        [43.612, 51.166],
        [43.625, 51.172],
        [43.636, 51.158]
      ]
    }
  ];

  for (const zone of zones) {
    await prisma.zone.create({ data: zone });
  }

  const historical = [
    ["QT-0038", IncidentType.SAFE_ZONE_VIOLATION, IncidentStatus.RESOLVED, Severity.MEDIUM, 78, 43.6511, 51.1441, daysAgo(6)],
    ["QT-0039", IncidentType.FISHERMAN_SAFETY, IncidentStatus.RESOLVED, Severity.LOW, 71, 43.6731, 51.1269, daysAgo(4)],
    ["QT-0040", IncidentType.CHILD_RISK, IncidentStatus.RESOLVED, Severity.HIGH, 84, 43.6472, 51.1512, daysAgo(2)],
    ["QT-0041", IncidentType.RESTRICTED_ZONE, IncidentStatus.FALSE_ALARM, Severity.MEDIUM, 66, 43.6041, 51.223, hoursAgo(9)]
  ] as const;

  const seededIncidents = [];

  for (const item of historical) {
    const incident = await prisma.incident.upsert({
      where: { publicId: item[0] },
      update: {},
      create: {
        publicId: item[0],
        type: item[1],
        status: item[2],
        severity: item[3],
        confidence: item[4],
        latitude: item[5],
        longitude: item[6],
        droneId: drone1.id,
        patrolId: patrol.id,
        detectedAt: item[7],
        confirmedAt: item[2] === IncidentStatus.FALSE_ALARM ? null : new Date(item[7].getTime() + 4 * 60 * 1000),
        resolvedAt: item[2] === IncidentStatus.FALSE_ALARM ? item[7] : new Date(item[7].getTime() + 18 * 60 * 1000),
        createdAt: item[7]
      }
    });
    await prisma.incidentEvent.createMany({
      data: [
        { incidentId: incident.id, type: "DETECTION", message: "AI зафиксировал событие в береговой зоне", createdAt: item[7] },
        { incidentId: incident.id, type: "OPERATOR", message: item[2] === IncidentStatus.FALSE_ALARM ? "Оператор отметил ложную тревогу" : "Оператор подтвердил инцидент", createdAt: new Date(item[7].getTime() + 2 * 60 * 1000) }
      ],
      skipDuplicates: true
    });
    seededIncidents.push(incident);
  }

  const searchMission = await prisma.searchMission.upsert({
    where: { publicId: "SR-1024" },
    update: {},
    create: {
      publicId: "SR-1024",
      status: "ACTIVE",
      approximateTime: hoursAgo(2),
      description: "Мужчина, последний раз замечен возле скал. Одет в красную куртку, при себе черный рюкзак.",
      distinctiveItems: ["Красная куртка", "Черный рюкзак"],
      centerLatitude: aktau.rocks[0],
      centerLongitude: aktau.rocks[1],
      radius: 650,
      areaChecked: 44,
      startedAt: hoursAgo(1.8)
    }
  });

  await prisma.searchCandidate.createMany({
    data: [
      {
        searchMissionId: searchMission.id,
        confidence: 82,
        visualSimilarity: 82,
        latitude: 43.6224,
        longitude: 51.1576,
        imageUrl: "/demo/candidate-red-jacket.jpg",
        matchedItems: ["Красная куртка", "Черный рюкзак"],
        status: "NEW",
        detectedAt: hoursAgo(1.1)
      },
      {
        searchMissionId: searchMission.id,
        confidence: 61,
        visualSimilarity: 58,
        latitude: 43.6261,
        longitude: 51.1519,
        imageUrl: "/demo/candidate-low-confidence.jpg",
        matchedItems: ["Темная сумка"],
        status: "REJECTED",
        detectedAt: hoursAgo(1.4)
      }
    ]
  });

  await prisma.targetSighting.createMany({
    data: [
      {
        searchMissionId: searchMission.id,
        sourceType: "Camera",
        sourceId: "CAM-04",
        latitude: 43.629,
        longitude: 51.151,
        timestamp: hoursAgo(2.3),
        confidence: 74,
        metadata: { label: "18:21 Camera 04", isMock: true }
      },
      {
        searchMissionId: searchMission.id,
        sourceType: "Drone",
        sourceId: "QUTQAR-01",
        latitude: 43.624,
        longitude: 51.155,
        timestamp: hoursAgo(1.9),
        confidence: 84,
        metadata: { label: "18:27 Drone QUTQAR-01", isMock: true }
      },
      {
        searchMissionId: searchMission.id,
        sourceType: "Camera",
        sourceId: "CAM-07",
        latitude: 43.6218,
        longitude: 51.1567,
        timestamp: hoursAgo(1.6),
        confidence: 69,
        metadata: { label: "18:31 Camera 07", status: "LOST", isMock: true }
      }
    ]
  });

  for (let i = 0; i < 18; i += 1) {
    await prisma.droneTelemetry.create({
      data: {
        droneId: drone1.id,
        battery: 87 - i,
        latitude: 43.675 - i * 0.0023,
        longitude: 51.126 + i * 0.0018,
        altitude: 74 + (i % 5) * 3,
        speed: 8.5 + (i % 3),
        heading: 185 + i,
        createdAt: new Date(Date.now() - (18 - i) * 90 * 1000)
      }
    });
  }

  const detectionPoints = [
    [IncidentType.POTENTIAL_DROWNING, 91, 43.6466, 51.1492],
    [IncidentType.SAFE_ZONE_VIOLATION, 74, 43.6515, 51.1452],
    [IncidentType.CHILD_RISK, 82, 43.6488, 51.1519],
    [IncidentType.FISHERMAN_SAFETY, 69, 43.6718, 51.1261]
  ] as const;

  for (const [type, confidence, latitude, longitude] of detectionPoints) {
    await prisma.detection.create({
      data: {
        type,
        confidence,
        latitude,
        longitude,
        droneId: drone1.id,
        patrolId: patrol.id,
        metadata: { source: "mock-ai", frame: "demo-coastline" },
        feedback: confidence > 85 ? "confirmed" : null
      }
    });
  }

  const environmentalSnapshot = await prisma.environmentalSnapshot.create({
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
      explanation: "SIMULATED: ветер и волна умеренные; спасательные операции требуют повышенного внимания.",
      validAt: new Date()
    }
  });

  await prisma.driftPrediction.create({
    data: {
      searchMissionId: searchMission.id,
      environmentalSnapshotId: environmentalSnapshot.id,
      originLatitude: aktau.rocks[0],
      originLongitude: aktau.rocks[1],
      elapsedMinutes: 20,
      areas: [
        { label: "NOW", latitude: 43.6224, longitude: 51.1561, radius: 140 },
        { label: "+5 MIN", latitude: 43.6232, longitude: 51.1548, radius: 220 },
        { label: "+10 MIN", latitude: 43.6242, longitude: 51.1535, radius: 310 },
        { label: "+20 MIN", latitude: 43.6261, longitude: 51.1512, radius: 460 }
      ],
      metadata: { model: "deterministic-demo-drift", isMock: true }
    }
  });

  const recording = await prisma.recording.create({
    data: {
      publicId: "REC-2409-01",
      droneId: drone1.id,
      mission: "Патруль пляжа 7А",
      videoUrl: "/demo/qutqar-coastline-playback.mp4",
      startedAt: hoursAgo(3),
      endedAt: hoursAgo(2.4),
      metadata: { source: "prerecorded-placeholder", isMock: true }
    }
  });

  await prisma.recordingEvent.createMany({
    data: [
      {
        recordingId: recording.id,
        timestamp: new Date(recording.startedAt.getTime() + 4 * 60 * 1000),
        offsetSec: 240,
        type: "DRONE_POSITION",
        label: "QUTQAR-01 проходит северный сектор",
        latitude: 43.657,
        longitude: 51.139,
        metadata: { battery: 84 }
      },
      {
        recordingId: recording.id,
        timestamp: new Date(recording.startedAt.getTime() + 11 * 60 * 1000),
        offsetSec: 660,
        type: "AI_ALERT",
        label: "Potential drowning detected",
        latitude: 43.6466,
        longitude: 51.1492,
        metadata: { confidence: 91, box: [42, 31, 18, 26] }
      },
      {
        recordingId: recording.id,
        timestamp: new Date(recording.startedAt.getTime() + 12 * 60 * 1000),
        offsetSec: 720,
        type: "OPERATOR",
        label: "Оператор подтвердил инцидент",
        latitude: 43.6466,
        longitude: 51.1492,
        metadata: { publicId: "QT-0040" }
      }
    ]
  });

  await prisma.changeDetection.createMany({
    data: [
      {
        recordingId: recording.id,
        compareLabelA: "12 Sep 2026",
        compareLabelB: "23 Sep 2026",
        type: "new object",
        confidence: 72,
        latitude: 43.648,
        longitude: 51.1503,
        metadata: { label: "Новый объект у пирса", isMock: true }
      },
      {
        recordingId: recording.id,
        compareLabelA: "12 Sep 2026",
        compareLabelB: "23 Sep 2026",
        type: "coastline change",
        confidence: 64,
        latitude: 43.622,
        longitude: 51.157,
        metadata: { label: "Изменение береговой линии", isMock: true }
      }
    ]
  });

  for (const incident of seededIncidents.filter((item) => item.status !== IncidentStatus.FALSE_ALARM).slice(0, 2)) {
    const evidence = await prisma.evidence.create({
      data: {
        publicId: `EV-${incident.publicId}`,
        incidentId: incident.id,
        reportHtml: `<h1>QUTQAR Evidence ${incident.publicId}</h1><p>${incident.type}</p>`,
        qrPayload: `/evidence?incident=${incident.publicId}`,
        metadata: { isMock: false, drone: "QUTQAR-01", confidence: incident.confidence }
      }
    });
    await prisma.evidenceAsset.createMany({
      data: [
        {
          evidenceId: evidence.id,
          type: "DETECTION_SCREENSHOT",
          label: "Detection frame",
          url: "/demo/evidence-frame.jpg",
          metadata: { source: "mock-ai-frame" }
        },
        {
          evidenceId: evidence.id,
          type: "VIDEO_CLIP",
          label: "Playback clip reference",
          url: recording.videoUrl,
          metadata: { recordingId: recording.publicId }
        }
      ]
    });
  }

  if (seededIncidents[2]) {
    await prisma.printJob.create({
      data: {
        incidentId: seededIncidents[2].id,
        status: PrintJobStatus.PRINTED,
        reportUrl: `/evidence?incident=${seededIncidents[2].publicId}`,
        printedAt: hoursAgo(1.9),
        metadata: { provider: "MockPrinterProvider", station: "Спасательная станция 7А" }
      }
    });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
