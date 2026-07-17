const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (candidate_enquiries joined with indents) to the shape
// FindEnquiry.jsx renders (camelCase, matching the old sheet-derived fields).
const mapEnquiryFromDb = (row) => ({
  id: row.id,
  indentId: row.indent_id,
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
  reasonOfLeaving: row.reason_for_leaving || "",
  maritalStatus: row.marital_status || "",
  lastSalaryDrawn: row.last_salary_drawn || "",
  candidatePhoto: row.candidate_photo_url || "",
  gender: row.gender || row.indent_gender || "",
  presentAddress: row.present_address || "",
  aadharNumber: row.aadhar_number || "",
  resumeCopy: row.resume_copy_url || "",
  status: row.status,
  createdAt: row.created_at,
});

export const fetchEnquiriesApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/enquiries`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapEnquiryFromDb) };
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createEnquiryApi = async (indentId, formData, photoUrl, resumeUrl) => {
  const payload = {
    indent_id: indentId || null,
    candidate_name: formData.candidateName,
    dob: formData.candidateDOB || null,
    gender: formData.gender || null,
    phone_number: formData.candidatePhone,
    email: formData.candidateEmail || null,
    marital_status: formData.maritalStatus || null,
    present_address: formData.presentAddress || null,
    aadhar_number: formData.aadharNo || null,
    previous_company: formData.previousCompany || null,
    job_experience: formData.jobExperience || null,
    previous_position: formData.previousPosition || null,
    reason_for_leaving: formData.reasonForLeaving || null,
    last_salary_drawn: formData.lastSalaryDrawn || null,
    candidate_photo_url: photoUrl || null,
    resume_copy_url: resumeUrl || null,
    status: formData.status || "NeedMore",
  };

  const response = await fetch(`${API_BASE_URL}/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create enquiry");
  }
  return { success: true, data: mapEnquiryFromDb(result) };
};
