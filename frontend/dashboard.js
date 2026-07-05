// ===========================
// dashboard.js
// ===========================

document.addEventListener("DOMContentLoaded", () => {

    // Sidebar Active State
    const menuItems = document.querySelectorAll(".menu li");

    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            menuItems.forEach(i => i.classList.remove("active"));

            item.classList.add("active");

        });

    });

    // Generate Report Button
    const reportBtn = document.querySelector(".hero-card button");

    if(reportBtn){

        reportBtn.addEventListener("click", () => {

            alert("Water report generated successfully.");

        });

    }

    // Profile Button
    const profileBtn = document.querySelector(".profile-card button");

    if(profileBtn){

        profileBtn.addEventListener("click", () => {

            alert("Profile page coming soon.");

        });

    }

    // Quick Action Cards
    const actions = document.querySelectorAll(".action-card");

    actions.forEach(card => {

        card.addEventListener("click", () => {

            const title = card.querySelector("h3").textContent;

            alert(title + " selected.");

        });

    });

    // Notification Cards Hover
    const notifications = document.querySelectorAll(".notification");

    notifications.forEach(note => {

        note.addEventListener("mouseenter", () => {

            note.style.background = "#f8fbff";

        });

        note.addEventListener("mouseleave", () => {

            note.style.background = "#fff";

        });

    });

    // Reports Table Hover
    const rows = document.querySelectorAll("tbody tr");

    rows.forEach(row => {

        row.addEventListener("click", () => {

            const id = row.cells[0].innerText;

            alert("Opening Report " + id);

        });

    });

});