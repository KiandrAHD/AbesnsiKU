import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
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
import { ChartCard } from "../../components/admin/ChartCard";
import { DataTable } from "../../components/admin/DataTable";
import { EmptyState } from "../../components/admin/EmptyState";
import { StatCard } from "../../components/admin/StatCard";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { buildEmployeeRecap, buildMonthlyAttendance } from "../../utils/adminData";
import { exportRowsToExcel, exportRowsToPdf } from "../../utils/export";
import { formatMonthYear, getMonthKey } from "../../utils/date";

function RekapAbsensi() {
  const { data: users } = useFirestoreCollection("users");
  const { data: attendance } = useFirestoreCollection("attendance");
  const { data: leaveRequests } = useFirestoreCollection("leave_requests");
  const [monthKey, setMonthKey] = useState(getMonthKey());
  const [search, setSearch] = useState("");

  const recapRows = useMemo(
    () =>
      buildEmployeeRecap(users, attendance, leaveRequests, monthKey).filter((row) =>
        (row?.user?.nama || row?.user?.email || "").toLowerCase().includes(search.toLowerCase())
      ),
    [users, attendance, leaveRequests, monthKey, search]
  );
  const chartData = buildMonthlyAttendance(attendance, leaveRequests);
  const totals = recapRows.reduce(
    (result, row) => ({
      hadir: result.hadir + row.hadir,
      terlambat: result.terlambat + row.terlambat,
      izin: result.izin + row.izin,
      cuti: result.cuti + row.cuti,
    }),
    { hadir: 0, terlambat: 0, izin: 0, cuti: 0 }
  );

  const exportRows = recapRows.map((row) => ({
    Karyawan: row?.user?.nama || row?.user?.email || "-",
    Divisi: row?.user?.divisi || "-",
    Hadir: row.hadir,
    Terlambat: row.terlambat,
    Izin: row.izin,
    Cuti: row.cuti,
    Kehadiran: `${row.attendanceRate}%`,
  }));

  const handleExportPdf = () => {
    exportRowsToPdf({
      title: `Rekap Absensi ${formatMonthYear(monthKey)}`,
      columns: ["Karyawan", "Divisi", "Hadir", "Terlambat", "Izin", "Cuti", "% Kehadiran"],
      rows: exportRows.map(Object.values),
      fileName: `rekap-absensi-${monthKey}.pdf`,
    });
  };

  const handleExportExcel = () => {
    exportRowsToExcel({
      sheetName: "Rekap Absensi",
      rows: exportRows,
      fileName: `rekap-absensi-${monthKey}.xlsx`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Rekap Absensi</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Laporan kehadiran karyawan - {formatMonthYear(monthKey)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-rose-600 hover:bg-slate-50"
            type="button"
            onClick={handleExportPdf}
          >
            <FileText size={17} />
            Export PDF
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"
            type="button"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet size={17} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard color="emerald" note="Total Hadir" title="Hadir" value={totals.hadir} />
        <StatCard color="amber" note="Total Terlambat" title="Terlambat" value={totals.terlambat} />
        <StatCard color="blue" note="Total Izin" title="Izin" value={totals.izin} />
        <StatCard color="violet" note="Total Cuti" title="Cuti" value={totals.cuti} />
      </div>

      <ChartCard
        action={
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            type="month"
            value={monthKey}
            onChange={(event) => setMonthKey(event.target.value)}
          />
        }
        subtitle="Perbandingan status kehadiran per bulan"
        title="Grafik Absensi Bulanan"
      >
        {attendance.length === 0 && leaveRequests.length === 0 ? (
          <EmptyState
            title="Belum ada data absensi"
            description="Grafik rekap akan tampil setelah ada attendance atau leave_requests."
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

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">Detail Rekap</h2>
          <input
            className="h-11 w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Cari karyawan..."
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <DataTable
          columns={[
            { key: "karyawan", header: "Karyawan", render: (row) => row?.user?.nama || row?.user?.email || "-" },
            { key: "divisi", header: "Divisi", render: (row) => row?.user?.divisi || "-" },
            { key: "hadir", header: "Hadir" },
            { key: "terlambat", header: "Terlambat" },
            { key: "izin", header: "Izin" },
            { key: "cuti", header: "Cuti" },
            {
              key: "attendanceRate",
              header: "% Kehadiran",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${row.attendanceRate}%` }}
                    />
                  </div>
                  <span className="font-black text-emerald-600">{row.attendanceRate}%</span>
                </div>
              ),
            },
          ]}
          emptyDescription="Detail rekap muncul setelah data karyawan dan absensi tersedia."
          emptyTitle="Belum ada rekap absensi"
          rows={recapRows}
        />
      </section>
    </div>
  );
}

export default RekapAbsensi;
