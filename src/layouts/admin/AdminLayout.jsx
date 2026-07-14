import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  QrCode,
  Search,
  UsersRound,
} from "lucide-react";
import { auth } from "../../firebase/config";
import { useCurrentAdmin } from "../../hooks/useCurrentAdmin";
import { getInitials } from "../../utils/adminData";
import ErrorState from "../../components/common/ErrorState";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Karyawan", path: "/admin/karyawan", icon: UsersRound },
  { label: "Generate QR", path: "/admin/generate-qr", icon: QrCode },
  { label: "Rekap Absensi", path: "/admin/rekap-absensi", icon: CalendarClock },
  { label: "Izin & Cuti", path: "/admin/izin-cuti", icon: BarChart3 },
  { label: "Laporan", path: "/admin/laporan", icon: FileBarChart },
];

function AdminSidebar({ profile, onLogout }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <Building2 size={20} />
        </div>
        <div>
          <p className="text-base font-black text-slate-950">AbsensiPro</p>
          <p className="text-xs font-semibold text-slate-500">Sistem HRIS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-4 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black uppercase text-blue-700">
          Panel Administrator
        </div>
        <p className="mb-3 px-3 text-xs font-black uppercase tracking-wide text-slate-400">
          Menu Utama
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
                end={item.end}
                key={item.path}
                to={item.path}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
            {getInitials(profile?.nama || profile?.email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">
              {profile?.nama || "Admin"}
            </p>
            <p className="truncate text-xs font-semibold text-slate-500">
              {profile?.jabatan || "Administrator"}
            </p>
          </div>
        </div>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-rose-600"
          type="button"
          onClick={onLogout}
        >
          <LogOut size={17} />
          Keluar
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar({ profile }) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:ml-64 lg:px-8">
      <div className="relative w-full max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="Cari karyawan, menu..."
          type="search"
        />
      </div>

      <div className="ml-4 flex items-center gap-3">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100"
          type="button"
          aria-label="Notifikasi"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
        </button>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
            {getInitials(profile?.nama || profile?.email)}
          </div>
          <span className="hidden text-sm font-black text-slate-800 sm:inline">
            {profile?.nama || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}

function AdminMobileNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-2 py-2 shadow-2xl lg:hidden">
      <div className="grid grid-cols-6 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-500"
                }`
              }
              end={item.end}
              key={item.path}
              to={item.path}
            >
              <Icon size={16} />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const { profile, loading, error } = useCurrentAdmin();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-600 shadow-sm">
          Memuat dashboard admin...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4">
        <div className="w-full max-w-md">
          <ErrorState
            title="Akses admin tidak tersedia"
            message={error || "Profil admin tidak ditemukan."}
            action={
              <button
                className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
                type="button"
                onClick={handleLogout}
              >
                Kembali ke Login
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <AdminSidebar profile={profile} onLogout={handleLogout} />
      <AdminTopbar profile={profile} />
      <main className="pb-24 lg:ml-64 lg:pb-8">
        <div className="mx-auto max-w-[1600px] px-4 py-7 lg:px-8">
          <Outlet />
        </div>
      </main>
      <AdminMobileNav />
    </div>
  );
}

export default AdminLayout;
