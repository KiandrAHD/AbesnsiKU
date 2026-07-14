import { useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "../../components/admin/Badge";
import { EmptyState } from "../../components/admin/EmptyState";
import { StatCard } from "../../components/admin/StatCard";
import { db } from "../../firebase/config";
import { useCurrentAdmin } from "../../hooks/useCurrentAdmin";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { formatDate } from "../../utils/date";
import { getInitials, sortByCreatedAt } from "../../utils/adminData";

const filters = [
  { label: "Semua", value: "semua" },
  { label: "Menunggu", value: "menunggu" },
  { label: "Disetujui", value: "disetujui" },
  { label: "Ditolak", value: "ditolak" },
];

function IzinCuti() {
  const { profile } = useCurrentAdmin();
  const { data: leaveRequests } = useFirestoreCollection("leave_requests");
  const [filter, setFilter] = useState("semua");
  const [selected, setSelected] = useState(null);
  const sortedRequests = useMemo(() => sortByCreatedAt(leaveRequests), [leaveRequests]);
  const filteredRequests = sortedRequests.filter(
    (request) => filter === "semua" || request.status === filter
  );
  const activeDetail = selected || filteredRequests[0];
  const counts = {
    total: leaveRequests.length,
    menunggu: leaveRequests.filter((item) => item.status === "menunggu").length,
    disetujui: leaveRequests.filter((item) => item.status === "disetujui").length,
    ditolak: leaveRequests.filter((item) => item.status === "ditolak").length,
  };

  const updateRequestStatus = async (request, status) => {
    await updateDoc(doc(db, "leave_requests", request.id), {
      status,
      reviewedBy: profile?.nama || profile?.email || "Admin",
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setSelected((current) => (current?.id === request.id ? { ...current, status } : current));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Izin & Cuti</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Kelola pengajuan izin dan cuti karyawan
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard color="blue" title="Total Pengajuan" value={counts.total} />
        <StatCard color="amber" title="Menunggu" value={counts.menunggu} />
        <StatCard color="emerald" title="Disetujui" value={counts.disetujui} />
        <StatCard color="rose" title="Ditolak" value={counts.ditolak} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <section className="space-y-4">
          <div className="grid rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:grid-cols-4">
            {filters.map((item) => (
              <button
                className={`rounded-xl px-4 py-3 text-sm font-black ${
                  filter === item.value ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState
              title="Belum ada pengajuan"
              description="Pengajuan izin dan cuti akan tampil di sini."
            />
          ) : (
            filteredRequests.map((request) => (
              <button
                className={`block w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                  activeDetail?.id === request.id
                    ? "border-blue-600 ring-4 ring-blue-100"
                    : "border-slate-200 hover:border-blue-200"
                }`}
                key={request.id}
                type="button"
                onClick={() => setSelected(request)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">
                      {getInitials(request.userName)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-950">{request.userName || "-"}</h3>
                      <p className="text-sm font-semibold text-slate-500">
                        {request.division || "-"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={request.status}>{request.status || "menunggu"}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                  <Badge variant={request.type}>{request.type || "izin"}</Badge>
                  <span>{formatDate(request.startDate || request.createdAt)}</span>
                  {request.endDate && <span>- {formatDate(request.endDate)}</span>}
                </div>
                <p className="mt-3 text-sm text-slate-600">{request.reason || "-"}</p>
              </button>
            ))
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-950">Detail Pengajuan</h2>
          </div>
          {!activeDetail ? (
            <div className="p-5">
              <EmptyState
                title="Pilih pengajuan"
                description="Detail pengajuan akan ditampilkan setelah item dipilih."
              />
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">
                  {getInitials(activeDetail.userName)}
                </div>
                <div>
                  <h3 className="font-black text-slate-950">{activeDetail.userName || "-"}</h3>
                  <p className="text-sm font-semibold text-slate-500">
                    {activeDetail.division || "-"}
                  </p>
                </div>
              </div>

              {[
                ["Jenis", activeDetail.type || "-"],
                ["Tanggal", `${formatDate(activeDetail.startDate || activeDetail.createdAt)}${activeDetail.endDate ? ` - ${formatDate(activeDetail.endDate)}` : ""}`],
                ["Alasan", activeDetail.reason || "-"],
                ["Status", activeDetail.status || "menunggu"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
                </div>
              ))}

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"
                type="button"
                onClick={() => updateRequestStatus(activeDetail, "disetujui")}
              >
                <CheckCircle2 size={17} />
                Setujui Pengajuan
              </button>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 hover:bg-rose-100"
                type="button"
                onClick={() => updateRequestStatus(activeDetail, "ditolak")}
              >
                <XCircle size={17} />
                Tolak Pengajuan
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default IzinCuti;
