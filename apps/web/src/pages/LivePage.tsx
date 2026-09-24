import { AlertTriangle, BatteryCharging, CheckCircle2, Gauge, Radio, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { socket } from "../services/socket";

const predictions = [76, 81, 85, 89, 91];

export function LivePage() {
  const [step, setStep] = useState("Ожидание сценария");
  const [confidence, setConfidence] = useState(9);
  const [alert, setAlert] = useState(false);
  const [detectionId, setDetectionId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const eventHandler = (payload: { label: string; confidence?: number; detectionId?: string }) => {
      setStep(payload.label);
      if (payload.confidence) setConfidence(payload.confidence);
      if (payload.detectionId) setDetectionId(payload.detectionId);
    };
    const alertHandler = (payload: { detectionId: string; confidence: number }) => {
      setAlert(true);
      setDetectionId(payload.detectionId);
      setConfidence(payload.confidence);
      setStep("POTENTIAL DROWNING DETECTED");
    };
    socket.on("demo:event", eventHandler);
    socket.on("demo:alert", alertHandler);
    return () => {
      socket.off("demo:event", eventHandler);
      socket.off("demo:alert", alertHandler);
    };
  }, []);

  async function startDemo() {
    setBusy(true);
    setAlert(false);
    setMessage(null);
    try {
      const result = await api.demoStart();
      if (result.detectionId) setDetectionId(result.detectionId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось запустить demo");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    try {
      await api.demoConfirm(detectionId);
      setMessage("Инцидент создан в PostgreSQL и отправлен в командный центр.");
      setAlert(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка подтверждения");
    } finally {
      setBusy(false);
    }
  }

  async function falseAlarm() {
    if (!detectionId) return;
    setBusy(true);
    try {
      await api.demoFalseAlarm(detectionId);
      setMessage("Оценка сохранена как ложная тревога.");
      setAlert(false);
    } finally {
      setBusy(false);
    }
  }

  async function runFullScenario() {
    setBusy(true);
    setMessage(null);
    try {
      await api.demoFullScenario();
      setAlert(false);
      setStep("Полный сценарий выполнен");
      setMessage("Созданы dispatch, evidence package, print job и drift prediction.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка полного сценария");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-58px)] bg-[#F2F0E9] p-3">
      <section className="ops-panel mb-3 flex flex-wrap items-center justify-between gap-4 p-3">
        <div>
          <p className="ops-label">DRN / Q-01 · COASTAL GROUND CONTROL</p>
          <h1 className="text-2xl font-extrabold">Live Operations</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="btn px-3 py-1"><Radio size={16} /> REC / LIVE</span>
          <span className="btn px-3 py-1"><BatteryCharging size={16} /> BAT 84%</span>
          <span className="btn px-3 py-1"><Gauge size={16} /> ALT 79M</span>
          <span className="btn px-3 py-1"><CheckCircle2 size={16} /> GPS 14 SAT</span>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.75fr)_390px]">
        <div className="ops-panel overflow-hidden p-0">
          <div className="relative min-h-[650px] overflow-hidden border border-line bg-[#dfe6df]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#a9cfd8_0%,#dce7df_35%,#e8d7ad_36%,#e8d7ad_48%,#9dbdaa_49%,#d5ded5_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[#99c7cf]/70" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(23,32,30,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,30,0.08)_1px,transparent_1px)] bg-[length:54px_54px]" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#17201E]/30">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#17201E]/30" />
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#17201E]/30" />
            </div>
            <div className="absolute left-[42%] top-[31%] h-[26%] w-[18%] border-2 border-[#FF5A36] bg-[#FF5A36]/6">
              <div className="absolute -top-8 left-0 bg-[#FF5A36] px-2 py-1 font-mono text-xs font-bold text-white">OBJ / P-07 · TRACKING</div>
            </div>
            <div className="absolute left-4 top-4 border border-line bg-[#FAF9F5]/88 px-3 py-2 font-mono text-xs font-bold text-[#17201E]">
              SRC / mock://coastline-demo-stream · PRERECORDED
            </div>
            <div className="absolute right-4 top-4 border border-[#D92D20] bg-[#FAF9F5]/88 px-3 py-2 font-mono text-xs font-bold text-[#D92D20]">
              REC ● 18:42:31 / SEC AKT-07
            </div>
            {alert && (
              <div className="absolute inset-x-6 top-20 cut-corner border border-[#D92D20] bg-[#FAF9F5]/95 p-5 shadow-soft">
                <div className="flex items-center gap-3 text-[#D92D20]">
                  <ShieldAlert size={28} />
                  <div>
                    <div className="ops-label text-[#D92D20]">QUTQAR VISION ALERT</div>
                    <div className="text-2xl font-extrabold">Вероятность {confidence}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="telemetry-strip">
            <Telemetry label="ALT" value="79M" detail="BARO SIM" />
            <Telemetry label="SPD" value="8.6M/S" detail="GROUND" />
            <Telemetry label="HDG" value="187°" detail="TRUE" />
            <Telemetry label="BAT" value="84%" detail="Q-01" />
            <Telemetry label="LINK" value="98%" detail="MOCK DJI" />
            <Telemetry label="GPS" value="14 SAT" detail="READY" />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="ops-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="ops-label">QUTQAR VISION</div>
                <h2 className="font-extrabold">Distress Analysis</h2>
              </div>
              <span className="ops-label text-[#E7A928]">MOCK INFERENCE</span>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-sm font-bold"><span>Potential drowning</span><span>{confidence}%</span></div>
              <div className="mt-2 h-2 bg-[#E8E4D8]"><div className="h-2 bg-[#D92D20]" style={{ width: `${confidence}%` }} /></div>
              <div className="mt-4 flex justify-between text-sm font-bold text-muted"><span>Normal</span><span>{Math.max(0, 100 - confidence)}%</span></div>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {predictions.map((value) => (
                <div key={value} className="border border-line bg-[#F2F0E9] py-2 text-center font-mono text-sm font-bold">{value}%</div>
              ))}
            </div>
          </div>

          <div className="ops-panel p-4">
            <div className="ops-label">OPERATOR CONTROL</div>
            <h2 className="font-extrabold">Детерминированный сценарий</h2>
            <p className="mt-2 text-sm text-muted">{step}</p>
            <div className="mt-4 grid gap-2">
              <button className="btn btn-primary" disabled={busy} onClick={startDemo}><RefreshCw size={16} /> Запустить demo flow</button>
              <button className="btn btn-danger" disabled={!alert || busy} onClick={confirm}><AlertTriangle size={16} /> Подтвердить инцидент</button>
              <button className="btn" disabled={busy} onClick={runFullScenario}><CheckCircle2 size={16} /> Запустить сценарий</button>
              <button className="btn" disabled={!alert || busy || !detectionId} onClick={falseAlarm}><XCircle size={16} /> Ложная тревога</button>
            </div>
            {message && <p className="mt-3 rounded-2xl bg-[#eaf8f0] p-3 text-sm font-semibold text-[#067647]">{message}</p>}
          </div>

          <div className="ops-panel p-4 text-sm text-muted">
            <b className="text-ink">Честность данных:</b> видео, GPS и inference сейчас смоделированы. Подтверждение, инцидент, события и аналитика сохраняются в PostgreSQL.
          </div>
        </aside>
      </section>
    </div>
  );
}

function Telemetry({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="telemetry-cell">
      <div className="ops-label">{label}</div>
      <div className="telemetry-value">{value}</div>
      <div className="mono text-[10px] text-muted">{detail}</div>
    </div>
  );
}
