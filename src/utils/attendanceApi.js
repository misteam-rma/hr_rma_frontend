const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (attendance_logs) to the shape AttendanceDaily.jsx groups client-side.
const mapLogFromDb = (row) => ({
  id: row.id,
  empId: row.employee_code,
  name: row.employee_name,
  type: row.employee_type || "",
  department: row.department || "",
  punchType: row.punch_type, // 'IN' | 'OUT'
  photoUrl: row.photo_url || "",
  latitude: row.latitude || "",
  longitude: row.longitude || "",
  locationName: row.location_name || "",
  locationMatchStatus: row.location_match_status || "",
  date: row.punch_date, // YYYY-MM-DD
  time: row.punch_time, // HH:MM:SS
});

export const fetchAttendanceLogsApi = async ({ date, employeeCode } = {}) => {
  try {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (employeeCode) params.set("employee_code", employeeCode);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_BASE_URL}/attendance${query}`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapLogFromDb) };
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createPunchApi = async ({
  employeeCode,
  employeeName,
  employeeType,
  department,
  punchType, // 'IN' | 'OUT'
  photoUrl,
  latitude,
  longitude,
  locationName,
}) => {
  const response = await fetch(`${API_BASE_URL}/attendance/punch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_code: employeeCode,
      employee_name: employeeName,
      employee_type: employeeType || null,
      department: department || null,
      punch_type: punchType,
      photo_url: photoUrl,
      latitude,
      longitude,
      location_name: locationName || null,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit attendance");
  }
  return mapLogFromDb(result);
};
