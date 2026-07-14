import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  IdCard,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { db, storage } from "../../firebase/config";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { getInitials } from "../../utils/adminData";
import { formatDate, getMonthKey } from "../../utils/date";
import {
  buildEmployeeMonthlyStats,
  getEmployeeMeta,
} from "../../utils/employeeData";

function InfoInput({ icon: Icon, label, value, readOnly, onChange, helper }) {
  return (
    <label className="min-w-0 space-y-2 text-sm font-bold text-slate-700">
      <span className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Icon className="shrink-0 text-slate-400" size={18} />
        {readOnly ? (
          <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-500 [overflow-wrap:anywhere]">
            {value || "-"}
          </span>
        ) : (
          <input
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none [overflow-wrap:anywhere]"
            value={value || ""}
            onChange={(event) => onChange?.(event.target.value)}
          />
        )}
      </div>
      {helper && <p className="text-xs font-semibold text-slate-400">{helper}</p>}
    </label>
  );
}

function ProfilSaya() {
  const { profile } = useOutletContext();
  const { data: attendance } = useFirestoreCollection("attendance");
  const { data: leaveRequests } = useFirestoreCollection("leave_requests");
  const meta = getEmployeeMeta(profile);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nama: profile.nama || "",
    phone: profile.phone || "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const stats = buildEmployeeMonthlyStats(attendance, leaveRequests, profile, getMonthKey());
  const totalAttendance = useMemo(
    () =>
      attendance.filter(
        (item) => item.userId === profile.id || item.email?.toLowerCase() === profile.email?.toLowerCase()
      ).length,
    [attendance, profile]
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setError("");

    if (!selectedFile) {
      setPhotoFile(null);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      setError("Foto profil harus berupa JPG atau PNG.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 3 * 1024 * 1024) {
      setError("Ukuran foto maksimal 3MB.");
      event.target.value = "";
      return;
    }

    setPhotoFile(selectedFile);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      let photoURL = profile.photoURL || "";

      if (photoFile) {
        const safeName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const photoRef = ref(storage, `profiles/${profile.id}/${Date.now()}-${safeName}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      await updateDoc(doc(db, "users", profile.id), {
        nama: form.nama.trim(),
        phone: form.phone.trim(),
        photoURL,
        updatedAt: serverTimestamp(),
      });

      setEditing(false);
      setPhotoFile(null);
      setMessage("Profil berhasil diperbarui.");
    } catch (saveError) {
      setError(saveError.message || "Profil gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Profil Saya</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Kelola informasi profil dan keamanan akun Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.9fr)]">
        <div className="min-w-0 space-y-5">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6">
            <div className="relative mx-auto h-28 w-28">
              {profile.photoURL || photoFile ? (
                <img
                  alt={meta.name}
                  className="h-28 w-28 rounded-3xl object-cover"
                  src={photoFile ? URL.createObjectURL(photoFile) : profile.photoURL}
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-blue-600 text-4xl font-black text-white">
                  {getInitials(meta.name)}
                </div>
              )}
              {editing && (
                <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700">
                  <Camera size={18} />
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>
            <h2 className="mt-5 break-words text-2xl font-black text-slate-950 [overflow-wrap:anywhere]">
              {form.nama || meta.name}
            </h2>
            <p className="mt-1 break-words text-sm font-semibold text-slate-500 [overflow-wrap:anywhere]">
              {meta.position}
            </p>
            <BadgeLike label={profile.status === "nonaktif" ? "Nonaktif" : "Aktif"} />
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
              <ProfileFact label="ID Karyawan" value={meta.employeeId} />
              <ProfileFact label="Bergabung" value={formatDate(meta.joinedAt)} />
              <ProfileFact label="Total Absensi" value={`${totalAttendance} hari`} />
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Statistik Bulan Ini</h2>
            <div className="mt-5 space-y-4">
              <ProgressRow label="Kehadiran" value={stats.attendanceRate} color="bg-emerald-500" suffix="%" />
              <ProgressRow label="Tepat Waktu" value={stats.hadir + stats.terlambat ? Math.round((stats.hadir / (stats.hadir + stats.terlambat)) * 100) : 0} color="bg-blue-600" suffix="%" />
              <ProgressRow label="Izin" value={stats.izin} color="bg-violet-500" suffix=" hari" max={10} />
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-slate-950">Informasi Pribadi</h2>
              {editing ? (
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={saving}
                  type="button"
                  onClick={handleSave}
                >
                  <Save size={17} />
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              ) : (
                <button
                  className="rounded-2xl bg-blue-100 px-4 py-3 text-sm font-black text-blue-700 hover:bg-blue-200"
                  type="button"
                  onClick={() => {
                    setForm({ nama: profile.nama || "", phone: profile.phone || "" });
                    setEditing(true);
                  }}
                >
                  Edit Profil
                </button>
              )}
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
              <InfoInput
                icon={UserRound}
                label="Nama Lengkap"
                readOnly={!editing}
                value={form.nama}
                onChange={(value) => updateForm("nama", value)}
              />
              <InfoInput icon={Mail} label="Email" readOnly value={profile.email || ""} />
              <InfoInput
                icon={Phone}
                label="Nomor Telepon"
                readOnly={!editing}
                value={form.phone}
                onChange={(value) => updateForm("phone", value)}
              />
              <InfoInput
                helper="Hubungi HR untuk mengubah"
                icon={BriefcaseBusiness}
                label="Jabatan"
                readOnly
                value={meta.position}
              />
              <InfoInput
                helper="Hubungi HR untuk mengubah"
                icon={Building2}
                label="Divisi"
                readOnly
                value={meta.division}
              />
              <InfoInput
                helper="Hubungi HR untuk mengubah"
                icon={CalendarDays}
                label="Tanggal Bergabung"
                readOnly
                value={formatDate(meta.joinedAt)}
              />
              <InfoInput
                helper="Hubungi HR untuk mengubah"
                icon={IdCard}
                label="ID Karyawan"
                readOnly
                value={meta.employeeId}
              />
              <InfoInput
                helper="Hubungi HR untuk mengubah"
                icon={LockKeyhole}
                label="Role"
                readOnly
                value={profile.role || "user"}
              />
            </div>

            {(message || error) && (
              <p
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
                  message ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {message || error}
              </p>
            )}
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Keamanan Akun</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Perbarui password secara berkala
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-100 px-4 py-3 text-sm font-black text-blue-700"
                type="button"
              >
                <LockKeyhole size={17} />
                Ganti Password
              </button>
            </div>
            <div className="mt-5 flex min-w-0 items-start gap-4 rounded-2xl bg-slate-50 p-5">
              <LockKeyhole className="text-slate-400" size={22} />
              <div className="min-w-0">
                <p className="break-words font-black text-slate-800 [overflow-wrap:anywhere]">
                  Password dikelola melalui Firebase Auth
                </p>
                <p className="break-words text-sm font-semibold text-slate-500 [overflow-wrap:anywhere]">
                  Hubungi admin jika Anda memerlukan reset password.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BadgeLike({ label }) {
  return (
    <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
      {label}
    </span>
  );
}

function ProfileFact({ label, value }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 text-left">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-black text-slate-900 [overflow-wrap:anywhere]">
        {value}
      </span>
    </div>
  );
}

function ProgressRow({ label, value, color, suffix, max = 100 }) {
  const width = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="grid min-w-0 grid-cols-[86px_minmax(0,1fr)_58px] items-center gap-2 text-sm sm:grid-cols-[100px_minmax(0,1fr)_64px] sm:gap-3">
      <span className="break-words font-semibold text-slate-500 [overflow-wrap:anywhere]">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-right font-black text-blue-600">
        {value}
        {suffix}
      </span>
    </div>
  );
}

export default ProfilSaya;
