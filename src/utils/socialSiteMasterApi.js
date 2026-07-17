const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const mapSocialSiteFromDb = (row) => ({
  id: row.id,
  siteName: row.site_name,
  createdAt: row.created_at,
});

export const fetchSocialSitesApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/social-site-master`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapSocialSiteFromDb) };
  } catch (error) {
    console.error("Error fetching social sites:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createSocialSiteApi = async (siteName) => {
  const response = await fetch(`${API_BASE_URL}/social-site-master`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_name: siteName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create social site");
  }
  return { success: true, data: mapSocialSiteFromDb(result) };
};

export const updateSocialSiteApi = async (id, siteName) => {
  const response = await fetch(`${API_BASE_URL}/social-site-master/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_name: siteName }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update social site");
  }
  return { success: true, data: mapSocialSiteFromDb(result) };
};

export const deleteSocialSiteApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/social-site-master/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Failed to delete social site");
  }
  return { success: true };
};
