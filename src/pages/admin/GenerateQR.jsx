import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { Download, Plus, QrCode, RefreshCw } from "lucide-react";
import { Badge } from "../../components/admin/Badge";
import { DataTable } from "../../components/admin/DataTable";
import { EmptyState } from "../../components/admin/EmptyState";
import { StatCard } from "../../components/admin/StatCard";
import { db } from "../../firebase/config";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { formatDate } from "../../utils/date";
import { buildNextQrId, createQrDataUrl, downloadDataUrl } from "../../utils/qr";

const defaultSession = {
  sessionName: "Sesi Absensi Pagi",
  startTime: "07:00",
  endTime: "09:00",
  durationMinutes: 20,
  lateLimit: "09:00",
};

function GenerateQR() {
  const { data: sessions } = useFirestoreCollection("qr_sessions");
  const [form, setForm] = useState(defaultSession);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
      ),
    [sessions]
  );
  const activeSession =
    sortedSessions.find((session) => session.status === "aktif") || sortedSessions[0];

  useEffect(() => {
    if (!activeSession) {
      setQrDataUrl("");
      return;
    }

    createQrDataUrl({
      qrId: activeSession.qrId,
      sessionId: activeSession.id,
      sessionName: activeSession.sessionName,
    }).then(setQrDataUrl);
  }, [activeSession]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateSession = async () => {
    const now = new Date();
    const qrId = buildNextQrId(sessions, now);
    const expiresAt = new Date(now.getTime() + Number(form.durationMinutes) * 60 * 1000);

    await Promise.all(
      sessions
        .filter((session) => session.status === "aktif")
        .map((session) =>
          updateDoc(doc(db, "qr_sessions", session.id), {
            status: "kadaluarsa",
            updatedAt: serverTimestamp(),
          })
        )
    );

    await addDoc(collection(db, "qr_sessions"), {
      ...form,
      qrId,
      durationMinutes: Number(form.durationMinutes),
      totalScans: 0,
      successfulScans: 0,
      status: "aktif",
      createdAt: serverTimestamp(),
      expiresAt,
    });
  };

  const handleDownload = () => {
    if (!qrDataUrl || !activeSession) return;
    downloadDataUrl(qrDataUrl, `${activeSession.qrId}.png`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Generate QR Absensi</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Buat kode QR untuk sesi absensi karyawan
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">QR Code Aktif</h2>
            {activeSession && <Badge variant={activeSession.status}>{activeSession.status}</Badge>}
          </div>
          {!activeSession ? (
            <EmptyState
              title="Belum ada QR aktif"
              description="Buat sesi baru untuk menghasilkan QR absensi."
            />
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="rounded-2xl bg-slate-50 p-4">
                {qrDataUrl && <img alt={`QR ${activeSession.qrId}`} className="h-64 w-64" src={qrDataUrl} />}
              </div>
              <h3 className="mt-5 text-base font-black text-slate-900">
                {activeSession.sessionName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {formatDate(activeSession.createdAt)} - {activeSession.startTime}
                -{activeSession.endTime}
              </p>
              <p className="text-sm font-semibold text-slate-500">ID: {activeSession.qrId}</p>
              <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
                  type="button"
                  onClick={handleCreateSession}
                >
                  <RefreshCw size={17} />
                  Buat QR Baru
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  type="button"
                  onClick={handleDownload}
                >
                  <Download size={17} />
                  Unduh QR
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-black text-slate-950">Pengaturan Sesi</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-slate-700 md:col-span-2">
                <span>Nama Sesi</span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={form.sessionName}
                  onChange={(event) => updateForm("sessionName", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-bold text-slate-700">
                <span>Jam Mulai</span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => updateForm("startTime", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-bold text-slate-700">
                <span>Jam Selesai</span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => updateForm("endTime", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-bold text-slate-700">
                <span>Durasi Berlaku</span>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={form.durationMinutes}
                  onChange={(event) => updateForm("durationMinutes", event.target.value)}
                >
                  <option value="10">10 Menit</option>
                  <option value="20">20 Menit</option>
                  <option value="30">30 Menit</option>
                  <option value="60">60 Menit</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold text-slate-700">
                <span>Batas Terlambat</span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  type="time"
                  value={form.lateLimit}
                  onChange={(event) => updateForm("lateLimit", event.target.value)}
                />
              </label>
            </div>
            <button
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
              type="button"
              onClick={handleCreateSession}
            >
              <Plus size={17} />
              Buat Sesi Baru
            </button>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              color="blue"
              icon={QrCode}
              note="Total Scan Hari Ini"
              title="Total Scan"
              value={activeSession?.totalScans || 0}
            />
            <StatCard
              color="emerald"
              icon={QrCode}
              note="Scan berhasil"
              title="Berhasil"
              value={activeSession?.successfulScans || 0}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "qrId", header: "ID QR" },
          { key: "createdAt", header: "Tanggal", render: (row) => formatDate(row.createdAt) },
          {
            key: "sessionName",
            header: "Sesi",
            render: (row) => `${row.sessionName || "-"} (${row.startTime || "-"}-${row.endTime || "-"})`,
          },
          { key: "totalScans", header: "Total Scan", render: (row) => `${row.totalScans || 0} scan` },
          { key: "status", header: "Status", render: (row) => <Badge variant={row.status}>{row.status || "-"}</Badge> },
        ]}
        emptyDescription="Riwayat QR akan muncul setelah sesi pertama dibuat."
        emptyTitle="Belum ada riwayat QR"
        rows={sortedSessions}
      />
    </div>
  );
}

export default GenerateQR;
