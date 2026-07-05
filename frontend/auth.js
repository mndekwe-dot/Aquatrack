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