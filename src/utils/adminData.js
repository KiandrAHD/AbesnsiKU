import { MONTHS_SHORT, getDateKey, getMonthKey, toDate } from "./date";

export function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AP"
  );
}

export function getEmployeeName(employee) {
  return employee.nama || employee.name || employee.email || "Tanpa nama";
}

export function getEmployeeDivision(employee) {
  return employee.divisi || employee.division || "-";
}

export function getAttendanceDateKey(item) {
  return item.date || getDateKey(item.createdAt || item.checkIn);
}

export function sortByCreatedAt(items) {
  return [...items].sort((a, b) => {
    const dateA = toDate(a.createdAt)?.getTime() || 0;
    const dateB = toDate(b.createdAt)?.getTime() || 0;
    return dateB - dateA;
  });
}

export function buildDashboardStats(users, attendance, leaveRequests) {
  const today = getDateKey();
  const todayAttendance = attendance.filter(
    (item) => getAttendanceDateKey(item) === today
  );
  const todayLeave = leaveRequests.filter((item) => {
    const start = item.startDate || item.date || item.createdAt;
    return getDateKey(start) === today && ["menunggu", "disetujui"].includes(item.status);
  });

  return {
    totalEmployees: users.filter((user) => user.role !== "admin").length,
    presentToday: todayAttendance.filter((item) => item.status === "hadir").length,
    lateToday: todayAttendance.filter((item) => item.status === "terlambat").length,
    leaveToday: todayLeave.length,
  };
}

export function buildMonthlyAttendance(attendance, leaveRequests, year = new Date().getFullYear()) {
  return MONTHS_SHORT.map((month, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
    const attendanceInMonth = attendance.filter(
      (item) => getMonthKey(item.date || item.createdAt) === monthKey
    );
    const leaveInMonth = leaveRequests.filter(
      (item) => getMonthKey(item.startDate || item.createdAt) === monthKey
    );

    return {
      month,
      hadir: attendanceInMonth.filter((item) => item.status === "hadir").length,
      terlambat: attendanceInMonth.filter((item) => item.status === "terlambat").length,
      izin: leaveInMonth.filter((item) => item.type === "izin").length,
      cuti: leaveInMonth.filter((item) => item.type === "cuti").length,
    };
  });
}

export function buildEmployeeRecap(users, attendance, leaveRequests, monthKey) {
  return users
    .filter((user) => user.role !== "admin")
    .map((user) => {
      const userAttendance = attendance.filter(
        (item) =>
          (item.userId === user.id || item.email === user.email) &&
          (!monthKey || getMonthKey(item.date || item.createdAt) === monthKey)
      );
      const userLeave = leaveRequests.filter(
        (item) =>
          (item.userId === user.id || item.email === user.email) &&
          (!monthKey || getMonthKey(item.startDate || item.createdAt) === monthKey)
      );
      const hadir = userAttendance.filter((item) => item.status === "hadir").length;
      const terlambat = userAttendance.filter((item) => item.status === "terlambat").length;
      const izin = userLeave.filter((item) => item.type === "izin").length;
      const cuti = userLeave.filter((item) => item.type === "cuti").length;
      const total = hadir + terlambat + izin + cuti;
      const attendanceRate = total ? Math.round(((hadir + terlambat) / total) * 100) : 0;

      return { user, hadir, terlambat, izin, cuti, attendanceRate };
    });
}
