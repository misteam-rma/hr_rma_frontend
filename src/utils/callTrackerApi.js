const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (candidate_enquiries joined with indents, status = 'NeedMore')
// to the shape CallTracker.jsx renders (camelCase, matching the old
// sheet-derived fields used by the Pending tab).
const mapPendingFromDb = (row) => ({
  id: row.id,
  indentNo: row.indent_number || "",
  candidateEnquiryNo: row.candidate_enquiry_number,
  indentType: row.indent_type || "",
  applyingForPost: row.post || "",
  department: row.department || "",
  candidateName: row.candidate_name,
  candidateDOB: row.dob || "",
  candidatePhone: row.phone_number,
  candidateEmail: row.email || "",
  previousCompany: row.previous_company || "",
  jobExperience: row.job_experience || "",
  previousPosition: row.previous_position || "",
  reasonForLeaving: row.reason_for_leaving || "",
  maritalStatus: row.marital_status || "",
  lastSalary: row.last_salary_drawn || "",
  candidatePhoto: row.candidate_photo_url || "",
  gender: row.gender || row.indent_gender || "",
  presentAddress: row.present_address || "",
  aadharNo: row.aadhar_number || "",
  candidateResume: row.resume_copy_url || "",
  createdAt: row.created_at,
});

// Map a call_follow_ups row (joined with candidate_enquiries) to the shape
// CallTracker.jsx renders for the History tab.
const mapHistoryFromDb = (row) => ({
  id: row.id,
  timestamp: row.created_at,
  enquiryNo: row.candidate_enquiry_number,
  status: row.status,
  candidateSays: row.candidate_says,
  nextDate: row.next_date || "",
});

export const fetchPendingCallsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/call-tracker/pending`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapPendingFromDb);
};

export const fetchCallHistoryApi = async () => {
  const response = await fetch(`${API_BASE_URL}/call-tracker/history`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapHistoryFromDb);
};

export const createFollowUpApi = async ({ enquiryId, status, candidateSays, nextDate }) => {
  const response = await fetch(`${API_BASE_URL}/call-tracker/follow-ups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      enquiry_id: enquiryId,
      status,
      candidate_says: candidateSays,
      next_date: nextDate || null,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit follow-up");
  }
  return result;
};
