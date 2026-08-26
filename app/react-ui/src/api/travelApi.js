const BASE = '/travel';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}

// Auth
export const login = (email, password) =>
  fetchJson(`${BASE}/login`, { method: 'POST', body: JSON.stringify({ email, password }) });

// Employees
export const getEmployee = (id) => fetchJson(`${BASE}/Employees('${id}')`);

// Travels
export const getTravels = (employeeId) =>
  fetchJson(`${BASE}/Travels?$filter=employee_ID eq '${employeeId}'&$expand=employee`).then(d => d.value || []);

export const createTravel = (data) =>
  fetchJson(`${BASE}/Travels`, { method: 'POST', body: JSON.stringify(data) });

export const updateTravel = (id, data) =>
  fetchJson(`${BASE}/Travels('${id}')`, { method: 'PATCH', body: JSON.stringify(data) });

// Dashboard
export const getDashboardStats = () => fetchJson(`${BASE}/getDashboardStats()`);
export const getTravellingToday = () => fetchJson(`${BASE}/getTravellingToday()`).then(d => d.value || []);
export const getCountryDistribution = () => fetchJson(`${BASE}/getCountryDistribution()`).then(d => d.value || []);
export const getDomesticDistribution = () => fetchJson(`${BASE}/getDomesticDistribution()`).then(d => d.value || []);
export const getUpcomingTravel = () => fetchJson(`${BASE}/getUpcomingTravel()`).then(d => d.value || []);
export const getReturningToday = () => fetchJson(`${BASE}/getReturningToday()`).then(d => d.value || []);
export const getCurrentlyAbroad = () => fetchJson(`${BASE}/getCurrentlyAbroad()`).then(d => d.value || []);
export const getCalendarData = (year, month) =>
  fetchJson(`${BASE}/getCalendarData(year=${year},month=${month})`).then(d => d.value || []);

// Actions
export const approveTravel = (travelId) =>
  fetchJson(`${BASE}/approveTravel`, { method: 'POST', body: JSON.stringify({ travelId }) });
export const rejectTravel = (travelId) =>
  fetchJson(`${BASE}/rejectTravel`, { method: 'POST', body: JSON.stringify({ travelId }) });
export const cancelTravel = (travelId) =>
  fetchJson(`${BASE}/cancelTravel`, { method: 'POST', body: JSON.stringify({ travelId }) });

// Chatbot
export const chatbotAsk = (question) =>
  fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) })
    .then(r => r.json());
