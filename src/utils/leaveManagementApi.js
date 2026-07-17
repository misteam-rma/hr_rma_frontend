const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (leave_requests) to the shape LeaveManagement.jsx renders.
const mapLeaveFromDb = (row) => ({
  id: row.id,
  leaveNumber: row.leave_number,
  timestamp: row.created_at,
  employeeId: row.employee_id,
  employeeName: row.employee_name,
  employeeCode: row.employee_code || "",
  employeeType: row.employee_type || "",
  department: row.department || "",
  leaveType: row.leave_type,
  reason: row.reason || "",
  startDate: row.start_date,
  endDate: row.end_date,
  approveBy: row.approve_by || "",
  status: row.status,
  actual1: row.decided_at || "",
  remarks: row.remarks || "",
});

export const fetchLeavesApi = async (employeeId) => {
  try {
    const url = employeeId
      ? `${API_BASE_URL}/leave-management?employee_id=${encodeURIComponent(employeeId)}`
      : `${API_BASE_URL}/leave-management`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapLeaveFromDb) };
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createLeaveApi = async (formData) => {
  const payload = {
    employee_id: formData.employeeId,
    employee_name: formData.employeeName,
    employee_code: formData.employeeCode || null,
    employee_type: formData.employeeType || null,
    department: formData.department || null,
    leave_type: formData.leaveType,
    reason: formData.reason || null,
    start_date: formData.startDate,
    end_date: formData.endDate,
    approve_by: formData.approveBy || null,
    remarks: formData.remarks || null,
  };

  const response = await fetch(`${API_BASE_URL}/leave-management`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to submit leave request");
  }
  return { success: true, data: mapLeaveFromDb(result) };
};

export const updateLeaveStatusApi = async (id, status, remarks) => {
  const response = await fetch(`${API_BASE_URL}/leave-management/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, remarks }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update leave request");
  }
  return { success: true, data: mapLeaveFromDb(result) };
};
