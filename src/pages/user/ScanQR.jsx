import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BrowserQRCodeReader } from "@zxing/browser";
import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Camera, CheckCircle2, Clock3, Info, QrCode } from "lucide-react";
import { db } from "../../firebase/config";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import { formatDate, getDateKey, toDate } from "../../utils/date";
import {
  formatTime,
  getEmployeeMeta,
  getTodayAttendance,
  getUserAttendance,
} from "../../utils/employeeData";

function parseQrPayload(text) {
  try {
    const payload = JSON.parse(text);
    if (!payload?.sessionId || !payload?.qrId) return null;
    return payload;
  } catch {
    return null;
  }
}

function isTimeAfterLimit(date, limit) {
  if (!limit) return false;
  const [hours, minutes] = limit.split(":").map(Number);
  const limited = new Date(date);
  limited.setHours(hours || 0, minutes || 0, 0, 0);
  return date.getTime() > limited.getTime();
}

function StatusRow({ icon: Icon, label, note, value, color }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{label}</p>
          <p className="text-xs font-semibold text-slate-500">{note}</p>
        </div>
      </div>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

function ScanQR() {
  const { profile } = useOutletContext();
  const { data: attendance } = useFirestoreCollection("attendance");
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const processingRef = useRef(false);
  const [scanMode, setScanMode] = useState("check-in");
  const [cameraActive, setCameraActive] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const todayAttendance = getTodayAttendance(attendance, profile);
  const recentScans = useMemo(
    () =>
      getUserAttendance(attendance, profile)
        .flatMap((item) => [
          item.checkIn && {
            id: `${item.id}-in`,
            type: "Check-in",
            date: item.date || item.checkIn,
            time: item.checkIn,
            status: item.status,
          },
          item.checkOut && {
            id: `${item.id}-out`,
            type: "Check-out",
            date: item.date || item.checkOut,
            time: item.checkOut,
            status: item.status,
          },
        ])
        .filter(Boolean)
        .sort((a, b) => (toDate(b.time)?.getTime() || 0) - (toDate(a.time)?.getTime() || 0))
        .slice(0, 5),
    [attendance, profile]
  );

  useEffect(
    () => () => {
      controlsRef.current?.stop();
    },
    []
  );

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraActive(false);
    processingRef.current = false;
  };

  const saveScan = async (payload) => {
    const now = new Date();
    const sessionRef = doc(db, "qr_sessions", payload.sessionId);
    const sessionSnapshot = await getDoc(sessionRef);

    await updateDoc(sessionRef, {
      totalScans: increment(1),
      updatedAt: serverTimestamp(),
    }).catch(() => {});

    if (!sessionSnapshot.exists()) {
      throw new Error("Sesi QR tidak ditemukan.");
    }

    const session = sessionSnapshot.data();
    if (session.qrId !== payload.qrId) {
      throw new Error("QR Code tidak sesuai dengan sesi absensi.");
    }

    if (session.status !== "aktif") {
      throw new Error("QR Code sudah tidak aktif.");
    }

    const expiresAt = toDate(session.expiresAt);
    if (expiresAt && expiresAt.getTime() < now.getTime()) {
      throw new Error("QR Code sudah kedaluwarsa.");
    }

    const dateKey = getDateKey(now);
    const deterministicId = `${profile.id}_${dateKey}`;
    const targetId = todayAttendance?.id || deterministicId;
    const attendanceRef = doc(db, "attendance", targetId);
    const attendanceSnapshot = await getDoc(attendanceRef);
    const existing = attendanceSnapshot.exists()
      ? attendanceSnapshot.data()
      : targetId === todayAttendance?.id
        ? todayAttendance
        : null;

    if (scanMode === "check-in") {
      if (existing?.checkIn) {
        throw new Error("Check-in hari ini sudah tercatat.");
      }

      const meta = getEmployeeMeta(profile);
      await setDoc(
        attendanceRef,
        {
          userId: profile.id,
          email: profile.email || "",
          userName: meta.name,
          division: meta.division,
          position: meta.position,
          date: dateKey,
          checkIn: now,
          checkOut: null,
          status: isTimeAfterLimit(now, session.lateLimit) ? "terlambat" : "hadir",
          sessionId: payload.sessionId,
          qrId: payload.qrId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      if (!existing?.checkIn) {
        throw new Error("Anda perlu check-in sebelum check-out.");
      }

      if (existing?.checkOut) {
        throw new Error("Check-out hari ini sudah tercatat.");
      }

      await setDoc(
        attendanceRef,
        {
          checkOut: now,
          checkoutSessionId: payload.sessionId,
          checkoutQrId: payload.qrId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await updateDoc(sessionRef, {
      successfulScans: increment(1),
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  };

  const startCamera = async () => {
    setError("");
    setFeedback("");
    processingRef.current = false;

    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result) => {
          if (!result || processingRef.current) return;
          processingRef.current = true;
          const payload = parseQrPayload(result.getText());

          if (!payload) {
            setError("Format QR Code tidak valid.");
            processingRef.current = false;
            return;
          }

          try {
            await saveScan(payload);
            setFeedback(`${scanMode === "check-in" ? "Check-in" : "Check-out"} berhasil disimpan.`);
            stopCamera();
          } catch (scanError) {
            setError(scanError.message);
            setTimeout(() => {
              processingRef.current = false;
            }, 1200);
          }
        }
      );
      setCameraActive(true);
    } catch (cameraError) {
      setError(cameraError.message || "Kamera tidak dapat diaktifkan.");
      setCameraActive(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">Scan QR Absensi</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Arahkan kamera ke QR Code absensi yang tersedia
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <section className="space-y-4">
          <div className="grid rounded-2xl bg-white p-1 shadow-sm sm:grid-cols-2">
            {[
              ["check-in", "Check-in (Masuk)"],
              ["check-out", "Check-out (Pulang)"],
            ].map(([value, label]) => (
              <button
                className={`rounded-xl px-4 py-3 text-sm font-black ${
                  scanMode === value ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
                key={value}
                type="button"
                onClick={() => setScanMode(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
            <video
              className={`h-full min-h-[360px] w-full object-cover ${cameraActive ? "block" : "hidden"}`}
              muted
              playsInline
              ref={videoRef}
            />
            {!cameraActive && (
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800 text-slate-300">
                  <Camera size={38} />
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-400">Kamera belum aktif</p>
                <button
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
                  type="button"
                  onClick={startCamera}
                >
                  <Camera size={17} />
                  Aktifkan Kamera
                </button>
              </div>
            )}
          </div>

          {cameraActive && (
            <button
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              type="button"
              onClick={stopCamera}
            >
              Matikan Kamera
            </button>
          )}

          {(feedback || error) && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                feedback
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {feedback || error}
            </div>
          )}

          <div className="rounded-2xl border border-blue-200 bg-blue-100/70 p-5 text-blue-700">
            <div className="flex items-center gap-2 text-sm font-black">
              <Info size={17} />
              Panduan Scan QR
            </div>
            <ul className="mt-3 space-y-2 pl-7 text-sm font-semibold">
              <li>Pastikan kamera mendapat cahaya yang cukup</li>
              <li>Arahkan kamera tepat ke QR Code yang ditampilkan</li>
              <li>Tahan kamera stabil hingga QR terbaca</li>
              <li>Scan hanya berlaku pada jam absensi yang ditentukan</li>
            </ul>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Status Hari Ini</h2>
            <div className="mt-4 space-y-3">
              <StatusRow
                color="bg-emerald-50 text-emerald-600"
                icon={CheckCircle2}
                label="Check-in"
                note={todayAttendance?.status === "terlambat" ? "Terlambat" : todayAttendance ? "Tepat Waktu" : "Belum Absen"}
                value={formatTime(todayAttendance?.checkIn)}
              />
              <StatusRow
                color="bg-amber-50 text-amber-600"
                icon={Clock3}
                label="Check-out"
                note={todayAttendance?.checkOut ? "Sudah pulang" : "Belum Absen"}
                value={formatTime(todayAttendance?.checkOut)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Riwayat Scan</h2>
            <div className="mt-4 space-y-3">
              {recentScans.map((scan) => (
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4" key={scan.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <QrCode size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{scan.type}</p>
                      <p className="text-xs font-semibold text-slate-500">{formatDate(scan.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-800">{formatTime(scan.time)}</span>
                </div>
              ))}
              {recentScans.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  Belum ada riwayat scan.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ScanQR;
