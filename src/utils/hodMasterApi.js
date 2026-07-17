const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const mapHodFromDb = (row) => ({
  id: row.id,
  hodName: row.hod_name,
  createdAt: row.created_at,
});

export const fetchHodsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/hod-master`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapHodFromDb) };
  } catch (error) {
    console.error("Error fetching hods:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createHodApi = async (hodName) => {
  const response = await fetch(`${API_BASE_URL}/hod-master`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hod_name: hodName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create hod");
  }
  return { success: true, data: mapHodFromDb(result) };
};

export const updateHodApi = async (id, hodName) => {
  const response = await fetch(`${API_BASE_URL}/hod-master/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hod_name: hodName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update hod");
  }
  return { success: true, data: mapHodFromDb(result) };
};

export const deleteHodApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/hod-master/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Failed to delete hod");
  }
  return { success: true };
};
