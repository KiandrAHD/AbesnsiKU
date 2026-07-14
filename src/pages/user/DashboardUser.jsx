import { Link, useOutletContext } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FilePenLine,
  QrCode,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { formatDateLong, formatMonthYear, getMonthKey } from "../../utils/date";
import {
  buildAttendanceLineData,
  buildEmployeeMonthlyStats,
  buildWorkHourWeeks,
  formatTime,
  getEmployeeMeta,
  getTodayAttendance,
} from "../../utils/employeeData";

function StatPanel({ icon: Icon, color, value, title, note }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}
      >
        <Icon size={20} />
      </div>
      <strong className="block text-2xl font-black leading-none text-slate-950">{value}</strong>
      <p className="mt-2 text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{note}</p>
    </article>
  );
}

function QuickAction({ to, icon: Icon, title, note, primary }) {
  return (
    <Link
      className={`flex items-center gap-4 rounded-2xl border p-5 shadow-sm transition ${
        primary
          ? "border-blue-600 bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700"
          : "border-slate-200 bg-white text-slate-900 hover:border-blue-200"
      }`}
      to={to}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          primary ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-black">{title}</h3>
        <p className={`text-sm font-semibold ${primary ? "text-blue-100" : "text-slate-500"}`}>
          {note}
        </p>
      </div>
    </Link>
  );
}

function DashboardUser() {
  const { profile } = useOutletContext();
  const { data: attendance } = useFirestoreCollection("attendance");
  const { data: leaveRequests } = useFirestoreCollection("leave_requests");
  const meta = getEmployeeMeta(profile);
  const monthKey = getMonthKey();
  const todayAttendance = getTodayAttendance(attendance, profile);
  const monthlyStats = buildEmployeeMonthlyStats(attendance, leaveRequests, profile, monthKey);
  const lineData = buildAttendanceLineData(attendance, profile);
  const workWeeks = buildWorkHourWeeks(attendance, profile, monthKey);
  const totalWorkHours = Math.round(monthlyStats.workMinutes / 60);
  const statusLabel = todayAttendance?.status === "terlambat" ? "Terlambat" : todayAttendance ? "On-time" : "Belum Absen";
  const maxWeekMinutes = Math.max(...workWeeks.map((week) => week.minutes), 1);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-600/20">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute bottom-3 right-20 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-semibold text-blue-100">Selamat Datang kembali,</p>
          <h1 className="mt-1 text-3xl font-black">{meta.name}</h1>
          <p className="mt-1 text-sm font-semibold text-blue-100">
            {meta.position} - {meta.division}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-black">
              Check-in: {formatTime(todayAttendance?.checkIn)}
            </span>
            <span className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-black">
              {formatDateLong(new Date())}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatPanel
          color="bg-emerald-50 text-emerald-600"
          icon={CheckCircle2}
          note={todayAttendance ? "Hari ini" : "Belum ada data hari ini"}
          title="Check In"
          value={formatTime(todayAttendance?.checkIn)}
        />
        <StatPanel
          color="bg-amber-50 text-amber-600"
          icon={Clock3}
          note={todayAttendance?.checkOut ? "Selesai kerja" : "Sesi aktif"}
          title="Check Out"
          value={formatTime(todayAttendance?.checkOut)}
        />
        <StatPanel
          color="bg-blue-50 text-blue-600"
          icon={TrendingUp}
          note={`Bulan ${formatMonthYear(monthKey)}`}
          title="Kehadiran"
          value={`${monthlyStats.attendanceRate}%`}
        />
        <StatPanel
          color="bg-violet-50 text-violet-600"
          icon={CalendarClock}
          note={todayAttendance?.status || "Menunggu scan"}
          title="Status Kehadiran"
          value={statusLabel}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <QuickAction
          primary
          icon={QrCode}
          note="Check-in / Check-out sekarang"
          title="Scan QR Absensi"
          to="/user/scan-qr"
        />
        <QuickAction
          icon={Clock3}
          note="Lihat catatan kehadiran"
          title="Riwayat Absensi"
          to="/user/riwayat-absensi"
        />
        <QuickAction
          icon={FilePenLine}
          note="Izin sakit, cuti, dll."
          title="Ajukan Izin"
          to="/user/izin-cuti"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Kehadiran Bulanan</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Tren kehadiran Anda {new Date().getFullYear()}
          </p>
          <div className="mt-5 h-64">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis axisLine={false} dataKey="month" tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line
                  dataKey="hadir"
                  dot={{ r: 4, fill: "#2563eb" }}
                  stroke="#2563eb"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Jam Kerja Bulanan</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Total jam kerja per minggu - {formatMonthYear(monthKey)}
          </p>
          <div className="mt-6 space-y-5">
            {workWeeks.map((week) => (
              <div className="grid grid-cols-[52px_minmax(0,1fr)_72px] items-center gap-3" key={week.week}>
                <span className="text-sm font-bold text-slate-500">{week.week}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.max(8, (week.minutes / maxWeekMinutes) * 100)}%` }}
                  />
                </div>
                <span className="text-right text-sm font-black text-slate-800">
                  {Math.round(week.minutes / 60)} jam
                </span>
              </div>
            ))}
            {workWeeks.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Belum ada jam kerja yang tercatat bulan ini.
              </p>
            )}
            <div className="flex items-center justify-between rounded-2xl bg-blue-100 px-4 py-3 text-sm font-black text-blue-700">
              <span>Total bulan ini</span>
              <span>{totalWorkHours} jam</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardUser;
