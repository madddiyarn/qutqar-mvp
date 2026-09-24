import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red";
}

const tones = {
  blue: "bg-[#E6EFEC] text-[#087F73]",
  green: "bg-[#E8F2EA] text-[#087F73]",
  amber: "bg-[#F6EBCB] text-[#9C6C00]",
  red: "bg-[#F7DED9] text-[#D92D20]"
};

export function StatCard({ label, value, detail, icon: Icon, tone = "blue" }: StatCardProps) {
  return (
    <section className="ops-panel fade-up p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="ops-label">{label}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center cut-corner ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{detail}</p>
    </section>
  );
}
