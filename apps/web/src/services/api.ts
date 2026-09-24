import type { DroneConnection, Evidence, Overview, Recording, RescueAssignment } from "../types/domain";

const baseUrl = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Ошибка запроса" }));
    throw new Error(body.message ?? "Ошибка запроса");
  }
  return response.json() as Promise<T>;
}

export const api = {
  overview: () => request<Overview>("/api/overview"),
  activeConnection: () => request<DroneConnection | null>("/api/connections/active"),
  connectSession: (body: { model: string; method: "QR" | "DJI_APP" | "SERIAL"; serialNumber?: string }) =>
    request<DroneConnection>("/api/connections/connect", { method: "POST", body: JSON.stringify(body) }),
  disconnectSession: () => request("/api/connections/disconnect", { method: "POST" }),
  sea: () => request<unknown>("/api/sea"),
  playback: () => request<Recording[]>("/api/playback"),
  evidence: () => request<Evidence[]>("/api/evidence"),
  createEvidence: (incidentId: string) => request<Evidence>(`/api/evidence/${incidentId}`, { method: "POST" }),
  analyzeText: (text: string) => request<unknown>("/api/dispatcher/analyze-text", { method: "POST", body: JSON.stringify({ text }) }),
  analytics: () => request<unknown>("/api/analytics"),
  drones: () => request<unknown>("/api/drones"),
  connectDrone: (body: { serialNumber: string; name?: string; station?: string }) =>
    request("/api/drones/connect", { method: "POST", body: JSON.stringify(body) }),
  demoStart: () => request<{ status: string; detectionId?: string }>("/api/demo/start", { method: "POST" }),
  demoConfirm: (detectionId?: string) => request("/api/demo/confirm", { method: "POST", body: JSON.stringify({ detectionId }) }),
  demoFalseAlarm: (detectionId: string) => request("/api/demo/false-alarm", { method: "POST", body: JSON.stringify({ detectionId }) }),
  demoReset: () => request("/api/demo/reset", { method: "POST" }),
  demoFullScenario: () => request("/api/demo/full-scenario", { method: "POST" }),
  demoSearchScenario: () => request("/api/demo/search-scenario", { method: "POST" }),
  dispatch: (incidentId: string) => request(`/api/incidents/${incidentId}/dispatch`, { method: "POST" }),
  incidentStatus: (incidentId: string, status: string, message?: string) =>
    request(`/api/incidents/${incidentId}/status`, { method: "POST", body: JSON.stringify({ status, message }) }),
  createMission: (body: {
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
    approximateTime: string;
    description: string;
    distinctiveItems: string[];
    visualReferenceUrl?: string;
  }) => request("/api/search-missions", { method: "POST", body: JSON.stringify(body) }),
  generateCandidate: (missionId: string) => request(`/api/search-missions/${missionId}/generate-candidate`, { method: "POST" }),
  updateCandidate: (candidateId: string, status: "NEW" | "POSSIBLE_TARGET" | "REJECTED") =>
    request(`/api/search-missions/${candidateId}/candidates`, { method: "POST", body: JSON.stringify({ status }) }),
  createDrift: (body: { incidentId?: string; searchMissionId?: string; latitude: number; longitude: number; elapsedMinutes: number }) =>
    request("/api/drift", { method: "POST", body: JSON.stringify(body) }),
  offlineEvents: () => request<unknown[]>("/api/offline/events"),
  queueOfflineEvent: (body: { idempotencyKey: string; type: string; payload: Record<string, unknown> }) =>
    request("/api/offline/events", { method: "POST", body: JSON.stringify(body) }),
  syncOffline: () => request("/api/offline/sync", { method: "POST" }),
  createPatrol: (body: { droneId: string; area: string; missionType: string; modules: string[] }) =>
    request("/api/patrols", { method: "POST", body: JSON.stringify(body) }),
  currentRescue: () => request<RescueAssignment | null>("/api/rescue/current"),
  rescueAction: (assignmentId: string, action: "ACCEPT" | "ARRIVED" | "RESCUED") =>
    request<RescueAssignment>(`/api/rescue/${assignmentId}/action`, { method: "POST", body: JSON.stringify({ action }) })
};
