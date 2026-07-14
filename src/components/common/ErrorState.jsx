function ErrorState({ title = "Data gagal dimuat", message, action }) {
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
      <h2 className="text-base font-black">{title}</h2>
      <p className="mt-1 text-sm font-semibold">
        {message || "Periksa koneksi atau izin akses Firestore, lalu coba lagi."}
      </p>
      {action}
    </section>
  );
}

export default ErrorState;
