const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (snake_case) to the shape the Location Master page renders (camelCase)
const mapLocationFromDb = (row) => ({
  id: row.id,
  companyName: row.company_name,
  latitude: row.latitude,
  longitude: row.longitude,
  duration: row.duration || "",
  createdAt: row.created_at,
});

export const fetchLocationsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/location-master`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapLocationFromDb) };
  } catch (error) {
    console.error("Error fetching locations:", error);
    return { success: false, error: error.message, data: [] };
  }
};

const buildPayload = (formData) => ({
  company_name: formData.companyName,
  latitude: Number(formData.latitude),
  longitude: Number(formData.longitude),
  duration: formData.duration || null,
});

export const createLocationApi = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/location-master`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload(formData)),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create location");
  }
  return { success: true, data: mapLocationFromDb(result) };
};

export const updateLocationApi = async (id, formData) => {
  const response = await fetch(`${API_BASE_URL}/location-master/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload(formData)),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update location");
  }
  return { success: true, data: mapLocationFromDb(result) };
};

export const deleteLocationApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/location-master/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Failed to delete location");
  }
  return { success: true };
};
