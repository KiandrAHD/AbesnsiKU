import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Edit3, Filter, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "../../components/admin/Badge";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { DataTable } from "../../components/admin/DataTable";
import { Modal } from "../../components/admin/Modal";
import { db } from "../../firebase/config";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { formatDate } from "../../utils/date";
import { getEmployeeDivision, getEmployeeName, getInitials } from "../../utils/adminData";

const emptyEmployee = {
  nama: "",
  email: "",
  role: "user",
  status: "aktif",
  divisi: "",
  jabatan: "",
  employeeId: "",
  phone: "",
  joinedAt: "",
};

function EmployeeForm({ initialValue, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValue || emptyEmployee);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      {[
        ["nama", "Nama Lengkap"],
        ["email", "Email"],
        ["employeeId", "ID Karyawan"],
        ["jabatan", "Jabatan"],
        ["divisi", "Divisi"],
        ["phone", "Nomor Telepon"],
        ["joinedAt", "Tanggal Bergabung"],
      ].map(([field, label]) => (
        <label className="space-y-2 text-sm font-bold text-slate-700" key={field}>
          <span>{label}</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            required={["nama", "email"].includes(field)}
            type={field === "joinedAt" ? "date" : field === "email" ? "email" : "text"}
            value={form[field] || ""}
            onChange={(event) => updateField(field, event.target.value)}
          />
        </label>
      ))}

      <label className="space-y-2 text-sm font-bold text-slate-700">
        <span>Status</span>
        <select
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
        >
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </label>

      <div className="md:col-span-2 mt-2 flex justify-end gap-3">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={onCancel}
        >
          Batal
        </button>
        <button
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          type="submit"
        >
          Simpan Karyawan
        </button>
      </div>
    </form>
  );
}

function Karyawan() {
  const { data: users } = useFirestoreCollection("users");
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("Semua");
  const [modalMode, setModalMode] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const employees = users.filter((user) => user.role !== "admin");
  const divisions = useMemo(
    () => ["Semua", ...new Set(employees.map(getEmployeeDivision).filter((item) => item !== "-"))],
    [employees]
  );
  const filteredEmployees = employees.filter((employee) => {
    const haystack = [
      getEmployeeName(employee),
      employee?.email,
      employee?.jabatan,
      employee?.employeeId,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesDivision = division === "Semua" || getEmployeeDivision(employee) === division;

    return matchesSearch && matchesDivision;
  });

  const handleSave = async (form) => {
    const payload = {
      ...form,
      email: form.email.trim().toLowerCase(),
      role: "user",
      updatedAt: serverTimestamp(),
    };

    if (modalMode === "edit") {
      await updateDoc(doc(db, "users", selectedEmployee.id), payload);
    } else {
      await addDoc(collection(db, "users"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    setModalMode(null);
    setSelectedEmployee(null);
  };

  const handleToggleStatus = async (employee) => {
    await updateDoc(doc(db, "users", employee.id), {
      status: employee.status === "aktif" ? "nonaktif" : "aktif",
      updatedAt: serverTimestamp(),
    });
  };

  const handleDelete = async () => {
    await deleteDoc(doc(db, "users", deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Data Karyawan</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {employees.length} karyawan terdaftar di sistem
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          type="button"
          onClick={() => {
            setSelectedEmployee(null);
            setModalMode("create");
          }}
        >
          <Plus size={18} />
          Tambah Karyawan
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Cari nama, email, jabatan..."
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Filter className="text-slate-400" size={18} />
        <div className="flex flex-wrap gap-2">
          {divisions.map((item) => (
            <button
              className={`rounded-2xl border px-4 py-2 text-sm font-bold ${
                division === item
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              key={item}
              type="button"
              onClick={() => setDivision(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "nama",
            header: "Karyawan",
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                  {getInitials(getEmployeeName(row))}
                </div>
                <div>
                  <p className="font-black text-slate-900">{getEmployeeName(row)}</p>
                  <p className="text-xs font-semibold text-slate-500">{row.employeeId || row.id}</p>
                </div>
              </div>
            ),
          },
          { key: "jabatan", header: "Jabatan", render: (row) => row.jabatan || "-" },
          {
            key: "divisi",
            header: "Divisi",
            render: (row) => <Badge>{getEmployeeDivision(row)}</Badge>,
          },
          { key: "email", header: "Kontak", render: (row) => row.email || "-" },
          { key: "joinedAt", header: "Bergabung", render: (row) => formatDate(row.joinedAt) },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <button type="button" onClick={() => handleToggleStatus(row)}>
                <Badge variant={row.status}>{row.status || "aktif"}</Badge>
              </button>
            ),
          },
          {
            key: "actions",
            header: "Aksi",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                  type="button"
                  onClick={() => {
                    setSelectedEmployee(row);
                    setModalMode("edit");
                  }}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
        emptyDescription="Tambahkan karyawan pertama untuk mulai mengelola data HRIS."
        emptyTitle="Belum ada data karyawan"
        rows={filteredEmployees}
      />

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Edit Karyawan" : "Tambah Karyawan"}
        onClose={() => setModalMode(null)}
      >
        <EmployeeForm
          initialValue={selectedEmployee || emptyEmployee}
          onCancel={() => setModalMode(null)}
          onSubmit={handleSave}
        />
      </Modal>

      <ConfirmDialog
        confirmLabel="Hapus Karyawan"
        description={`Data ${getEmployeeName(deleteTarget || {})} akan dihapus dari Firestore.`}
        open={Boolean(deleteTarget)}
        title="Hapus karyawan?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default Karyawan;
