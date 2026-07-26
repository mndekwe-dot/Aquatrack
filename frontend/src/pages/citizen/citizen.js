function requireCitizen() {
  const role = window.aquatrackApi.getRole();
  const token = window.aquatrackApi.getToken();
  if (!token || role !== "citizen") {
    window.location.replace(new URL("../../../login.html", window.location.href));
    return false;
  }
  return true;
}

function citizenLogout() {
  // Logout is client-side because authentication uses stateless JWTs.
  // Use a relative URL so it works whether the site is served from the
  // frontend folder or from a repository/deployment subpath.
  window.aquatrackApi?.clearSession?.();
  localStorage.removeItem("aquatrack_token");
  localStorage.removeItem("aquatrack_user");
  localStorage.removeItem("aquatrack_role");
  window.location.replace(new URL("../../../login.html", window.location.href));
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
  applyTranslations();
  window._onLangChange = () => applyTranslations();
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", citizenLogout);
});
