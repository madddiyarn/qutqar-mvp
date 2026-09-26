import { ArrowUpRight, CheckCircle2, LifeBuoy, MapPin, ShieldAlert, Waves } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { socket } from "../services/socket";
import type { RescueAssignment } from "../types/domain";

export function RescuePage() {
  const [assignment, setAssignment] = useState<RescueAssignment | null>(null);
  const [message, setMessage] = useState("Ожидание вызова");

  async function refresh() {
    const current = await api.currentRescue();
    setAssignment(current);
    setMessage(current ? "Новый вызов получен" : "Ожидание вызова");
  }

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    socket.on("rescue:dispatch", handler);
    socket.on("rescue:update", handler);
    socket.on("dashboard:update", handler);
    return () => {
      socket.off("rescue:dispatch", handler);
      socket.off("rescue:update", handler);
      socket.off("dashboard:update", handler);
    };
  }, []);

  async function action(type: "ACCEPT" | "ARRIVED" | "RESCUED") {
    if (!assignment) return;
    const updated = await api.rescueAction(assignment.id, type);
    setAssignment(updated.status === "COMPLETED" ? null : updated);
    setMessage(type === "ACCEPT" ? "Вызов принят" : type === "ARRIVED" ? "Прибытие отмечено" : "Спасение завершено");
  }

  const statusLabel: Record<string, string> = {
    SENT: "ОЖИДАЕТ ПРИНЯТИЯ",
    ACCEPTED: "ВЫЗОВ ПРИНЯТ",
    ARRIVED: "НА МЕСТЕ",
    COMPLETED: "ЗАВЕРШЕНО"
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] p-3">
      <section className="mx-auto flex min-h-[calc(100vh-24px)] max-w-md flex-col rounded-[28px] border border-line bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d92d20] text-white sm:h-12 sm:w-12"><LifeBuoy /></div>
            <div>
              <div className="text-xs font-extrabold text-muted">Boltzzmann</div>
              <h1 className="text-xl font-extrabold sm:text-2xl">WATER RESCUE</h1>
            </div>
          </div>
          <Waves className="text-[#0f87a8]" />
        </div>

        {assignment ? (
          <>
            <div className="mt-6 rounded-3xl bg-[#fff0ef] p-5 text-[#b42318]">
              <div className="flex items-center justify-between gap-2">
                <div className="mono text-sm font-bold">{assignment.incident.publicId}</div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-extrabold">CRITICAL</div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-extrabold"><ShieldAlert size={18} /> ЧЕЛОВЕК В ВОДЕ</div>
              <div className="mt-2 text-5xl font-extrabold leading-none">430 м</div>
              <div className="mt-2 flex items-center gap-2 font-bold"><ArrowUpRight /> Северо-запад</div>
              <div className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-sm font-extrabold">Sector 04 · береговая линия Актау</div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-3xl bg-[#f1f3f5] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-muted"><MapPin size={16} /> Координаты цели</div>
                <div className="mono mt-2 text-lg font-extrabold">{assignment.incident.latitude.toFixed(5)}, {assignment.incident.longitude.toFixed(5)}</div>
              </div>
              <div className="rounded-3xl bg-[#f1f3f5] p-4">
                <div className="text-sm font-bold text-muted">Статус</div>
                <div className="mt-2 text-lg font-extrabold">{statusLabel[assignment.status] ?? assignment.status}</div>
              </div>
            </div>
            <div className="mt-auto grid gap-3 pt-6">
              <button className="btn btn-primary min-h-14 text-base" onClick={() => action("ACCEPT")} disabled={assignment.status !== "SENT"}>ПРИНЯТЬ</button>
              <button className="btn min-h-14 text-base" onClick={() => action("ARRIVED")} disabled={assignment.status !== "ACCEPTED"}>ПРИБЫЛ</button>
              <button className="btn btn-danger min-h-14 text-base" onClick={() => action("RESCUED")} disabled={assignment.status !== "ARRIVED"}>СПАСЁН</button>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-4 text-[#12b76a]" size={42} />
              <h2 className="text-2xl font-extrabold">{message}</h2>
              <p className="mt-2 text-sm text-muted">После dispatch из командного центра вызов появится здесь.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
