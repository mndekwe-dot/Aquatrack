// js/citizen.js

document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // Weekly Usage Chart
    // ==========================

    const chart = document.getElementById("usageChart");

    if(chart){

        new Chart(chart,{

            type:"line",

            data:{

                labels:[
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun"
                ],

                datasets:[{

                    label:"Water Usage (L)",

                    data:[
                        160,
                        175,
                        190,
                        180,
                        210,
                        195,
                        185
                    ],

                    borderColor:"#2563EB",

                    backgroundColor:"rgba(37,99,235,.15)",

                    fill:true,

                    tension:.4,

                    pointRadius:5,

                    pointBackgroundColor:"#2563EB"

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                plugins:{

                    legend:{
                        display:false
                    }

                },

                scales:{

                    y:{

                        beginAtZero:true

                    }

                }

            }

        });

    }

    // ==========================
    // Sidebar Active Menu
    // ==========================

    const menuItems=document.querySelectorAll(".sidebar li");

    menuItems.forEach(item=>{

        item.addEventListener("click",()=>{

            menuItems.forEach(i=>i.classList.remove("active"));

            item.classList.add("active");

        });

    });

    // ==========================
    // Report Status Click
    // ==========================

    const rows=document.querySelectorAll("tbody tr");

    rows.forEach(row=>{

        row.addEventListener("click",()=>{

            const id=row.cells[0].innerText;

            alert("Opening Report "+id);

        });

    });

});