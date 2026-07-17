const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Reuses the same endpoints Leaving.jsx is built on (an employee_joinings
// row with no employee_leavings row yet is "Active"; one with a leavings
// row is "Left"), mapped to the field names Employee.jsx renders.
// fatherName/workingLocation aren't stored on employee_joinings — they're
// only captured once an exit is processed — so Active rows show them blank.
const mapActiveFromDb = (row) => ({
  employeeId: row.joining_number || "",
  candidateName: row.name_as_per_aadhar || "",
  name: row.name_as_per_aadhar || "",
  fatherName: "",
  dateOfJoining: row.date_of_joining || "",
  designation: row.designation || "",
  aadharPhoto: row.aadhar_photo_url || "",
  candidatePhoto: row.candidate_photo_url || "",
  address: row.permanent_address || row.current_address || "",
  dateOfBirth: row.dob || "",
  gender: row.gender || "",
  mobileNo: row.mobile_no || "",
  familyNo: row.emergency_contact_number || "",
  relationshipWithFamily: row.relationship_with_emergency || "",
  accountNo: row.bank_account_no || "",
  ifsc: row.ifsc_code || "",
  passbook: row.bank_passbook_photo_url || "",
  emailId: row.personal_email || "",
  department: row.department || "",
  workingLocation: "",
  enquiryNo: row.enquiry_number || "",
  indentType: row.indent_type || "",
  reasonOfLeaving: "",
});

const mapLeftFromDb = (row) => ({
  employeeId: row.joining_number || "",
  name: row.name_as_per_aadhar || "",
  gender: row.gender || "",
  enquiryNo: row.enquiry_number || "",
  indentType: row.indent_type || "",
  fatherName: row.father_name || "",
  designation: row.designation || "",
  department: row.department || "",
  workingLocation: row.working_location || "",
  reasonOfLeaving: row.reason_of_leaving || "",
  dateOfJoining: row.date_of_joining || "",
  dateOfLeaving: row.date_of_leaving || "",
  mobileNo: row.mobile_no || "",
});

export const fetchActiveEmployeesApi = async () => {
  const response = await fetch(`${API_BASE_URL}/leavings/pending`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapActiveFromDb);
};

export const fetchLeftEmployeesApi = async () => {
  const response = await fetch(`${API_BASE_URL}/leavings/history`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapLeftFromDb);
};
