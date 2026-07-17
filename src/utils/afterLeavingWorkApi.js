const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map an employee_leavings row (joined with employee_joinings, no
// after_leaving_work row yet or not yet completed) to the shape
// AfterLeavingWork.jsx renders for the Pending tab.
const mapPendingFromDb = (row) => ({
  id: row.id,
  employeeId: row.joining_number || "",
  name: row.name_as_per_aadhar || "",
  dateOfLeaving: row.date_of_leaving || "",
  mobileNo: row.mobile_no || "",
  reasonOfLeaving: row.reason_of_leaving || "",
  firmName: row.firm_name || "",
  fatherName: row.father_name || "",
  dateOfJoining: row.date_of_joining || "",
  workingLocation: row.working_location || "",
  designation: row.designation || "",
  department: row.department || "",
});

// Map an employee_leavings row (joined with employee_joinings and a
// completed after_leaving_work row) to the shape AfterLeavingWork.jsx
// renders for the History tab. Checklist booleans are rendered as
// Yes/No strings to match the old sheet-derived display.
const mapHistoryFromDb = (row) => ({
  id: row.id,
  employeeId: row.joining_number || "",
  name: row.name_as_per_aadhar || "",
  department: row.department || "",
  resignationLetterReceived: row.resignation_letter_received ? "Yes" : "No",
  resignationAcceptance: row.resignation_acceptance ? "Yes" : "No",
  handoverAssetsIdVisitingCard: row.handover_assets_id_visiting_card ? "Yes" : "No",
  cancellationEmailBiometric: row.cancellation_email_biometric ? "Yes" : "No",
  finalReleaseDate: row.final_release_date || "",
  removeBenefitEnrollment: row.remove_benefit_enrollment ? "Yes" : "No",
  noDues: row.no_dues ? "Yes" : "No",
});

export const fetchAfterLeavingPendingApi = async () => {
  const response = await fetch(`${API_BASE_URL}/after-leaving-work/pending`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapPendingFromDb);
};

export const fetchAfterLeavingHistoryApi = async () => {
  const response = await fetch(`${API_BASE_URL}/after-leaving-work/history`);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const rows = await response.json();
  return rows.map(mapHistoryFromDb);
};

export const submitAfterLeavingWorkApi = async (leavingId, formData) => {
  const payload = {
    resignation_letter_received: !!formData.resignationLetterReceived,
    resignation_acceptance: !!formData.resignationAcceptance,
    handover_assets_id_visiting_card: !!formData.handoverAssetsIdVisitingCard,
    cancellation_email_biometric: !!formData.cancellationEmailBiometric,
    remove_benefit_enrollment: !!formData.removeBenefitEnrollment,
    no_dues: !!formData.noDues,
    final_release_date: formData.finalReleaseDate || null,
  };

  const response = await fetch(`${API_BASE_URL}/after-leaving-work/${leavingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit exit checklist");
  }
  return result;
};
