const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (candidate_enquiries joined with indents, status = 'Joined')
// to the shape Joining.jsx renders (camelCase, matching the old
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
});

// Map an employee_joinings row (joined with candidate_enquiries) to the
// shape Joining.jsx renders for the History tab.
const mapHistoryFromDb = (row) => ({
  id: row.id,
  timestamp: row.created_at,
  joiningId: row.joining_number,
  enquiryNo: row.candidate_enquiry_number || "",
  indentType: row.indent_type || "",
  department: row.department || "",
  designation: row.designation || "",
  nameAsPerAadhar: row.name_as_per_aadhar,
  gender: row.gender || "",
  dob: row.dob || "",
  mobileNo: row.mobile_no || "",
  email: row.personal_email || "",
  emergencyName: row.emergency_contact_name || "",
  familyMobileNo: row.emergency_contact_number || "",
  relationship: row.relationship_with_emergency || "",
  qualification: row.highest_qualification || "",
  aadharNo: row.aadhar_number || "",
  aadharPhoto: row.aadhar_photo_url || "",
  permanentAddress: row.permanent_address || "",
  currentAddress: row.current_address || "",
  dateOfJoining: row.date_of_joining || "",
  teamHead: row.team_head || "",
  registrationUnder: row.registration_under || "",
  bankName: row.bank_name || "",
  bankAc: row.bank_account_no || "",
  ifsc: row.ifsc_code || "",
  candidatePhoto: row.candidate_photo_url || "",
  bankPassbook: row.bank_passbook_photo_url || "",
  panPhoto: row.pan_card_photo_url || "",
  studentIdPhoto: row.student_id_card_photo_url || "",
  resume: row.resume_copy_url || "",
  reportingTo: row.reporting_to || "",
});

export const fetchPendingJoiningsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/joinings/pending`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapPendingFromDb);
};

export const fetchJoiningHistoryApi = async () => {
  const response = await fetch(`${API_BASE_URL}/joinings/history`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapHistoryFromDb);
};

export const fetchJoiningByIdApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/joinings/${id}`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const row = await response.json();
  return mapHistoryFromDb(row);
};

// fields: subset of { mobileNo, email, familyMobileNo, currentAddress, candidatePhoto }
export const updateJoiningApi = async (id, fields) => {
  const payload = {
    ...(fields.mobileNo !== undefined && { mobile_no: fields.mobileNo }),
    ...(fields.email !== undefined && { personal_email: fields.email }),
    ...(fields.familyMobileNo !== undefined && { emergency_contact_number: fields.familyMobileNo }),
    ...(fields.currentAddress !== undefined && { current_address: fields.currentAddress }),
    ...(fields.candidatePhoto !== undefined && { candidate_photo_url: fields.candidatePhoto }),
  };

  const response = await fetch(`${API_BASE_URL}/joinings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update profile");
  }
  return mapHistoryFromDb(result);
};

export const createJoiningApi = async (form) => {
  const payload = {
    enquiry_id: form.enquiryId || null,
    indent_type: form.indentType || null,
    department: form.department || null,
    designation: form.designation || null,
    name_as_per_aadhar: form.nameAsPerAadhar,
    gender: form.gender || null,
    dob: form.dob || null,
    mobile_no: form.mobileNo || null,
    personal_email: form.personalEmail || null,
    emergency_contact_name: form.emergencyContactName || null,
    emergency_contact_number: form.emergencyContactNumber || null,
    relationship_with_emergency: form.relationshipWithEmergency || null,
    highest_qualification: form.highestQualification || null,
    aadhar_number: form.aadharNumber || null,
    aadhar_photo_url: form.aadharPhotoUrl || null,
    permanent_address: form.permanentAddress || null,
    current_address: form.currentAddress || null,
    date_of_joining: form.dateOfJoining || null,
    team_head: form.teamHead || null,
    registration_under: form.registrationUnder || null,
    bank_name: form.bankName || null,
    bank_account_no: form.bankAccountNo || null,
    ifsc_code: form.ifscCode || null,
    candidate_photo_url: form.candidatePhotoUrl || null,
    bank_passbook_photo_url: form.bankPassbookPhotoUrl || null,
    pan_card_photo_url: form.panCardPhotoUrl || null,
    student_id_card_photo_url: form.studentIdCardPhotoUrl || null,
    resume_copy_url: form.resumeCopyUrl || null,
    reporting_to: form.reportingTo || null,
  };

  const response = await fetch(`${API_BASE_URL}/joinings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit joining");
  }
  return result;
};
