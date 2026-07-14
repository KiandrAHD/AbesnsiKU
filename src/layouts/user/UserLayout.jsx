import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  QrCode,
  UserRound,
} from "lucide-react";
import { auth } from "../../firebase/config";
import { useCurrentEmployee } from "../../hooks/useCurrentEmployee";
import { getInitials } from "../../utils/adminData";
import { formatDateLong } from "../../utils/date";
import { getEmployeeMeta } from "../../utils/employeeData";

const navItems = [
  { label: "Dashboard", path: "/user", icon: LayoutDashboard, end: true },
  { label: "Scan QR", path: "/user/scan-qr", icon: QrCode },
  { label: "Riwayat Absensi", path: "/user/riwayat-absensi", icon: CalendarDays },
  { label: "Izin & Cuti", path: "/user/izin-cuti", icon: CalendarDays },
  { label: "Profil Saya", path: "/user/profil", icon: UserRound },
];

function Avatar({ profile, size = "md" }) {
  const meta = getEmployeeMeta(profile);
  const sizeClass = size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";

  if (profile?.photoURL) {
    return (
      <img
        alt={meta.name}
        className={`${sizeClass} rounded-full object-cover`}
        src={profile.photoURL}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-emerald-500 font-black text-white`}
    >
      {getInitials(meta.name)}
    </div>
  );
}

function UserSidebar({ profile, onLogout }) {
  const meta = getEmployeeMeta(profile);

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
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-black uppercase text-emerald-700">
          Portal Karyawan
        </div>
        <p className="mb-3 px-3 text-xs font-black uppercase tracking-wide text-slate-400">
          Menu
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
          <Avatar profile={profile} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">{meta.name}</p>
            <p className="truncate text-xs font-semibold text-slate-500">{meta.position}</p>
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

function UserTopbar({ profile }) {
  const meta = getEmployeeMeta(profile);

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:ml-64 lg:px-8">
      <p className="text-sm font-semibold text-slate-500">{formatDateLong(new Date())}</p>
      <div className="ml-4 flex items-center gap-3">
        <button
          aria-label="Notifikasi"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100"
          type="button"
        >
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2">
          <Avatar profile={profile} />
          <span className="hidden max-w-44 truncate text-sm font-black text-slate-800 sm:inline">
            {meta.name}
          </span>
        </div>
      </div>
    </header>
  );
}

function UserMobileNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-2 py-2 shadow-2xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
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
              <span className="max-w-full truncate">{item.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

function UserLayout() {
  const navigate = useNavigate();
  const { profile, loading, error } = useCurrentEmployee();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-600 shadow-sm">
          Memuat portal karyawan...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-950">Profil tidak ditemukan</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {error || "Akun ini belum memiliki data karyawan di Firestore."}
          </p>
          <button
            className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
            type="button"
            onClick={handleLogout}
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <UserSidebar profile={profile} onLogout={handleLogout} />
      <UserTopbar profile={profile} />
      <main className="pb-24 lg:ml-64 lg:pb-8">
        <div className="mx-auto max-w-[1600px] px-4 py-7 lg:px-8">
          <Outlet context={{ profile }} />
        </div>
      </main>
      <UserMobileNav />
    </div>
  );
}

export default UserLayout;
