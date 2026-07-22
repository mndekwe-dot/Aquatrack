// ===========================
// auth.js
// ===========================

document.addEventListener("DOMContentLoaded", () => {

    // Login Form
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", (e) => {

            e.preventDefault();

            window.location.href = "dashboard.html";

        });

    }

    // Register Form
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", (e) => {

            e.preventDefault();

            alert("Account created successfully!");

            window.location.href = "login.html";

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