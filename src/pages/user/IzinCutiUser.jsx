import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { CalendarDays, FileUp, Send } from "lucide-react";
import { Badge } from "../../components/admin/Badge";
import { db, storage } from "../../firebase/config";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { formatDate } from "../../utils/date";
import {
  getEmployeeMeta,
  getLeaveLabel,
  getUserLeaveRequests,
  leaveTypes,
} from "../../utils/employeeData";

const emptyForm = {
  type: "izin-sakit",
  startDate: "",
  endDate: "",
  reason: "",
};

function IzinCutiUser() {
  const { profile } = useOutletContext();
  const { data: leaveRequests } = useFirestoreCollection("leave_requests");
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const meta = getEmployeeMeta(profile);
  const userRequests = useMemo(
    () =>
      getUserLeaveRequests(leaveRequests, profile).sort(
        (a, b) =>
          (b.createdAt?.getTime?.() || new Date(b.createdAt || 0).getTime()) -
          (a.createdAt?.getTime?.() || new Date(a.createdAt || 0).getTime())
      ),
    [leaveRequests, profile]
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Dokumen harus berupa PDF, JPG, atau PNG.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran dokumen maksimal 5MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setError("Lengkapi tanggal dan alasan pengajuan.");
      return;
    }

    if (new Date(form.endDate).getTime() < new Date(form.startDate).getTime()) {
      setError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    setSubmitting(true);

    try {
      let documentUrl = "";
      let documentName = "";

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const fileRef = ref(storage, `leave_requests/${profile.id}/${Date.now()}-${safeName}`);
        await uploadBytes(fileRef, file);
        documentUrl = await getDownloadURL(fileRef);
        documentName = file.name;
      }

      await addDoc(collection(db, "leave_requests"), {
        userId: profile.id,
        email: profile.email || "",
        userName: meta.name,
        division: meta.division,
        position: meta.position,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
        status: "menunggu",
        documentUrl,
        documentName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm(emptyForm);
      setFile(null);
      setMessage("Pengajuan berhasil dikirim.");
    } catch (submitError) {
      setError(submitError.message || "Pengajuan gagal dikirim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Ajukan Izin / Cuti</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Isi formulir pengajuan izin atau cuti
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
        <form
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <p className="mb-3 text-sm font-black text-slate-800">Jenis Pengajuan</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {leaveTypes.map((type) => (
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black ${
                  form.type === type.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                key={type.value}
              >
                <input
                  checked={form.type === type.value}
                  className="accent-blue-600"
                  name="type"
                  type="radio"
                  value={type.value}
                  onChange={(event) => updateForm("type", event.target.value)}
                />
                {type.label}
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-bold text-slate-700">
              <span>Tanggal Mulai</span>
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="date"
                value={form.startDate}
                onChange={(event) => updateForm("startDate", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-bold text-slate-700">
              <span>Tanggal Selesai</span>
              <input
                className="h-11 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                type="date"
                value={form.endDate}
                onChange={(event) => updateForm("endDate", event.target.value)}
              />
            </label>
          </div>

          <label className="mt-5 block space-y-2 text-sm font-bold text-slate-700">
            <span>Alasan / Keterangan</span>
            <textarea
              className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Jelaskan alasan pengajuan izin atau cuti Anda..."
              value={form.reason}
              onChange={(event) => updateForm("reason", event.target.value)}
            />
          </label>

          <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500 hover:border-blue-300 hover:bg-blue-50">
            <FileUp className="mx-auto mb-2 text-slate-400" size={24} />
            <span>{file ? file.name : "Klik atau seret file ke sini"}</span>
            <p className="mt-1 text-xs">PDF, JPG, PNG maks 5MB</p>
            <input
              className="sr-only"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
            />
          </label>

          {(message || error) && (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
                message ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {message || error}
            </p>
          )}

          <button
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            <Send size={17} />
            {submitting ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-950">Riwayat Pengajuan</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {userRequests.map((request) => (
              <article className="flex items-center justify-between gap-4 p-5" key={request.id}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950">{getLeaveLabel(request.type)}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatDate(request.startDate || request.createdAt)}
                      {request.endDate ? ` - ${formatDate(request.endDate)}` : ""}
                    </p>
                    {request.documentUrl && (
                      <a
                        className="mt-2 inline-block text-xs font-black text-blue-600 hover:underline"
                        href={request.documentUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Lihat dokumen
                      </a>
                    )}
                  </div>
                </div>
                <Badge variant={request.status}>{request.status || "menunggu"}</Badge>
              </article>
            ))}
            {userRequests.length === 0 && (
              <p className="p-5 text-sm font-semibold text-slate-500">
                Belum ada pengajuan izin atau cuti.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default IzinCutiUser;
