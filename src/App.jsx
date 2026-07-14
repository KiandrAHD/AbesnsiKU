import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Login from "./pages/auth/Login";
import AdminLayout from "./layouts/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Karyawan from "./pages/admin/Karyawan";
import GenerateQR from "./pages/admin/GenerateQR";
import RekapAbsensi from "./pages/admin/RekapAbsensi";
import IzinCuti from "./pages/admin/IzinCuti";
import Laporan from "./pages/admin/Laporan";
import UserLayout from "./layouts/user/UserLayout";
import DashboardUser from "./pages/user/DashboardUser";
import ScanQR from "./pages/user/ScanQR";
import RiwayatAbsensi from "./pages/user/RiwayatAbsensi";
import IzinCutiUser from "./pages/user/IzinCutiUser";
import ProfilSaya from "./pages/user/ProfilSaya";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="karyawan" element={<Karyawan />} />
            <Route path="generate-qr" element={<GenerateQR />} />
            <Route path="rekap-absensi" element={<RekapAbsensi />} />
            <Route path="izin-cuti" element={<IzinCuti />} />
            <Route path="laporan" element={<Laporan />} />
          </Route>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<DashboardUser />} />
            <Route path="scan-qr" element={<ScanQR />} />
            <Route path="riwayat-absensi" element={<RiwayatAbsensi />} />
            <Route path="izin-cuti" element={<IzinCutiUser />} />
            <Route path="profil" element={<ProfilSaya />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
