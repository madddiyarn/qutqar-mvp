import { AlertTriangle, CloudSun, Compass, DatabaseZap, Radio, ShipWheel, Waves, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { Circle, MapContainer, Polyline, TileLayer } from "react-leaflet";
import { api } from "../services/api";
import type { EnvironmentalSnapshot } from "../types/domain";

interface SeaPayload {
  snapshot: EnvironmentalSnapshot;
  forecast: Array<{ label: string; windSpeed: number; waveHeight: number; sourceKind: string }>;
  source: string;
}

export function SeaPage() {
  const [payload, setPayload] = useState<SeaPayload | null>(null);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    api.sea().then((data) => setPayload(data as SeaPayload)).catch(() => setPayload(null));
    api.offlineEvents().then((events) => setOfflineCount(events.filter((event) => (event as { status?: string }).status === "QUEUED").length)).catch(() => null);
  }, []);

  if (!payload) return <div className="card p-6 text-muted">Загрузка Sea Intelligence...</div>;
  const sea = payload.snapshot;
  const caution = sea.droneCondition !== "GOOD" && sea.droneCondition !== "NORMAL";

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Wind} label="Wind" value={`${sea.windSpeed} m/s`} detail={`${sea.windDirection}° · ${sea.sourceKind}`} />
        <Metric icon={CloudSun} label="Temperature" value={`${sea.temperature}°C`} detail={sea.weatherStatus} />
        <Metric icon={Waves} label="Wave height" value={`${sea.waveHeight} m`} detail={`${sea.wavePeriod}s · ${sea.waveDirection}°`} />
        <Metric icon={Compass} label="Visibility" value={`${sea.visibility} km`} detail={`precip ${sea.precipitation} mm`} />
      </section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_440px]">
        <div className="card h-[560px] p-3">
          <MapContainer center={[43.646, 51.153]} zoom={12} className="h-full">
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={[[43.67, 51.13], [43.64, 51.16], [43.61, 51.19]]} pathOptions={{ color: "#0f87a8", weight: 3, dashArray: "8 8" }} />
            <Circle center={[43.646, 51.149]} radius={460} pathOptions={{ color: "#0f87a8", fillOpacity: 0.08 }} />
          </MapContainer>
        </div>
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2"><ShipWheel className="text-[#0f87a8]" /><h1 className="text-2xl font-extrabold">Sea Intelligence</h1></div>
            <p className="mt-2 text-sm text-muted">{payload.source} · simulated values are labelled and never presented as live satellite/marine truth.</p>
            <div className="mt-4 grid gap-3">
              <Condition label="DRONE CONDITIONS" value={sea.droneCondition} caution={caution} />
              <Condition label="RESCUE CONDITIONS" value={sea.rescueCondition} caution={sea.rescueCondition !== "NORMAL"} />
            </div>
            <p className="mt-4 rounded-2xl bg-[#fff5dc] p-3 text-sm font-semibold text-[#b54708]">{sea.explanation}</p>
          </div>
          <div className="card p-4">
            <h2 className="font-extrabold">Timeline</h2>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {payload.forecast.map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#f1f3f5] p-3 text-center text-sm">
                  <b>{item.label}</b><br />{item.windSpeed} m/s<br />{item.waveHeight} m
                </div>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2"><DatabaseZap size={18} /><h2 className="font-extrabold">Offline emergency mode</h2></div>
            <p className="mt-2 text-sm text-muted">{offlineCount} событий ожидают синхронизации</p>
            <div className="mt-3 flex gap-2">
              <button className="btn" onClick={async () => { await api.queueOfflineEvent({ idempotencyKey: crypto.randomUUID(), type: "operator.note", payload: { note: "Demo offline event" } }); setOfflineCount((value) => value + 1); }}><Radio size={16} /> CONNECTION LOST</button>
              <button className="btn btn-primary" onClick={async () => { await api.syncOffline(); setOfflineCount(0); }}>RESTORE CONNECTION</button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Wind; label: string; value: string; detail: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-bold text-muted">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e7f6fa] text-[#0f6f8a]"><Icon size={20} /></div>
      </div>
      <p className="mt-3 text-sm text-muted">{detail}</p>
    </div>
  );
}

function Condition({ label, value, caution }: { label: string; value: string; caution: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${caution ? "bg-[#fff5dc] text-[#b54708]" : "bg-[#eaf8f0] text-[#067647]"}`}>
      <div className="text-xs font-extrabold">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-xl font-extrabold">{caution && <AlertTriangle size={18} />}{value}</div>
    </div>
  );
}
