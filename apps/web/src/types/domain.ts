export type DroneStatus = "ONLINE" | "CHARGING" | "OFFLINE" | "MAINTENANCE";
export type IncidentStatus = "NEW" | "CONFIRMED" | "DISPATCHED" | "RESCUER_ACCEPTED" | "ARRIVED" | "RESOLVED" | "FALSE_ALARM";
export type IncidentType = "POTENTIAL_DROWNING" | "SAFE_ZONE_VIOLATION" | "RESTRICTED_ZONE" | "PERSON_OVERBOARD" | "CHILD_RISK" | "FISHERMAN_SAFETY" | "SEARCH_TARGET";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type UserRole = "SUPERVISOR" | "CONTROLLER";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Drone {
  id: string;
  serialNumber: string;
  name: string;
  model: string;
  status: DroneStatus;
  battery: number;
  latitude: number;
  longitude: number;
  altitude: number;
  station?: string;
  gpsStatus: string;
  cameraStatus: string;
  mission?: string;
  lastSeenAt: string;
  telemetry?: Telemetry[];
  incidents?: Incident[];
}

export interface DroneConnection {
  id: string;
  method: "QR" | "DJI_APP" | "SERIAL";
  status: "CONNECTING" | "CONNECTED" | "DISCONNECTED";
  isMock: boolean;
  selectedModel: string;
  serialNumber: string;
  connectedAt: string;
  disconnectedAt?: string;
  metadata: Record<string, unknown>;
  drone: Drone;
}

export interface Telemetry {
  id: string;
  droneId: string;
  battery: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  createdAt: string;
}

export interface Incident {
  id: string;
  publicId: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: Severity;
  confidence: number;
  latitude: number;
  longitude: number;
  detectedAt: string;
  confirmedAt?: string;
  resolvedAt?: string;
  drone?: Drone;
  events?: IncidentEvent[];
  assignments?: RescueAssignment[];
  evidence?: Evidence[];
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  type: string;
  message: string;
  createdAt: string;
  incident?: Incident;
}

export interface Zone {
  id: string;
  name: string;
  type: "SAFE" | "RESTRICTED" | "SEARCH";
  polygon: [number, number][];
  active: boolean;
}

export interface Rescuer {
  id: string;
  name: string;
  callSign: string;
  status: "AVAILABLE" | "DISPATCHED" | "BUSY" | "OFFLINE";
  latitude: number;
  longitude: number;
}

export interface RescueAssignment {
  id: string;
  incidentId: string;
  rescuerId: string;
  status: "SENT" | "ACCEPTED" | "ARRIVED" | "COMPLETED";
  incident: Incident;
  rescuer: Rescuer;
}

export interface Patrol {
  id: string;
  publicId: string;
  area: string;
  missionType: string;
  modules: string[];
  status: "PLANNED" | "ACTIVE" | "PAUSED" | "COMPLETED";
  progress: number;
  drone: Drone;
  detections: Detection[];
  incidents: Incident[];
}

export interface Detection {
  id: string;
  type: string;
  confidence: number;
  latitude: number;
  longitude: number;
  feedback?: string;
  createdAt: string;
}

export interface SearchMission {
  id: string;
  publicId: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  approximateTime: string;
  description: string;
  distinctiveItems: string[];
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  areaChecked: number;
  candidates: SearchCandidate[];
  sightings?: TargetSighting[];
  driftPredictions?: DriftPrediction[];
}

export interface SearchCandidate {
  id: string;
  confidence: number;
  visualSimilarity: number;
  latitude: number;
  longitude: number;
  imageUrl: string;
  matchedItems: string[];
  status: "NEW" | "POSSIBLE_TARGET" | "REJECTED";
  detectedAt: string;
}

export interface TargetSighting {
  id: string;
  sourceType: string;
  sourceId?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface EnvironmentalSnapshot {
  id: string;
  sourceKind: "LIVE" | "CACHED" | "SIMULATED" | "MOCK";
  windSpeed: number;
  windDirection: number;
  temperature: number;
  visibility: number;
  precipitation: number;
  weatherStatus: string;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  currentSpeed: number;
  currentDirection: number;
  droneCondition: string;
  rescueCondition: string;
  explanation: string;
  validAt: string;
}

export interface DriftPrediction {
  id: string;
  originLatitude: number;
  originLongitude: number;
  elapsedMinutes: number;
  areas: Array<{ label: string; latitude: number; longitude: number; radius: number }>;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Recording {
  id: string;
  publicId: string;
  mission: string;
  videoUrl: string;
  startedAt: string;
  endedAt: string;
  drone: Drone;
  events: RecordingEvent[];
  changes: ChangeDetection[];
}

export interface AdminSnapshot {
  users: User[];
  drones: Drone[];
  rescuers: Rescuer[];
  recordings: Recording[];
}

export interface RecordingEvent {
  id: string;
  offsetSec: number;
  type: string;
  label: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  metadata: Record<string, unknown>;
}

export interface ChangeDetection {
  id: string;
  compareLabelA: string;
  compareLabelB: string;
  type: string;
  confidence: number;
  latitude: number;
  longitude: number;
  metadata: Record<string, unknown>;
}

export interface Evidence {
  id: string;
  publicId: string;
  status: string;
  reportHtml: string;
  qrPayload: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  incident: Incident;
  assets: EvidenceAsset[];
}

export interface EvidenceAsset {
  id: string;
  type: string;
  label: string;
  url: string;
  metadata: Record<string, unknown>;
}

export interface Overview {
  drones: Drone[];
  incidents: Incident[];
  zones: Zone[];
  rescuers: Rescuer[];
  patrols: Patrol[];
  missions: SearchMission[];
  detections: Detection[];
  events: IncidentEvent[];
  telemetry: Telemetry[];
  activeConnection?: DroneConnection | null;
  sea: EnvironmentalSnapshot;
  seaForecast: Array<{ label: string; windSpeed: number; waveHeight: number; sourceKind: string }>;
  driftPredictions: DriftPrediction[];
  sightings: TargetSighting[];
  stats: {
    activeDrones: number;
    activeIncidents: number;
    availableRescuers: number;
    patrolsToday: number;
  };
}
