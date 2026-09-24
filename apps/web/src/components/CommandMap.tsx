import L from "leaflet";
import { Circle, CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from "react-leaflet";
import type { DriftPrediction, Drone, Incident, Rescuer, SearchMission, TargetSighting, Zone } from "../types/domain";
import { incidentStatusLabel, incidentTypeLabel } from "../i18n/ru";

const icon = (className: string, label?: string) =>
  L.divIcon({
    className: "",
    html: `<div class="q-marker"><div class="${className}"></div>${label ? `<span>${label}</span>` : ""}</div>`,
    iconSize: [76, 34],
    iconAnchor: [11, 11]
  });

interface CommandMapProps {
  drones: Drone[];
  incidents: Incident[];
  zones: Zone[];
  rescuers?: Rescuer[];
  missions?: SearchMission[];
  driftPredictions?: DriftPrediction[];
  sightings?: TargetSighting[];
  selectedType?: string;
  onIncidentClick?: (incident: Incident) => void;
}

export function CommandMap({ drones, incidents, zones, rescuers = [], missions = [], driftPredictions = [], sightings = [], selectedType = "ALL", onIncidentClick }: CommandMapProps) {
  const filteredIncidents = selectedType === "ALL" ? incidents : incidents.filter((incident) => incident.type === selectedType);
  const sightingLine = sightings.map((sighting) => [sighting.latitude, sighting.longitude] as [number, number]);
  return (
    <MapContainer center={[43.646, 51.153]} zoom={12} scrollWheelZoom className="h-full min-h-[480px]">
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {zones.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.polygon}
          pathOptions={{
            color: zone.type === "SAFE" ? "#087F73" : zone.type === "RESTRICTED" ? "#D92D20" : "#277DA1",
            fillOpacity: zone.type === "RESTRICTED" ? 0.16 : 0.08,
            weight: 2,
            dashArray: zone.type === "SAFE" ? "8 6" : zone.type === "RESTRICTED" ? "2 5" : "10 4"
          }}
        >
          <Popup>{zone.name}</Popup>
        </Polygon>
      ))}
      {missions.map((mission) => (
        <Circle
          key={mission.id}
          center={[mission.centerLatitude, mission.centerLongitude]}
          radius={mission.radius}
          pathOptions={{ color: "#277DA1", fillOpacity: 0.06, dashArray: "10 6", weight: 2 }}
        >
          <Popup>{mission.publicId}: {mission.description}</Popup>
        </Circle>
      ))}
      {driftPredictions.flatMap((prediction) =>
        prediction.areas.map((area) => (
          <Circle
            key={`${prediction.id}-${area.label}`}
            center={[area.latitude, area.longitude]}
            radius={area.radius}
            pathOptions={{ color: "#E7A928", fillOpacity: 0.10, weight: 1.6, dashArray: "3 7" }}
          >
            <Popup>
              <b>Расчётная область дрейфа</b>
              <br />
              {area.label} · {Math.round(area.radius)} м
            </Popup>
          </Circle>
        ))
      )}
      {sightingLine.length > 1 && <Polyline positions={sightingLine} pathOptions={{ color: "#6f5cc2", weight: 2.5, opacity: 0.7, dashArray: "8 9" }} />}
      {sightings.map((sighting) => (
        <Marker key={sighting.id} position={[sighting.latitude, sighting.longitude]} icon={icon("sighting-marker", "LS / " + sighting.sourceType.slice(0, 3).toUpperCase())}>
          <Popup>
            <b>{String(sighting.metadata?.label ?? "LAST SEEN")}</b>
            <br />
            {sighting.sourceType} · {sighting.confidence}%
          </Popup>
        </Marker>
      ))}
      {filteredIncidents.map((incident) => (
        <Marker key={incident.id} position={[incident.latitude, incident.longitude]} icon={icon("pulse-marker", `INC / ${incident.publicId.replace("QT-", "")}`)} eventHandlers={{ click: () => onIncidentClick?.(incident) }}>
          <Popup>
            <b>{incident.publicId}</b>
            <br />
            {incidentTypeLabel[incident.type]}
            <br />
            {incidentStatusLabel[incident.status]} · {incident.confidence}%
          </Popup>
        </Marker>
      ))}
      {drones.map((drone) => (
        <Marker key={drone.id} position={[drone.latitude, drone.longitude]} icon={icon("drone-marker", `DRN / ${drone.name.replace("QUTQAR-", "Q-")}`)}>
          <Popup>
            <b>{drone.name}</b>
            <br />
            {drone.model}
            <br />
            Батарея {drone.battery}% · {drone.altitude} м
          </Popup>
        </Marker>
      ))}
      {rescuers.map((rescuer) => (
        <Marker key={rescuer.id} position={[rescuer.latitude, rescuer.longitude]} icon={icon("rescuer-marker", `SAR / ${rescuer.callSign.replace("RESCUE-", "00")}`)}>
          <Popup>
            <b>{rescuer.callSign}</b>
            <br />
            {rescuer.name}
            <br />
            {rescuer.status}
          </Popup>
        </Marker>
      ))}
      {incidents.filter((incident) => incident.status === "RESOLVED").map((incident) => (
        <CircleMarker key={`h-${incident.id}`} center={[incident.latitude, incident.longitude]} radius={10} pathOptions={{ color: "#98a2b3", fillOpacity: 0.16 }} />
      ))}
    </MapContainer>
  );
}
