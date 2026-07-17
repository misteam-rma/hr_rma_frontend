const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const mapDepartmentFromDb = (row) => ({
  id: row.id,
  departmentName: row.department_name,
  createdAt: row.created_at,
});

export const fetchDepartmentsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/department-master`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapDepartmentFromDb) };
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createDepartmentApi = async (departmentName) => {
  const response = await fetch(`${API_BASE_URL}/department-master`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ department_name: departmentName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create department");
  }
  return { success: true, data: mapDepartmentFromDb(result) };
};

export const updateDepartmentApi = async (id, departmentName) => {
  const response = await fetch(`${API_BASE_URL}/department-master/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ department_name: departmentName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update department");
  }
  return { success: true, data: mapDepartmentFromDb(result) };
};

export const deleteDepartmentApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/department-master/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Failed to delete department");
  }
  return { success: true };
};
