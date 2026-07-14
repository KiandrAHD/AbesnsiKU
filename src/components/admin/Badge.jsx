const variants = {
  aktif: "bg-emerald-50 text-emerald-700",
  nonaktif: "bg-rose-50 text-rose-700",
  hadir: "bg-emerald-50 text-emerald-700",
  terlambat: "bg-amber-50 text-amber-700",
  izin: "bg-blue-50 text-blue-700",
  cuti: "bg-violet-50 text-violet-700",
  menunggu: "bg-amber-50 text-amber-700",
  disetujui: "bg-emerald-50 text-emerald-700",
  ditolak: "bg-rose-50 text-rose-700",
  kadaluarsa: "bg-slate-100 text-slate-600",
  default: "bg-blue-50 text-blue-700",
};

export function Badge({ children, variant = "default" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
        variants[String(variant).toLowerCase()] || variants.default
      }`}
    >
      {children}
    </span>
  );
}
