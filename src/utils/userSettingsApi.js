const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (app_users, snake_case) to the shape the Settings > Users page renders (camelCase)
const mapUserFromDb = (row) => ({
  id: row.id,
  serialNo: row.serial_no,
  name: row.name,
  code: row.code || "",
  email: row.email || "",
  phoneNumber: row.phone_number || "",
  employeeType: row.employee_type || "",
  department: row.department || "",
  role: row.role || "",
  status: row.status || "",
  createdAt: row.created_at,
});

export const fetchAllUsersApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/admin`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapUserFromDb) };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateUserSettingsApi = async (id, formData) => {
  const payload = {
    name: formData.name,
    email: formData.email || null,
    phone_number: formData.phoneNumber || null,
    employee_type: formData.employeeType || null,
    department: formData.department || null,
    role: formData.role || null,
    status: formData.status || null,
  };
  if (formData.password) payload.password = formData.password;
  if (formData.pin) payload.pin = formData.pin;

  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update user");
  }
  return { success: true, data: mapUserFromDb(result) };
};

export const deleteUserSettingsApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Failed to delete user");
  }
  return { success: true };
};
