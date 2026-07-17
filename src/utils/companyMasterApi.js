const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (snake_case) to the shape the Company Master page renders (camelCase)
const mapCompanyFromDb = (row) => ({
  id: row.id,
  companyName: row.company_name,
  companyCode: row.company_code,
  legalBusinessName: row.legal_business_name || "",
  businessType: row.business_type || "",
  industry: row.industry || "",
  dateOfIncorporation: row.date_of_incorporation ? String(row.date_of_incorporation).slice(0, 10) : "",
  website: row.website || "",
  officialEmail: row.official_email || "",
  contactNumber: row.contact_number,
  alternateContact: row.alternate_contact || "",
  companyLogoUrl: row.company_logo_url || "",
  companyDescription: row.company_description || "",
  headOfficeAddress: row.head_office_address || "",
  branchOffices: row.branch_offices || "",
  country: row.country || "",
  state: row.state || "",
  city: row.city || "",
  pincode: row.pincode || "",
  createdAt: row.created_at,
});

export const fetchCompaniesApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/company-master`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapCompanyFromDb) };
  } catch (error) {
    console.error("Error fetching companies:", error);
    return { success: false, error: error.message, data: [] };
  }
};

const buildPayload = (formData) => ({
  company_name: formData.companyName,
  company_code: formData.companyCode,
  legal_business_name: formData.legalBusinessName || null,
  business_type: formData.businessType || null,
  industry: formData.industry || null,
  date_of_incorporation: formData.dateOfIncorporation || null,
  website: formData.website || null,
  official_email: formData.officialEmail || null,
  contact_number: formData.contactNumber,
  alternate_contact: formData.alternateContact || null,
  company_logo_url: formData.companyLogoUrl || null,
  company_description: formData.companyDescription || null,
  head_office_address: formData.headOfficeAddress || null,
  branch_offices: formData.branchOffices || null,
  country: formData.country || null,
  state: formData.state || null,
  city: formData.city || null,
  pincode: formData.pincode || null,
});

export const createCompanyApi = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/company-master`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload(formData)),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create company");
  }
  return { success: true, data: mapCompanyFromDb(result) };
};

export const updateCompanyApi = async (id, formData) => {
  const response = await fetch(`${API_BASE_URL}/company-master/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPayload(formData)),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update company");
  }
  return { success: true, data: mapCompanyFromDb(result) };
};

export const deleteCompanyApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/company-master/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Failed to delete company");
  }
  return { success: true };
};
