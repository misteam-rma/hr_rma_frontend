const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (reimbursement_claims) to the shape Reimbursement.jsx renders.
const mapClaimFromDb = (row) => ({
  id: row.id,
  claimNumber: row.claim_number,
  billMonth: row.bill_month,
  employeeCode: row.employee_code,
  employeeName: row.employee_name,
  employeeType: row.employee_type || "",
  seniorCode: row.senior_code,
  seniorName: row.senior_name || "",
  vehicleType: row.vehicle_type,
  ratePerKm: row.rate_per_km,
  visitPlace: row.visit_place || "",
  visitDate: row.visit_date || "",
  totalKm: row.visit_km,
  totalPrice: row.visit_amount,
  notes: row.notes || "",
  status: row.status,
});

export const fetchReimbursementClaimsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reimbursements`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapClaimFromDb) };
  } catch (error) {
    console.error("Error fetching reimbursement claims:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const fetchReimbursementPlacesApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reimbursements/places`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map((r) => ({ label: r.label, km: r.km })) };
  } catch (error) {
    console.error("Error fetching reimbursement places:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createReimbursementClaimApi = async ({
  billMonth,
  employeeCode,
  employeeName,
  employeeType,
  seniorCode,
  seniorName,
  vehicleType,
  ratePerKm,
  notes,
  visits,
}) => {
  const response = await fetch(`${API_BASE_URL}/reimbursements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bill_month: billMonth,
      employee_code: employeeCode,
      employee_name: employeeName,
      employee_type: employeeType || null,
      senior_code: seniorCode,
      senior_name: seniorName || null,
      vehicle_type: vehicleType,
      rate_per_km: ratePerKm,
      notes: notes || null,
      visits: visits.map((v) => ({ place: v.place, date: v.date, km: v.km })),
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit reimbursement claim");
  }
  return result.map(mapClaimFromDb);
};
