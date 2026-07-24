function requireStaff() {
  const role = window.aquatrackApi.getRole();
  const token = window.aquatrackApi.getToken();
  if (!token || role === "citizen" || !role) {
    window.location.href = "wasac-login.html";
    return false;
  }
  return true;
}

function staffLogout() {
  window.aquatrackApi.clearSession();
  window.location.href = "wasac-login.html";
}

function formatRWF(amount) {
  if (amount === null || amount === undefined) return "—";
  return Number(amount).toLocaleString("en-US") + " RWF";
}

function formatLiters(amount) {
  if (amount === null || amount === undefined) return "—";
  return Number(amount).toLocaleString("en-US") + " L";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function renderStaffFooter() {
  const user = window.aquatrackApi.getUser();
  const el = document.getElementById("staffFooter");
  if (!el || !user) return;
  el.innerHTML = `
    <strong>${user.name || "Staff"}</strong>
    ${user.role ? user.role.replace("_", " ") : ""}
    <br><button class="logout-link" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</button>`;
  document.getElementById("logoutBtn").addEventListener("click", staffLogout);
}

document.addEventListener("DOMContentLoaded", renderStaffFooter);
