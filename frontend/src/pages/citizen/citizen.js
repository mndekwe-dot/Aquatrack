function requireCitizen() {
  const role = window.aquatrackApi.getRole();
  const token = window.aquatrackApi.getToken();
  if (!token || role !== "citizen") {
    window.location.href = "/../../../login.html";
    return false;
  }
  return true;
}

function citizenLogout() {
  window.aquatrackApi.clearSession();
  window.location.replace("/login.html");
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

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", citizenLogout);
});
