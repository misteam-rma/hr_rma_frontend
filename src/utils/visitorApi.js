import { uploadFileApi } from "./uploadApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (visitor_requests) to the shape VisitorApproval.jsx / VisitorEntry.jsx render.
const mapVisitFromDb = (row) => ({
  id: row.id,
  visitNumber: row.visit_number,
  visitorName: row.visitor_name,
  mobileNumber: row.mobile_number,
  email: row.email || "",
  photo: row.photo_url || "",
  personToMeet: row.person_to_meet,
  purposeOfVisit: row.purpose_of_visit || "",
  timeOfEntry: row.time_of_entry || "",
  visitorAddress: row.visitor_address || "",
  userCode: row.user_code || "",
  status: row.status,
  decidedAt: row.decided_at || "",
  closedAt: row.closed_at || "",
  // The old sheet derived this from the Timestamp column rather than storing
  // it separately; created_at fills the same role here.
  dateOfVisit: row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN") : "",
  timestamp: row.created_at,
});

/**
 * Fetch all visits for approval
 */
export const fetchVisitsForApprovalApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/visitor-requests`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, visits: rows.map(mapVisitFromDb) };
  } catch (error) {
    console.error("Error fetching visits:", error);
    return { success: false, visits: [] };
  }
};

/**
 * Create a new visit request
 */
export const createVisitRequestApi = async (data) => {
  let photoUrl = "";
  if (data.photoFile) {
    photoUrl = await uploadFileApi(data.photoFile, "visitor");
  }

  const response = await fetch(`${API_BASE_URL}/visitor-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitor_name: data.visitorName,
      mobile_number: data.mobileNumber,
      email: data.email || null,
      photo_url: photoUrl || null,
      person_to_meet: data.personToMeet,
      purpose_of_visit: data.purposeOfVisit || null,
      time_of_entry: data.timeOfEntry || null,
      visitor_address: data.visitorAddress || null,
      user_code: data.userCode || null,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create visit request");
  }
  return { success: true, data: mapVisitFromDb(result) };
};

export const updateVisitStatusApi = async (id, status) => {
  const response = await fetch(`${API_BASE_URL}/visitor-requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update visit status");
  }
  return { success: true, data: mapVisitFromDb(result) };
};

export const closeVisitApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/visitor-requests/${id}/close`, {
    method: "PATCH",
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to close gate pass");
  }
  return { success: true, data: mapVisitFromDb(result) };
};

/**
 * Fetch the most recent visitor entry by mobile number
 */
export const fetchVisitorByMobileApi = async (mobile) => {
  try {
    const response = await fetch(`${API_BASE_URL}/visitor-requests/by-mobile/${mobile}`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const result = await response.json();
    if (result.found) {
      return { success: true, found: true, data: mapVisitFromDb(result.data) };
    }
    return { success: true, found: false };
  } catch (error) {
    return { success: false, found: false };
  }
};
