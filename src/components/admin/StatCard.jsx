export function StatCard({ title, value, note, icon: Icon, color = "blue", trend }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            colors[color] || colors.blue
          }`}
        >
          {Icon && <Icon size={21} />}
        </div>
        {trend && <span className="text-xs font-bold text-emerald-500">{trend}</span>}
      </div>
      <strong className="mt-5 block text-3xl font-black leading-none text-slate-950">
        {value}
      </strong>
      <p className="mt-2 text-sm font-bold text-slate-700">{title}</p>
      {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
    </article>
  );
}
