const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const mapPositionFromDb = (row) => ({
  id: row.id,
  positionName: row.position_name,
  createdAt: row.created_at,
});

export const fetchPositionsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/position-master`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapPositionFromDb) };
  } catch (error) {
    console.error("Error fetching positions:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createPositionApi = async (positionName) => {
  const response = await fetch(`${API_BASE_URL}/position-master`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position_name: positionName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create position");
  }
  return { success: true, data: mapPositionFromDb(result) };
};

export const updatePositionApi = async (id, positionName) => {
  const response = await fetch(`${API_BASE_URL}/position-master/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position_name: positionName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update position");
  }
  return { success: true, data: mapPositionFromDb(result) };
};

export const deletePositionApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/position-master/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Failed to delete position");
  }
  return { success: true };
};
