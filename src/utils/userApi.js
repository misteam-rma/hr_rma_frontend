const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (users) to the shape AttendanceDaily.jsx's employee dropdown expects.
const mapUserFromDb = (row) => ({
  code: row.code,
  name: row.name,
  type: row.type || "",
  department: row.department || "",
});

export const fetchUsersApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapUserFromDb) };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message, data: [] };
  }
};
