const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (attendance_monthly_reports) to the shape Attendance.jsx renders.
const mapReportFromDb = (row) => ({
  year: row.report_year,
  month: row.report_month,
  empId: row.employee_code,
  name: row.employee_name,
  department: row.department || "",
  totalDays: row.total_days,
  punchDays: row.present_days,
  absents: row.total_absents,
  lateDays: row.late_marks,
  lateNotAllowed: row.late_not_allowed,
  punchMiss: row.miss_punch,
  status: row.status,
});

export const fetchAttendanceMonthlyReportsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance-monthly-reports`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapReportFromDb) };
  } catch (error) {
    console.error("Error fetching attendance monthly reports:", error);
    return { success: false, error: error.message, data: [] };
  }
};
