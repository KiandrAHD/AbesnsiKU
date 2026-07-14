import {
  CalendarClock,
  Clock3,
  ExternalLink,
  UsersRound,
  UserX,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../../components/admin/Badge";
import { ChartCard } from "../../components/admin/ChartCard";
import { DataTable } from "../../components/admin/DataTable";
import { EmptyState } from "../../components/admin/EmptyState";
import { StatCard } from "../../components/admin/StatCard";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import {
  buildDashboardStats,
  buildMonthlyAttendance,
  getAttendanceDateKey,
  sortByCreatedAt,
} from "../../utils/adminData";
import { formatDateLong, formatTime } from "../../utils/date";
import ErrorState from "../../components/common/ErrorState";

function Dashboard() {
  const { data: users, error: usersError } = useFirestoreCollection("users");
  const { data: attendance, error: attendanceError } = useFirestoreCollection("attendance");
  const { data: leaveRequests, error: leaveError } = useFirestoreCollection("leave_requests");
  const dataError = usersError || attendanceError || leaveError;
  const stats = buildDashboardStats(users, attendance, leaveRequests);
  const chartData = buildMonthlyAttendance(attendance, leaveRequests);
  const recentActivities = sortByCreatedAt([
    ...attendance.map((item) => ({ ...item, activityType: "attendance" })),
    ...leaveRequests.map((item) => ({ ...item, activityType: "leave" })),
  ]).slice(0, 6);
  const todayRows = attendance
    .filter((item) => getAttendanceDateKey(item) === new Date().toISOString().slice(0, 10))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {dataError && <ErrorState message={dataError} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Dashboard Admin</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatDateLong(new Date())} - Ringkasan kehadiran hari ini
          </p>
        </div>
        <Badge variant="aktif">Sesi Aktif</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          color="blue"
          icon={UsersRound}
          note="Karyawan terdaftar"
          title="Total Karyawan"
          value={stats.totalEmployees}
        />
        <StatCard
          color="emerald"
          icon={UsersRound}
          note="Hadir hari ini"
          title="Hadir Hari Ini"
          value={stats.presentToday}
        />
        <StatCard
          color="amber"
          icon={Clock3}
          note="Check-in melewati batas"
          title="Terlambat"
          value={stats.lateToday}
        />
        <StatCard
          color="violet"
          icon={UserX}
          note="Izin dan cuti aktif"
          title="Izin & Cuti"
          value={stats.leaveToday}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <ChartCard title="Grafik Kehadiran Bulanan" subtitle="Data aktual dari Firestore">
          {attendance.length === 0 && leaveRequests.length === 0 ? (
            <EmptyState
              title="Belum ada data grafik"
              description="Grafik akan tampil setelah collection attendance atau leave_requests berisi data."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="hadirFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area
                    dataKey="hadir"
                    fill="url(#hadirFill)"
                    stroke="#2563eb"
                    strokeWidth={3}
                    type="monotone"
                  />
                  <Line dataKey="terlambat" stroke="#f59e0b" strokeWidth={2} type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950">Aktivitas Terbaru</h2>
            <a className="text-xs font-black text-blue-600" href="/admin/rekap-absensi">
              Lihat Semua
            </a>
          </div>
          {recentActivities.length === 0 ? (
            <EmptyState
              title="Belum ada aktivitas"
              description="Aktivitas absensi dan pengajuan akan muncul di sini."
            />
          ) : (
            <div className="space-y-4">
              {recentActivities.map((item) => (
                <div className="flex items-start gap-3" key={`${item.activityType}-${item.id}`}>
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <CalendarClock size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-800">
                      {item?.userName || item?.nama || "User"}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {item?.activityType === "leave"
                        ? `Pengajuan ${item?.type || "izin"}`
                        : `Check-in ${item?.status || "hadir"}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Kehadiran Hari Ini</h2>
            <p className="text-sm text-slate-500">Data real-time dari collection attendance</p>
          </div>
          <a
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-600/20"
            href="/admin/rekap-absensi"
          >
            <ExternalLink size={16} />
            Lihat Semua
          </a>
        </div>
        <DataTable
          columns={[
            { key: "userName", header: "Karyawan", render: (row) => row?.userName || "-" },
            { key: "division", header: "Divisi", render: (row) => row?.division || "-" },
            { key: "checkIn", header: "Jam Masuk", render: (row) => formatTime(row?.checkIn) },
            { key: "checkOut", header: "Jam Keluar", render: (row) => formatTime(row?.checkOut) },
            { key: "status", header: "Status", render: (row) => <Badge variant={row?.status}>{row?.status || "-"}</Badge> },
          ]}
          emptyDescription="Belum ada check-in hari ini."
          emptyTitle="Belum ada kehadiran hari ini"
          rows={todayRows}
        />
      </section>
    </div>
  );
}

export default Dashboard;
