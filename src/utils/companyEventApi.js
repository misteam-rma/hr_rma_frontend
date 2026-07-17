const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Map a DB row (company_events) to the shape CompanyCalendar.jsx renders.
const mapEventFromDb = (row) => ({
  id: `evt-${row.id}`,
  // event_date comes back as an ISO timestamp (midnight); keep just the
  // YYYY-MM-DD part so it matches the plain date strings used for lookups.
  date: row.event_date ? row.event_date.slice(0, 10) : "",
  title: row.title,
  time: row.event_time || "",
  location: row.location || "",
  type: row.event_type || "Event",
  description: row.description || "",
});

export const fetchCompanyEventsApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/company-events`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const rows = await response.json();
    return { success: true, data: rows.map(mapEventFromDb) };
  } catch (error) {
    console.error("Error fetching company events:", error);
    return { success: false, data: [] };
  }
};

export const createCompanyEventApi = async (newEvent) => {
  const response = await fetch(`${API_BASE_URL}/company-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: newEvent.title,
      event_date: newEvent.date,
      event_time: newEvent.time || null,
      location: newEvent.location || null,
      event_type: newEvent.type || "Event",
      description: newEvent.description || null,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create event");
  }
  return { success: true, data: mapEventFromDb(result) };
};
