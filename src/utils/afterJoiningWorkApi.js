const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (employee_joinings joined with after_joining_work,
// employee_assets, candidate_enquiries) to the shape AfterJoiningWork.jsx
// renders (camelCase, matching the old sheet-derived fields).
const mapJoiningFromDb = (row) => ({
  id: row.id,
  joiningNo: row.joining_number,
  enquiryNo: row.enquiry_number || "",
  indentType: row.indent_type || "",
  department: row.department || "",
  designation: row.designation || "",
  candidateName: row.name_as_per_aadhar || "",
  gender: row.gender || "",
  bodAsPerAadhar: row.dob || "",
  mobileNo: row.mobile_no || "",
  email: row.personal_email || "",
  emergencyName: row.emergency_contact_name || "",
  familyMobileNo: row.emergency_contact_number || "",
  relationWithFamily: row.relationship_with_emergency || "",
  qualification: row.highest_qualification || "",
  aadharNo: row.aadhar_number || "",
  aadharPhoto: row.aadhar_photo_url || "",
  addressAsPerAadhar: row.permanent_address || "",
  currentAddress: row.current_address || "",
  dateOfJoining: row.date_of_joining || "",
  teamHead: row.team_head || "",
  registrationUnder: row.registration_under || "",
  bankName: row.bank_name || "",
  accountNo: row.bank_account_no || "",
  ifscCode: row.ifsc_code || "",
  candidatePhoto: row.candidate_photo_url || "",
  passbookPhoto: row.bank_passbook_photo_url || "",
  panPhoto: row.pan_card_photo_url || "",
  studentIdPhoto: row.student_id_card_photo_url || "",
  resumeCopy: row.resume_copy_url || "",
  reportingTo: row.reporting_to || "",

  // Onboarding checklist (after_joining_work)
  checkSalarySlipResume: !!row.check_salary_slip_resume,
  checkSalarySlipResumeImageUrl: row.check_salary_slip_resume_url || "",
  offerLetterReceived: !!row.offer_letter_received,
  offerLetterImageUrl: row.offer_letter_url || "",
  welcomeMeeting: !!row.welcome_meeting,
  welcomeMeetingImageUrl: row.welcome_meeting_url || "",
  biometricAccess: !!row.biometric_access,
  officialEmailId: !!row.official_email_id,
  assignAssets: !!row.assign_assets,
  pfEsic: !!row.pf_esic,
  pfEsicImageUrl: row.pf_esic_url || "",
  companyDirectory: !!row.company_directory,
  onboardingCompletedAt: row.onboarding_completed_at || null,

  // Assets & credentials (employee_assets) — prefilled into the modal
  emailId: row.asset_email_id || "",
  emailPassword: row.asset_email_password || "",
  laptopCompanyName: row.laptop_company_name || "",
  laptopModelNumber: row.laptop_model_number || "",
  laptopImei: row.laptop_imei || "",
  mobileName: row.mobile_name || "",
  mobileModelName: row.mobile_model_number || "",
  mobileImei: row.mobile_imei || "",
  vehicleName: row.vehicle_name || "",
  vehicleNumber: row.vehicle_number || "",
  simCompanyName: row.sim_company_name || "",
  simNumber: row.sim_number || "",
  idCode: row.id_code || "",
  idPin: row.id_pin || "",
  idPassword: row.id_password || "",

  // History table field aliases (matches old Assets-sheet-derived shape)
  timestamp: row.created_at,
  employeeId: row.joining_number,
  employeeType: row.indent_type,
});

export const fetchAfterJoiningPendingApi = async () => {
  const response = await fetch(`${API_BASE_URL}/after-joining-work/pending`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapJoiningFromDb);
};

export const fetchAfterJoiningHistoryApi = async () => {
  const response = await fetch(`${API_BASE_URL}/after-joining-work/history`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapJoiningFromDb);
};

export const submitAfterJoiningWorkApi = async (joiningId, payload) => {
  const response = await fetch(`${API_BASE_URL}/after-joining-work/${joiningId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit onboarding checklist");
  }
  return result;
};
