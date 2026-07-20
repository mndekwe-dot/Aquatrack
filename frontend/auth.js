const API = 'http://localhost:5000/api';

function showError(formId, message) {
  const form = document.getElementById(formId);
  let errorDiv = form.querySelector('.auth-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.style.cssText = 'color:#e74c3c;background:#fdecea;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:14px;';
    form.prepend(errorDiv);
  }
  errorDiv.textContent = message;
}

document.addEventListener('DOMContentLoaded', () => {

  // ── WASAC Staff Login ──
  const wasacForm = document.getElementById('wasacLoginForm');
  if (wasacForm) {
    wasacForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res  = await fetch(`${API}/staff/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          showError('wasacLoginForm', data.message || 'Login failed');
          return;
        }

        localStorage.setItem('aquatrack_token', data.token);
        localStorage.setItem('aquatrack_user',  JSON.stringify(data.staff));
        window.location.href = 'wasac-dashboard.html';

      } catch (err) {
        showError('wasacLoginForm', 'Cannot connect to server. Make sure the backend is running.');
      }
    });
  }

  // ── Citizen Login ──
  const citizenForm = document.getElementById('citizenLoginForm');
  if (citizenForm) {
    citizenForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res  = await fetch(`${API}/households/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          showError('citizenLoginForm', data.message || 'Login failed');
          return;
        }

        localStorage.setItem('citizen_token',     data.token);
        localStorage.setItem('citizen_household', JSON.stringify(data.household));
        window.location.href = 'citizen-dashboard.html';

      } catch (err) {
        showError('citizenLoginForm', 'Cannot connect to server. Make sure the backend is running.');
      }
    });
  }

});
