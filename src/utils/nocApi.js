const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (noc_requests) to the shape NOC.jsx renders.
const mapNocFromDb = (row) => ({
  id: row.id,
  timestamp: row.created_at,
  serialNo: row.serial_no,
  code: row.employee_code || "",
  name: row.employee_name,
  teamHead: row.team_head || "",
  teamHeadEmail: row.team_head_email || "",
  dateOfJoining: row.date_of_joining || "",
  regUnder: row.reg_under || "",
  completionDate: row.completion_date || "",
  experience: row.experience || "",
  totalLeaveTaken: row.total_leave_taken ?? "",
  articleEmail: row.article_email || "",
  status: row.status === "Pending" ? "" : row.status,
  statusDate: row.status_date || "",
  isPending: row.status === "Pending",
  isHistory: row.status !== "Pending",
});

export const fetchNocApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/noc`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapNocFromDb) };
  } catch (error) {
    console.error("Error fetching NOC requests:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createNocApi = async ({
  code,
  name,
  teamHead,
  teamHeadEmail,
  dateOfJoining,
  regUnder,
  completionDate,
  experience,
  totalLeaveTaken,
  articleEmail,
}) => {
  const response = await fetch(`${API_BASE_URL}/noc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_code: code || null,
      employee_name: name,
      team_head: teamHead || null,
      team_head_email: teamHeadEmail || null,
      date_of_joining: dateOfJoining,
      reg_under: regUnder || null,
      completion_date: completionDate || null,
      experience: experience || null,
      total_leave_taken: totalLeaveTaken || null,
      article_email: articleEmail || null,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit NOC request");
  }
  return mapNocFromDb(result);
};

export const updateNocStatusApi = async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/noc/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update NOC status");
  }
  return mapNocFromDb(result);
};
