const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (feedback_requests) to the shape Feedback.jsx renders.
const mapFeedbackFromDb = (row) => ({
  id: row.id,
  timestamp: row.created_at,
  serialNo: row.serial_no,
  name: row.employee_name,
  email: row.email || "",
  mobileNo: row.mobile_no || "",
  problem: row.problem,
  description: row.description,
  screenshot: row.screenshot_url || "",
  suggestion: row.suggestion || "",
  status: row.status === "Pending" ? "" : row.status,
  statusDate: row.status_date || "",
  isPending: row.status === "Pending",
  isHistory: row.status !== "Pending",
});

export const fetchFeedbackApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapFeedbackFromDb) };
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createFeedbackApi = async ({
  name,
  email,
  mobileNo,
  problem,
  description,
  suggestion,
  screenshotUrl,
}) => {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_name: name,
      email: email || null,
      mobile_no: mobileNo || null,
      problem,
      description,
      suggestion: suggestion || null,
      screenshot_url: screenshotUrl || null,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit feedback");
  }
  return mapFeedbackFromDb(result);
};

export const updateFeedbackStatusApi = async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/feedback/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update feedback status");
  }
  return mapFeedbackFromDb(result);
};
