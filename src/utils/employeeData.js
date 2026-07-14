import { getAttendanceDateKey, getEmployeeDivision, getEmployeeName } from "./adminData";
import { MONTHS_SHORT, getDateKey, getMonthKey, toDate } from "./date";

export const leaveTypes = [
  { label: "Izin Sakit", value: "izin-sakit", category: "izin" },
  { label: "Izin Keperluan", value: "izin-keperluan", category: "izin" },
  { label: "Cuti Tahunan", value: "cuti-tahunan", category: "cuti" },
  { label: "Cuti Melahirkan", value: "cuti-melahirkan", category: "cuti" },
];

export function isSameEmployee(item, employee) {
  if (!employee) return false;
  const email = employee.email?.toLowerCase();
  return item.userId === employee.id || item.email?.toLowerCase() === email;
}

export function getEmployeeMeta(employee) {
  return {
    name: getEmployeeName(employee || {}),
    division: getEmployeeDivision(employee || {}),
    position: employee?.jabatan || employee?.position || "-",
    phone: employee?.phone || "",
    employeeId: employee?.employeeId || employee?.id || "-",
    joinedAt: employee?.joinedAt || employee?.createdAt || "",
  };
}

export function formatTime(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function minutesBetween(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return 0;
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.round(diff / 60000));
}

export function formatDuration(minutes) {
  if (!minutes) return "-";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}j ${rest}m` : `${hours}j`;
}

export function getLeaveCategory(request) {
  const matchedType = leaveTypes.find((type) => type.value === request.type);
  if (matchedType) return matchedType.category;
  return String(request.type || "").includes("cuti") ? "cuti" : "izin";
}

export function getLeaveLabel(value) {
  return leaveTypes.find((type) => type.value === value)?.label || value || "-";
}

export function getUserAttendance(attendance, employee) {
  return attendance.filter((item) => isSameEmployee(item, employee));
}

export function getUserLeaveRequests(leaveRequests, employee) {
  return leaveRequests.filter((item) => isSameEmployee(item, employee));
}

export function getTodayAttendance(attendance, employee, date = new Date()) {
  const today = getDateKey(date);
  return getUserAttendance(attendance, employee).find(
    (item) => getAttendanceDateKey(item) === today
  );
}

export function getMonthlyRows(attendance, leaveRequests, employee, monthKey = getMonthKey()) {
  const userAttendance = getUserAttendance(attendance, employee).filter(
    (item) => getMonthKey(item.date || item.createdAt || item.checkIn) === monthKey
  );
  const userLeaves = getUserLeaveRequests(leaveRequests, employee).filter(
    (item) =>
      ["menunggu", "disetujui"].includes(item.status || "menunggu") &&
      getMonthKey(item.startDate || item.createdAt) === monthKey
  );

  return { userAttendance, userLeaves };
}

export function buildEmployeeMonthlyStats(attendance, leaveRequests, employee, monthKey = getMonthKey()) {
  const { userAttendance, userLeaves } = getMonthlyRows(
    attendance,
    leaveRequests,
    employee,
    monthKey
  );
  const hadir = userAttendance.filter((item) => item.status === "hadir").length;
  const terlambat = userAttendance.filter((item) => item.status === "terlambat").length;
  const izin = userLeaves.filter((item) => getLeaveCategory(item) === "izin").length;
  const cuti = userLeaves.filter((item) => getLeaveCategory(item) === "cuti").length;
  const counted = hadir + terlambat + izin + cuti;
  const attendanceRate = counted ? Math.round(((hadir + terlambat) / counted) * 100) : 0;
  const workMinutes = userAttendance.reduce(
    (total, item) => total + minutesBetween(item.checkIn, item.checkOut),
    0
  );

  return { hadir, terlambat, izin, cuti, attendanceRate, workMinutes };
}

export function buildAttendanceLineData(attendance, employee, year = new Date().getFullYear()) {
  const userAttendance = getUserAttendance(attendance, employee);
  return MONTHS_SHORT.map((month, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthRows = userAttendance.filter(
      (item) => getMonthKey(item.date || item.createdAt || item.checkIn) === monthKey
    );

    return {
      month,
      hadir: monthRows.filter((item) => ["hadir", "terlambat"].includes(item.status)).length,
    };
  });
}

export function buildWorkHourWeeks(attendance, employee, monthKey = getMonthKey()) {
  const userAttendance = getUserAttendance(attendance, employee).filter(
    (item) => getMonthKey(item.date || item.createdAt || item.checkIn) === monthKey
  );
  const weeks = [1, 2, 3, 4, 5].map((week) => ({ week: `Mg ${week}`, minutes: 0 }));

  userAttendance.forEach((item) => {
    const date = toDate(item.date || item.checkIn || item.createdAt);
    if (!date) return;
    const weekIndex = Math.min(4, Math.floor((date.getDate() - 1) / 7));
    weeks[weekIndex].minutes += minutesBetween(item.checkIn, item.checkOut);
  });

  return weeks.filter((week) => week.minutes > 0 || weeks.length <= 4);
}

export function buildCalendarDays(attendance, leaveRequests, employee, monthKey = getMonthKey()) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const totalDays = new Date(year, month, 0).getDate();
  const leadingBlank = firstDay.getDay();
  const userAttendance = getUserAttendance(attendance, employee);
  const userLeaves = getUserLeaveRequests(leaveRequests, employee);
  const days = Array.from({ length: leadingBlank }, (_, index) => ({
    id: `blank-${index}`,
    blank: true,
  }));

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month - 1, day);
    const dateKey = getDateKey(date);
    const attendanceItem = userAttendance.find(
      (item) => getAttendanceDateKey(item) === dateKey
    );
    const leaveItem = userLeaves.find(
      (item) =>
        ["menunggu", "disetujui"].includes(item.status || "menunggu") &&
        getDateKey(item.startDate || item.createdAt) === dateKey
    );
    const status =
      attendanceItem?.status ||
      (leaveItem ? getLeaveCategory(leaveItem) : date.getDay() === 0 || date.getDay() === 6 ? "libur" : "");

    days.push({ id: dateKey, day, date, dateKey, status, attendanceItem, leaveItem });
  }

  return days;
}

export function buildHistoryRows(attendance, leaveRequests, employee, monthKey = getMonthKey()) {
  const attendanceRows = getUserAttendance(attendance, employee)
    .filter((item) => getMonthKey(item.date || item.createdAt || item.checkIn) === monthKey)
    .map((item) => ({
      id: item.id,
      date: item.date || item.createdAt || item.checkIn,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      duration: minutesBetween(item.checkIn, item.checkOut),
      status: item.status || "hadir",
      source: "attendance",
    }));
  const leaveRows = getUserLeaveRequests(leaveRequests, employee)
    .filter(
      (item) =>
        ["menunggu", "disetujui"].includes(item.status || "menunggu") &&
        getMonthKey(item.startDate || item.createdAt) === monthKey
    )
    .map((item) => ({
      id: item.id,
      date: item.startDate || item.createdAt,
      checkIn: null,
      checkOut: null,
      duration: 0,
      status: getLeaveCategory(item),
      source: "leave",
      type: item.type,
    }));

  return [...attendanceRows, ...leaveRows].sort(
    (a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0)
  );
}

export function getAttendanceStatusLabel(status) {
  const labels = {
    hadir: "Hadir",
    terlambat: "Terlambat",
    izin: "Izin",
    cuti: "Cuti",
    libur: "Libur",
  };
  return labels[status] || "Belum Absen";
}
