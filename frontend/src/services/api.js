// Change this to your deployed backend URL when you go live
const API_BASE_URL = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("aquatrack_token");
}

function getRole() {
  return localStorage.getItem("aquatrack_role");
}

function setSession(token, user, role) {
  localStorage.setItem("aquatrack_token", token);
  localStorage.setItem("aquatrack_user", JSON.stringify(user));
  localStorage.setItem("aquatrack_role", role);
}

function clearSession() {
  localStorage.removeItem("aquatrack_token");
  localStorage.removeItem("aquatrack_user");
  localStorage.removeItem("aquatrack_role");
}

function getUser() {
  const raw = localStorage.getItem("aquatrack_user");
  return raw ? JSON.parse(raw) : null;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (!token) {
      window.location.href = "/login.html";
      return;
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    // token missing/expired
    clearSession();
    window.location.href = "/login.html";
    return;
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }

  return data;
}

const api = {
  // Auth
  citizenLogin: (phone, password) =>
    request("/households/login", { method: "POST", body: { phone, password }, auth: false }),

  citizenRegister: (payload) =>
    request("/households/register", { method: "POST", body: payload, auth: false }),

  staffLogin: (email, password) =>
    request("/staff/login", { method: "POST", body: { email, password }, auth: false }),

  changeStaffPassword: (current_password, new_password) =>
      request("/staff/change-password", { method: "POST", body: { current_password, new_password } }),

  createStaff: (payload) =>
      request("/staff/create", { method: "POST", body: payload }),

  // Citizen
  getMyHousehold: () => request("/households/me"),
  updateMyHousehold: (payload) => request("/households/me", { method: "PUT", body: payload }),
  getMySummary: () => request("/households/me/summary"),
  getMyBills: () => request("/reports/billing/mine"),
  getMyIssues: () => request("/reports/issues/mine"),
  submitIssue: (payload) => request("/reports/issues", { method: "POST", body: payload }),
  getMyAlerts: () => request("/alerts/mine"),

  // WASAC staff
  getStaffMe: () => request("/staff/me"),
  getAllAlerts: () => request("/alerts"),
  resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: "PATCH" }),
  getAllIssues: (issueType) => request(`/reports/issues${issueType ? `?issue_type=${issueType}` : ""}`),
  updateIssueStatus: (id, payload) => request(`/reports/issues/${id}/status`, { method: "PATCH", body: payload }),
  getAllHouseholds: () => request("/households"),
  getAllMeters: () => request("/meters"),
  getAllBillingReports: () => request("/reports/billing"),
  getNotifications: () => request("/notifications"),

  // WASAC Admin staff management
  getAllStaff: () => request("/staff"),
  createStaff: (payload) => request("/staff/create", { method: "POST", body: payload }),
  updateStaff: (id, payload) => request(`/staff/${id}`, { method: "PUT", body: payload }),
  changeStaffPassword: (current_password, new_password) =>
      request("/staff/change-password", { method: "POST", body: { current_password, new_password } }),

  // Session helpers
  setSession,
  clearSession,
  getUser,
  getRole,
  getToken,
};

window.aquatrackApi = api;
