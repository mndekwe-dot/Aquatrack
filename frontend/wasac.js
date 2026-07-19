// js/wasac.js

document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // Water Distribution Chart
    // ==========================

    const ctx = document.getElementById("waterChart");

    if (ctx) {

        new Chart(ctx, {

            type: "line",

            data: {

                labels: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul"
                ],

                datasets: [

                    {

                        label: "Water Produced",

                        data: [
                            1800,
                            1950,
                            2100,
                            2250,
                            2150,
                            2300,
                            2450
                        ],

                        borderColor: "#2563EB",

                        backgroundColor: "rgba(37,99,235,0.12)",

                        fill: true,

                        tension: 0.4,

                        pointRadius: 5

                    },

                    {

                        label: "Water Billed",

                        data: [
                            1200,
                            1350,
                            1480,
                            1600,
                            1580,
                            1700,
                            1820
                        ],

                        borderColor: "#10B981",

                        backgroundColor: "rgba(16,185,129,0.08)",

                        fill: false,

                        tension: 0.4,

                        pointRadius: 5

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "top"

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        title: {

                            display: true,

                            text: "Water (m³)"

                        }

                    }

                }

            }

        });

    }

    // ==========================
    // Sidebar Active State
    // ==========================

    const menuItems = document.querySelectorAll(".sidebar li");

    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            menuItems.forEach(i => i.classList.remove("active"));

            item.classList.add("active");

        });

    });

    // ==========================
    // Table Row Click
    // ==========================

    document.querySelectorAll("tbody tr").forEach(row => {

        row.addEventListener("click", () => {

            const firstCell = row.cells[0].innerText;

            alert("Viewing details for " + firstCell);

        });

    });

    // ==========================
    // Demo Live Statistics
    // ==========================

    const statCards = document.querySelectorAll(".card h2");

    setInterval(() => {

        if(statCards.length >= 4){

            const alerts = 30 + Math.floor(Math.random() * 15);

            statCards[2].innerText = alerts;

        }

    }, 5000);

});