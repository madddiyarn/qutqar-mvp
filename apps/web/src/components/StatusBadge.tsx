export function StatusBadge({ value }: { value: string }) {
  const color = value.includes("CRITICAL") || value.includes("NEW") || value.includes("CONFIRMED")
    ? "border-[#D92D20]/35 bg-[#F7DED9] text-[#D92D20]"
    : value.includes("RESOLVED") || value.includes("ONLINE") || value.includes("AVAILABLE")
      ? "border-[#087F73]/35 bg-[#E8F2EA] text-[#087F73]"
      : value.includes("DISPATCHED") || value.includes("CHARGING")
        ? "border-[#E7A928]/45 bg-[#F6EBCB] text-[#9C6C00]"
        : "border-line bg-[#F2F0E9] text-[#69736F]";
  return <span className={`mono border px-2 py-1 text-[10px] font-extrabold ${color}`}>{value}</span>;
}
