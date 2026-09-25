import { Database, Film, Plus, RefreshCw, Save, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { AdminSnapshot, Drone, Rescuer, UserRole } from "../types/domain";

const aktau = { lat: 43.6509, lng: 51.1406 };

export function ControllerPage() {
  const [data, setData] = useState<AdminSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userForm, setUserForm] = useState({ name: "Новый пользователь", email: "new@qutqar.kz", role: "SUPERVISOR" as UserRole, password: "qutqar2026" });
  const [droneForm, setDroneForm] = useState({
    serialNumber: "DRN-MANUAL-001",
    name: "QUTQAR-01",
    model: "DJI Avata 2",
    status: "ONLINE" as Drone["status"],
    battery: 100,
    latitude: aktau.lat,
    longitude: aktau.lng,
    altitude: 0,
    station: "Штаб Актау",
    mission: "Ручное добавление"
  });
  const [rescuerForm, setRescuerForm] = useState({
    name: "Спасатель",
    callSign: "SAR-01",
    status: "AVAILABLE" as Rescuer["status"],
    latitude: 43.6422,
    longitude: 51.1501
  });
  const [recordingForm, setRecordingForm] = useState({
    droneId: "",
    mission: "Загруженное видео",
    videoUrl: "",
    startedAt: new Date().toISOString().slice(0, 16),
    endedAt: new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)
  });

  async function refresh() {
    setData(await api.adminSnapshot());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка операции");
    } finally {
      setBusy(false);
    }
  }

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  const firstDroneId = recordingForm.droneId || data?.drones[0]?.id || "";

  return (
    <div className="min-h-[calc(100vh-58px)] bg-base p-4">
      <section className="ops-panel mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="ops-label">CONTROL / FULL DATA ACCESS</div>
          <h1 className="text-3xl font-extrabold">Контроллер</h1>
          <p className="mt-1 text-sm text-muted">Полное управление пользователями, флотом, спасателями, координатами и видеоархивом.</p>
        </div>
        <button className="btn" onClick={refresh}><RefreshCw size={16} /> Обновить</button>
      </section>
      {message && <div className="ops-panel mb-4 p-3 text-sm font-bold">{message}</div>}

      <div className="grid gap-4 2xl:grid-cols-2">
        <section className="ops-panel p-4">
          <Header icon={Users} title="Пользователи" />
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input className="field" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} />
            <input className="field" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
            <select className="field" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as UserRole })}>
              <option value="SUPERVISOR">Надзор</option>
              <option value="CONTROLLER">Контроллер</option>
            </select>
            <input className="field" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} />
          </div>
          <button className="btn btn-primary mt-3" disabled={busy} onClick={() => run(() => api.createUser(userForm), "Пользователь создан")}><Plus size={16} /> Добавить</button>
          <div className="mt-4 grid gap-2">
            {data?.users.map((user) => (
              <div key={user.id} className="grid gap-2 border border-line bg-[#F2F0E9] p-3 md:grid-cols-[1fr_1fr_130px_auto]">
                <b>{user.name}</b>
                <span className="mono text-xs">{user.email}</span>
                <span className="ops-label">{user.role === "CONTROLLER" ? "КОНТРОЛЛЕР" : "НАДЗОР"}</span>
                <button className="btn px-3 py-1" onClick={() => run(() => api.deleteUser(user.id), "Пользователь удален")}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel p-4">
          <Header icon={Database} title="Флот и координаты" />
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input className="field" value={droneForm.serialNumber} onChange={(event) => setDroneForm({ ...droneForm, serialNumber: event.target.value })} />
            <input className="field" value={droneForm.name} onChange={(event) => setDroneForm({ ...droneForm, name: event.target.value })} />
            <input className="field" value={droneForm.model} onChange={(event) => setDroneForm({ ...droneForm, model: event.target.value })} />
            <input className="field" type="number" value={droneForm.latitude} onChange={(event) => setDroneForm({ ...droneForm, latitude: Number(event.target.value) })} />
            <input className="field" type="number" value={droneForm.longitude} onChange={(event) => setDroneForm({ ...droneForm, longitude: Number(event.target.value) })} />
            <input className="field" type="number" value={droneForm.battery} onChange={(event) => setDroneForm({ ...droneForm, battery: Number(event.target.value) })} />
          </div>
          <button className="btn btn-primary mt-3" disabled={busy} onClick={() => run(() => api.createAdminDrone(droneForm), "Дрон добавлен")}><Plus size={16} /> Добавить дрон</button>
          <div className="mt-4 grid gap-2">
            {data?.drones.map((drone) => (
              <div key={drone.id} className="grid gap-2 border border-line bg-[#F2F0E9] p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <b>{drone.name}</b>
                <span className="mono text-xs">{drone.latitude.toFixed(5)}, {drone.longitude.toFixed(5)}</span>
                <span>{drone.model}</span>
                <button className="btn px-3 py-1" onClick={() => run(() => api.deleteDrone(drone.id), "Дрон удален")}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel p-4">
          <Header icon={Users} title="Спасатели" />
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            <input className="field" value={rescuerForm.name} onChange={(event) => setRescuerForm({ ...rescuerForm, name: event.target.value })} />
            <input className="field" value={rescuerForm.callSign} onChange={(event) => setRescuerForm({ ...rescuerForm, callSign: event.target.value })} />
            <select className="field" value={rescuerForm.status} onChange={(event) => setRescuerForm({ ...rescuerForm, status: event.target.value as Rescuer["status"] })}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="BUSY">BUSY</option>
              <option value="OFFLINE">OFFLINE</option>
            </select>
            <input className="field" type="number" value={rescuerForm.latitude} onChange={(event) => setRescuerForm({ ...rescuerForm, latitude: Number(event.target.value) })} />
            <input className="field" type="number" value={rescuerForm.longitude} onChange={(event) => setRescuerForm({ ...rescuerForm, longitude: Number(event.target.value) })} />
          </div>
          <button className="btn btn-primary mt-3" disabled={busy} onClick={() => run(() => api.createRescuer(rescuerForm), "Спасатель добавлен")}><Plus size={16} /> Добавить</button>
          <div className="mt-4 grid gap-2">
            {data?.rescuers.map((rescuer) => (
              <div key={rescuer.id} className="grid gap-2 border border-line bg-[#F2F0E9] p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <b>{rescuer.name}</b>
                <span className="mono text-xs">{rescuer.callSign}</span>
                <span>{rescuer.status}</span>
                <button className="btn px-3 py-1" onClick={() => run(() => api.deleteRescuer(rescuer.id), "Спасатель удален")}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel p-4">
          <Header icon={Film} title="Видео Live / Playback" />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <select className="field" value={firstDroneId} onChange={(event) => setRecordingForm({ ...recordingForm, droneId: event.target.value })}>
              <option value="">Выберите дрон</option>
              {data?.drones.map((drone) => <option key={drone.id} value={drone.id}>{drone.name}</option>)}
            </select>
            <input className="field" value={recordingForm.mission} onChange={(event) => setRecordingForm({ ...recordingForm, mission: event.target.value })} />
            <input className="field" type="datetime-local" value={recordingForm.startedAt} onChange={(event) => setRecordingForm({ ...recordingForm, startedAt: event.target.value })} />
            <input className="field" type="datetime-local" value={recordingForm.endedAt} onChange={(event) => setRecordingForm({ ...recordingForm, endedAt: event.target.value })} />
            <input className="field md:col-span-2" placeholder="https://...mp4 или data URL" value={recordingForm.videoUrl} onChange={(event) => setRecordingForm({ ...recordingForm, videoUrl: event.target.value })} />
            <input
              className="field md:col-span-2"
              type="file"
              accept="video/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) setRecordingForm({ ...recordingForm, videoUrl: await fileToDataUrl(file), mission: file.name });
              }}
            />
          </div>
          <button
            className="btn btn-primary mt-3"
            disabled={busy || !firstDroneId || !recordingForm.videoUrl}
            onClick={() => run(() => api.createRecording({ ...recordingForm, droneId: firstDroneId, startedAt: new Date(recordingForm.startedAt).toISOString(), endedAt: new Date(recordingForm.endedAt).toISOString(), metadata: { source: "controller-upload" } }), "Видео добавлено в Live и Playback")}
          >
            <Save size={16} /> Сохранить видео
          </button>
          <div className="mt-4 grid gap-2">
            {data?.recordings.map((recording) => (
              <div key={recording.id} className="grid gap-2 border border-line bg-[#F2F0E9] p-3 md:grid-cols-[1fr_1fr_auto]">
                <b>{recording.publicId}</b>
                <span>{recording.mission}</span>
                <button className="btn px-3 py-1" onClick={() => run(() => api.deleteRecording(recording.id), "Видео удалено")}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Header({ icon: Icon, title }: { icon: typeof Database; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-[#087F73]" />
      <h2 className="text-xl font-extrabold">{title}</h2>
    </div>
  );
}
