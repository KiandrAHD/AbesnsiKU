import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../../components/admin/Badge";
import { ChartCard } from "../../components/admin/ChartCard";
import { DataTable } from "../../components/admin/DataTable";
import { EmptyState } from "../../components/admin/EmptyState";
import { db } from "../../firebase/config";
import { useCurrentAdmin } from "../../hooks/useCurrentAdmin";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { buildMonthlyAttendance } from "../../utils/adminData";
import { formatDate, formatMonthYear, formatTime, getMonthKey } from "../../utils/date";
import { exportRowsToExcel, exportRowsToPdf } from "../../utils/export";

function Laporan() {
  const { profile } = useCurrentAdmin();
  const { data: attendance } = useFirestoreCollection("attendance");
  const { data: leaveRequests } = useFirestoreCollection("leave_requests");
  const { data: reports } = useFirestoreCollection("reports");
  const [filters, setFilters] = useState({
    period: getMonthKey(),
    division: "Semua Divisi",
    statusFilter: "Semua Status",
    format: "PDF",
  });
  const chartData = buildMonthlyAttendance(attendance, leaveRequests);
  const divisions = useMemo(
    () => [
      "Semua Divisi",
      ...new Set(
        [...attendance.map((item) => item.division), ...leaveRequests.map((item) => item.division)]
          .filter(Boolean)
      ),
    ],
    [attendance, leaveRequests]
  );
  const filteredAttendance = attendance.filter((item) => {
    const matchesPeriod = !filters.period || getMonthKey(item.date || item.createdAt) === filters.period;
    const matchesDivision =
      filters.division === "Semua Divisi" || item.division === filters.division;
    const matchesStatus =
      filters.statusFilter === "Semua Status" || item.status === filters.statusFilter;

    return matchesPeriod && matchesDivision && matchesStatus;
  });
  const exportRows = filteredAttendance.map((item) => ({
    Karyawan: item.userName || "-",
    Divisi: item.division || "-",
    Tanggal: item.date || formatDate(item.createdAt),
    Masuk: formatTime(item.checkIn),
    Keluar: formatTime(item.checkOut),
    Status: item.status || "-",
  }));

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const exportPdf = () => {
    exportRowsToPdf({
      title: `Laporan Absensi ${formatMonthYear(filters.period)}`,
      columns: ["Karyawan", "Divisi", "Tanggal", "Masuk", "Keluar", "Status"],
      rows: exportRows.map(Object.values),
      fileName: `laporan-absensi-${filters.period}.pdf`,
    });
  };

  const exportExcel = () => {
    exportRowsToExcel({
      sheetName: "Laporan Absensi",
      rows: exportRows,
      fileName: `laporan-absensi-${filters.period}.xlsx`,
    });
  };

  const handleGenerateReport = async () => {
    if (filters.format === "PDF") {
      exportPdf();
    } else {
      exportExcel();
    }

    await addDoc(collection(db, "reports"), {
      title: `Rekap Kehadiran ${formatMonthYear(filters.period)}`,
      period: filters.period,
      division: filters.division,
      statusFilter: filters.statusFilter,
      format: filters.format,
      fileType: filters.format.toLowerCase(),
      fileSize: `${Math.max(1, Math.ceil(exportRows.length * 0.08))} MB`,
      createdBy: profile?.nama || profile?.email || "Admin",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Laporan</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Unduh dan kelola laporan absensi perusahaan
        </p>
      </div>

      <section className="rounded-2xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-600/20">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">Buat Laporan Baru</h2>
            <p className="mt-1 text-sm font-semibold text-blue-100">
              Generate laporan absensi untuk periode tertentu
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-black hover:bg-white/20"
              type="button"
              onClick={exportPdf}
            >
              <FileText size={17} />
              Export PDF
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-blue-600"
              type="button"
              onClick={exportExcel}
            >
              <FileSpreadsheet size={17} />
              Export Excel
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-bold text-blue-100">
            <span>Pilih Bulan</span>
            <input
              className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white outline-none"
              type="month"
              value={filters.period}
              onChange={(event) => updateFilter("period", event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-bold text-blue-100">
            <span>Pilih Divisi</span>
            <select
              className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white outline-none"
              value={filters.division}
              onChange={(event) => updateFilter("division", event.target.value)}
            >
              {divisions.map((division) => (
                <option className="text-slate-900" key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-bold text-blue-100">
            <span>Pilih Status</span>
            <select
              className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white outline-none"
              value={filters.statusFilter}
              onChange={(event) => updateFilter("statusFilter", event.target.value)}
            >
              {["Semua Status", "hadir", "terlambat"].map((status) => (
                <option className="text-slate-900" key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-bold text-blue-100">
            <span>Format</span>
            <select
              className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white outline-none"
              value={filters.format}
              onChange={(event) => updateFilter("format", event.target.value)}
            >
              <option className="text-slate-900" value="PDF">PDF</option>
              <option className="text-slate-900" value="Excel">Excel</option>
            </select>
          </label>
        </div>
        <button
          className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-600"
          type="button"
          onClick={handleGenerateReport}
        >
          Generate Report
        </button>
      </section>

      <ChartCard title="Grafik Kehadiran Tahunan" subtitle="Data attendance dan leave_requests">
        {attendance.length === 0 && leaveRequests.length === 0 ? (
          <EmptyState
            title="Belum ada data laporan"
            description="Grafik laporan akan tampil setelah collection terisi."
          />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hadir" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="terlambat" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="izin" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cuti" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <DataTable
        columns={[
          { key: "title", header: "Laporan" },
          { key: "period", header: "Periode", render: (row) => row.period || "-" },
          { key: "createdAt", header: "Dibuat", render: (row) => formatDate(row.createdAt) },
          { key: "fileType", header: "Format", render: (row) => <Badge variant={row.fileType}>{row.fileType || row.format || "-"}</Badge> },
          { key: "fileSize", header: "Ukuran", render: (row) => row.fileSize || "-" },
          {
            key: "download",
            header: "Aksi",
            render: () => (
              <button className="rounded-xl bg-blue-50 p-2 text-blue-600" type="button">
                <Download size={16} />
              </button>
            ),
          },
        ]}
        emptyDescription="Riwayat laporan akan muncul setelah laporan pertama dibuat."
        emptyTitle="Belum ada riwayat laporan"
        rows={reports}
      />
    </div>
  );
}

export default Laporan;
