function showError(message) {
  const box = document.getElementById("errorBox");
  if (!box) { alert(message); return; }
  box.textContent = message;
  box.style.display = "block";
}

function setLoading(btn, isLoading, idleText) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Please wait..." : idleText;
}

document.addEventListener("DOMContentLoaded", () => {

  // LOGIN
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("submitBtn");
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value;

      setLoading(btn, true, "Sign In");
      try {
        const data = await window.aquatrackApi.citizenLogin(phone, password);
        window.aquatrackApi.setSession(data.token, data.user, "citizen");
        window.location.href = "src/pages/citizen/home.html";
      } catch (err) {
          showError("Invalid phone number or password.");

      } finally {
        setLoading(btn, false, "Sign In");
      }
    });
  }

  // REGISTER
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("submitBtn");

      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm_password").value;

      if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
      }

      const payload = {
        full_name: document.getElementById("full_name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim() || undefined,
        district: document.getElementById("district").value,
        sector: document.getElementById("sector").value.trim(),
        meter_id: document.getElementById("meter_id").value.trim(),
        password,
      };

      setLoading(btn, true, "Create Account");
      try {
        const data = await window.aquatrackApi.citizenRegister(payload);
        window.aquatrackApi.setSession(data.token, data.user, "citizen");
        window.location.href = "src/pages/citizen/home.html";
      } catch (err) {
        showError(err.message || "Registration failed. Please check your details and try again.");
      } finally {
        setLoading(btn, false, "Create Account");
      }
    });
  }

});

document.addEventListener("DOMContentLoaded", () => {

    // Citizen Login
    const citizenForm = document.getElementById("citizenLoginForm");

    if (citizenForm) {
        citizenForm.addEventListener("submit", function(e) {

            e.preventDefault();

            window.location.href = "citizen-dashboard.html";

        });
    }

    // WASAC Login
    const wasacForm = document.getElementById("wasacLoginForm");

    if (wasacForm) {
        wasacForm.addEventListener("submit", function(e) {

            e.preventDefault();

            window.location.href = "wasac-dashboard.html";

        });
    }

});
