import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[Runtime] Unhandled render error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4">
          <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-xl font-black text-slate-950">Terjadi kesalahan tampilan</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Aplikasi gagal merender halaman ini. Detail error sudah dicatat di console browser.
            </p>
            <button
              className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
              type="button"
              onClick={() => window.location.reload()}
            >
              Muat Ulang
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
