import QRCode from "qrcode";

export async function createQrDataUrl(payload) {
  return QRCode.toDataURL(JSON.stringify(payload), {
    width: 420,
    margin: 2,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });
}

export function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

export function buildNextQrId(existingSessions, date = new Date()) {
  const datePart = `${String(date.getFullYear()).slice(2)}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const prefix = `QR-${datePart}-`;
  const sequence =
    existingSessions
      .map((session) => session.qrId)
      .filter((qrId) => qrId?.startsWith(prefix))
      .map((qrId) => Number(qrId.replace(prefix, "")))
      .filter((number) => !Number.isNaN(number))
      .sort((a, b) => b - a)[0] || 0;

  return `${prefix}${String(sequence + 1).padStart(3, "0")}`;
}
