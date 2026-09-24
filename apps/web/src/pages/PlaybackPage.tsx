import { GitCompare, MapPin, Play, Radar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { api } from "../services/api";
import type { Recording } from "../types/domain";

export function PlaybackPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [offset, setOffset] = useState(660);
  const [overlay, setOverlay] = useState(true);
  const [events, setEvents] = useState(true);
  const [mapSync, setMapSync] = useState(true);

  useEffect(() => {
    api.playback().then((items) => {
      setRecordings(items);
      setSelectedId(items[0]?.id ?? "");
    }).catch(() => setRecordings([]));
  }, []);

  const selected = useMemo(() => recordings.find((item) => item.id === selectedId) ?? recordings[0], [recordings, selectedId]);
  const activeEvent = selected?.events.reduce((best, event) => Math.abs(event.offsetSec - offset) < Math.abs(best.offsetSec - offset) ? event : best, selected.events[0]);
  const route = selected?.events.filter((event) => event.latitude && event.longitude).map((event) => [event.latitude!, event.longitude!] as [number, number]) ?? [];

  if (!selected) return <div className="card p-6 text-muted">Архив записей пока пуст.</div>;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_420px]">
      <section className="card overflow-hidden p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mono text-sm text-muted">{selected.publicId}</div>
            <h1 className="text-2xl font-extrabold">Архив / Playback</h1>
          </div>
          <select className="rounded-full border border-line px-4 py-2 font-bold" value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
            {recordings.map((recording) => <option key={recording.id} value={recording.id}>{recording.mission}</option>)}
          </select>
        </div>
        <div className="relative mt-4 min-h-[460px] overflow-hidden rounded-2xl border border-line bg-[#dfeaf0]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#b8d9e7_0%,#d8ecf2_35%,#f4dfb8_36%,#f4dfb8_48%,#a9c6b9_49%,#d7e7ef_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[#99c7cf]/70" />
          <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 font-mono text-xs font-bold">
            PRERECORDED · {new Date(selected.startedAt).toLocaleTimeString("ru-RU")} - {new Date(selected.endedAt).toLocaleTimeString("ru-RU")}
          </div>
          {overlay && activeEvent?.type === "AI_ALERT" && (
            <div className="absolute left-[42%] top-[31%] h-[26%] w-[18%] rounded border-2 border-[#d92d20] bg-[#d92d20]/5">
              <div className="absolute -top-8 left-0 rounded bg-[#d92d20] px-2 py-1 font-mono text-xs font-bold text-white">AI OVERLAY · 91%</div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/92 p-4">
            <input className="w-full accent-[#0f87a8]" type="range" min={0} max={1800} value={offset} onChange={(event) => setOffset(Number(event.target.value))} />
            <div className="mt-2 flex justify-between text-xs font-bold text-muted">
              <span>00:00</span><span className="mono">offset {offset}s</span><span>30:00</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={`btn ${overlay ? "btn-primary" : ""}`} onClick={() => setOverlay(!overlay)}><Radar size={16} /> AI OVERLAY</button>
          <button className={`btn ${events ? "btn-primary" : ""}`} onClick={() => setEvents(!events)}>EVENTS</button>
          <button className={`btn ${mapSync ? "btn-primary" : ""}`} onClick={() => setMapSync(!mapSync)}>MAP SYNC</button>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="card h-[330px] p-3">
          <MapContainer center={[activeEvent?.latitude ?? 43.646, activeEvent?.longitude ?? 51.149]} zoom={12} className="h-full">
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapSync && route.length > 1 && <Polyline positions={route} pathOptions={{ color: "#0f87a8", weight: 3 }} />}
            {selected.events.filter((event) => event.latitude && event.longitude).map((event) => (
              <Marker key={event.id} position={[event.latitude!, event.longitude!]}><Popup>{event.label}</Popup></Marker>
            ))}
            {selected.changes.map((change) => (
              <CircleMarker key={change.id} center={[change.latitude, change.longitude]} radius={10} pathOptions={{ color: "#f79009", fillOpacity: 0.2 }} />
            ))}
          </MapContainer>
        </div>
        <div className="card p-4">
          <h2 className="font-extrabold">Timeline events</h2>
          <div className="mt-3 space-y-2">
            {events && selected.events.map((event) => (
              <button key={event.id} className="w-full rounded-2xl border border-line p-3 text-left hover:border-[#0f87a8]" onClick={() => setOffset(event.offsetSec)}>
                <div className="mono text-xs text-muted">{new Date(event.timestamp).toLocaleTimeString("ru-RU")} · {event.offsetSec}s</div>
                <div className="font-bold">{event.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2"><GitCompare size={18} className="text-[#f79009]" /><h2 className="font-extrabold">Change Detection</h2></div>
          <div className="mt-3 space-y-2">
            {selected.changes.map((change) => (
              <div key={change.id} className="rounded-2xl bg-[#fff5dc] p-3 text-sm">
                <b>{change.type}</b> · {change.confidence}%<br />
                <span className="text-muted">{change.compareLabelA} vs {change.compareLabelB}</span>
                <div className="mt-1 flex items-center gap-1 font-mono text-xs text-muted"><MapPin size={13} /> {change.latitude.toFixed(4)}, {change.longitude.toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
