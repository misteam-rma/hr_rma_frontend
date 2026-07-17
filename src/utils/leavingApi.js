const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map an employee_joinings row (joined with candidate_enquiries, no
// employee_leavings row yet) to the shape Leaving.jsx renders for the
// Pending tab. father_name / firm_name / working_location aren't stored
// on employee_joinings — they're only captured once the exit is
// processed — so they come back empty here until then.
const mapPendingFromDb = (row) => ({
  id: row.id,
  employeeNo: row.joining_number || "",
  enquiryNo: row.enquiry_number || "",
  indentType: row.indent_type || "",
  department: row.department || "",
  designation: row.designation || "",
  candidateName: row.name_as_per_aadhar || "",
  gender: row.gender || "",
  dob: row.dob || "",
  mobileNo: row.mobile_no || "",
  personalEmail: row.personal_email || "",
  emergencyName: row.emergency_contact_name || "",
  familyMobileNo: row.emergency_contact_number || "",
  relationship: row.relationship_with_emergency || "",
  qualification: row.highest_qualification || "",
  aadharCardNo: row.aadhar_number || "",
  aadharPhoto: row.aadhar_photo_url || "",
  permanentAddress: row.permanent_address || "",
  currentAddress: row.current_address || "",
  dateOfJoining: row.date_of_joining || "",
  teamHead: row.team_head || "",
  registrationUnder: row.registration_under || "",
  bankName: row.bank_name || "",
  bankAccount: row.bank_account_no || "",
  ifscCode: row.ifsc_code || "",
  candidatePhoto: row.candidate_photo_url || "",
  bankPassbookPhoto: row.bank_passbook_photo_url || "",
  panPhoto: row.pan_card_photo_url || "",
  studentIdPhoto: row.student_id_card_photo_url || "",
  resumeCopy: row.resume_copy_url || "",
  reportingTo: row.reporting_to || "",
  fatherName: "",
  firmName: "",
  workingLocation: "",
});

// Map an employee_leavings row (joined with employee_joinings and
// candidate_enquiries) to the shape Leaving.jsx renders for the History tab.
const mapHistoryFromDb = (row) => ({
  id: row.id,
  employeeId: row.joining_number || "",
  enquiryNo: row.enquiry_number || "",
  indentType: row.indent_type || "",
  name: row.name_as_per_aadhar || "",
  department: row.department || "",
  designation: row.designation || "",
  dateOfJoining: row.date_of_joining || "",
  mobileNo: row.mobile_no || "",
  dateOfLeaving: row.date_of_leaving || "",
  reasonOfLeaving: row.reason_of_leaving || "",
  firmName: row.firm_name || "",
  fatherName: row.father_name || "",
  workingLocation: row.working_location || "",
});

export const fetchPendingLeavingsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/leavings/pending`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapPendingFromDb);
};

export const fetchLeavingHistoryApi = async () => {
  const response = await fetch(`${API_BASE_URL}/leavings/history`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapHistoryFromDb);
};

export const createLeavingApi = async (form) => {
  const payload = {
    joining_id: form.joiningId,
    date_of_leaving: form.dateOfLeaving || null,
    mobile_no: form.mobileNumber || null,
    reason_of_leaving: form.reasonOfLeaving,
    firm_name: form.firmName || null,
    father_name: form.fatherName || null,
    working_location: form.workLocation || null,
  };

  const response = await fetch(`${API_BASE_URL}/leavings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to process exit");
  }
  return result;
};
