import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarDays, Download, FileText } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "../../components/admin/Badge";
import { DataTable } from "../../components/admin/DataTable";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { formatDate, formatMonthYear, getMonthKey, toDate } from "../../utils/date";
import { exportRowsToExcel, exportRowsToPdf } from "../../utils/export";
import {
  buildCalendarDays,
  buildEmployeeMonthlyStats,
  buildHistoryRows,
  formatDuration,
  formatTime,
  getAttendanceStatusLabel,
} from "../../utils/employeeData";

const statusColors = {
  hadir: "bg-emerald-50 text-emerald-600",
  terlambat: "bg-amber-50 text-amber-600",
  izin: "bg-blue-50 text-blue-600",
  cuti: "bg-violet-50 text-violet-600",
  libur: "bg-slate-50 text-slate-400",
  selected: "bg-blue-600 text-white",
};

const chartColors = {
  Hadir: "#10b981",
  Terlambat: "#f59e0b",
  Izin: "#3b82f6",
  Cuti: "#8b5cf6",
};

function SummaryCard({ value, label, color }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <strong className={`block text-3xl font-black ${color}`}>{value}</strong>
      <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
    </article>
  );
}

function RiwayatAbsensi() {
  const { profile } = useOutletContext();
  const { data: attendance } = useFirestoreCollection("attendance");
  const { data: leaveRequests } = useFirestoreCollection("leave_requests");
  const [monthKey, setMonthKey] = useState(getMonthKey());
  const stats = buildEmployeeMonthlyStats(attendance, leaveRequests, profile, monthKey);
  const historyRows = buildHistoryRows(attendance, leaveRequests, profile, monthKey);
  const calendarDays = buildCalendarDays(attendance, leaveRequests, profile, monthKey);
  const todayKey = getMonthKey() === monthKey ? new Date().getDate() : null;
  const chartData = useMemo(
    () => [
      { name: "Hadir", value: stats.hadir },
      { name: "Terlambat", value: stats.terlambat },
      { name: "Izin", value: stats.izin },
      { name: "Cuti", value: stats.cuti },
    ].filter((item) => item.value > 0),
    [stats]
  );

  const exportRows = historyRows.map((row) => ({
    Tanggal: formatDate(row.date),
    Hari: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(toDate(row.date)),
    "Jam Masuk": formatTime(row.checkIn),
    "Jam Keluar": formatTime(row.checkOut),
    Durasi: formatDuration(row.duration),
    Status: getAttendanceStatusLabel(row.status),
  }));

  const handleExportPdf = () => {
    exportRowsToPdf({
      title: `Riwayat Absensi ${formatMonthYear(monthKey)}`,
      columns: ["Tanggal", "Hari", "Jam Masuk", "Jam Keluar", "Durasi", "Status"],
      rows: exportRows.map(Object.values),
      fileName: `riwayat-absensi-${monthKey}.pdf`,
    });
  };

  const handleExportExcel = () => {
    exportRowsToExcel({
      sheetName: "Riwayat Absensi",
      rows: exportRows,
      fileName: `riwayat-absensi-${monthKey}.xlsx`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-slate-950">Riwayat Absensi</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Rekap kehadiran Anda - {formatMonthYear(monthKey)}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:w-auto lg:justify-end">
          <input
            className="col-span-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:col-span-1 sm:w-auto"
            type="month"
            value={monthKey}
            onChange={(event) => setMonthKey(event.target.value)}
          />
          <button
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-rose-600 hover:bg-slate-50"
            type="button"
            onClick={handleExportPdf}
          >
            <FileText size={17} />
            PDF
          </button>
          <button
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
            type="button"
            onClick={handleExportExcel}
          >
            <Download size={17} />
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard color="text-emerald-600" label="Hari Hadir" value={stats.hadir} />
        <SummaryCard color="text-amber-500" label="Terlambat" value={stats.terlambat} />
        <SummaryCard color="text-blue-600" label="Izin" value={stats.izin} />
        <SummaryCard color="text-violet-600" label="Cuti" value={stats.cuti} />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.9fr)]">
        <div className="min-w-0 space-y-5">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">Kalender Absensi</h2>
              <CalendarDays className="text-blue-600" size={20} />
            </div>
            <div className="grid min-w-0 grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-500 sm:gap-2 sm:text-sm">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <span className="py-2" key={day}>{day}</span>
              ))}
              {calendarDays.map((day) => (
                <div
                  className={`flex aspect-square min-w-0 items-center justify-center rounded-lg text-[11px] font-black sm:rounded-xl sm:text-sm ${
                    day.blank
                      ? ""
                      : day.day === todayKey
                        ? statusColors.selected
                        : statusColors[day.status] || "text-slate-500"
                  }`}
                  key={day.id}
                >
                  {!day.blank && day.day}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
              {[
                ["bg-emerald-500", "Hadir"],
                ["bg-amber-500", "Terlambat"],
                ["bg-blue-500", "Izin"],
                ["bg-violet-500", "Cuti"],
              ].map(([color, label]) => (
                <span className="inline-flex items-center gap-1.5" key={label}>
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">Statistik Kehadiran</h2>
              <span className="text-2xl font-black text-blue-600">{stats.attendanceRate}%</span>
            </div>
            <p className="text-sm font-semibold text-slate-500">Tingkat kehadiran</p>
            <div className="mt-4 h-64">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-500">
                  Belum ada data statistik.
                </div>
              ) : (
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={4}>
                      {chartData.map((entry) => (
                        <Cell fill={chartColors[entry.name]} key={entry.name} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-slate-500">
              {chartData.map((entry) => (
                <span className="inline-flex items-center gap-1.5" key={entry.name}>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: chartColors[entry.name] }}
                  />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </section>
        </div>

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-b-0 border-slate-200 bg-white px-4 py-4 sm:px-5">
            <h2 className="text-lg font-black text-slate-950">Detail Kehadiran</h2>
            <Badge variant="default">{stats.attendanceRate}% Kehadiran</Badge>
          </div>
          <DataTable
            columns={[
              { key: "date", header: "Tanggal", render: (row) => formatDate(row.date) },
              {
                key: "day",
                header: "Hari",
                render: (row) =>
                  new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(toDate(row.date)),
              },
              { key: "checkIn", header: "Jam Masuk", render: (row) => formatTime(row.checkIn) },
              { key: "checkOut", header: "Jam Keluar", render: (row) => formatTime(row.checkOut) },
              { key: "duration", header: "Durasi", render: (row) => formatDuration(row.duration) },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge variant={row.status}>{getAttendanceStatusLabel(row.status)}</Badge>
                ),
              },
            ]}
            emptyDescription="Riwayat akan muncul setelah Anda melakukan absensi atau mengajukan izin."
            emptyTitle="Belum ada riwayat absensi"
            rows={historyRows}
          />
        </section>
      </div>
    </div>
  );
}

export default RiwayatAbsensi;
