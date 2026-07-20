const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (snake_case) to the shape the Indent page renders (camelCase)
const mapIndentFromDb = (row) => ({
  id: row.id,
  timestamp: row.created_at,
  indentNumber: row.indent_number,
  indentType: row.indent_type || "",
  post: row.post,
  gender: row.gender,
  department: row.department || "",
  prefer: row.prefer || "",
  experience: row.experience || "",
  noOfPost: row.number_of_post,
  completionDate: row.completion_date,
  socialSite: row.social_site || "",
  socialSiteTypes: Array.isArray(row.social_site_types)
    ? row.social_site_types.join(", ")
    : row.social_site_types || "",
  status: row.status || "Pending",
});

export const fetchIndentsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/indents`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapIndentFromDb) };
  } catch (error) {
    console.error("Error fetching indents:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createIndentApi = async (formData) => {
  const payload = {
    indent_type: formData.indentType || null,
    post: formData.post,
    gender: formData.gender,
    department: formData.department || null,
    prefer: formData.prefer || null,
    experience: formData.prefer === "Experience" ? formData.experience : null,
    number_of_post: Number(formData.numberOfPost),
    completion_date: formData.completionDate || null,
    social_site: formData.socialSite,
    social_site_types:
      formData.socialSite === "Yes" ? formData.socialSiteTypes : null,
  };

  const response = await fetch(`${API_BASE_URL}/indents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create indent");
  }
  return { success: true, data: mapIndentFromDb(result) };
};
