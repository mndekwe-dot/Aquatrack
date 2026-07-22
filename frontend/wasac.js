document.addEventListener("DOMContentLoaded", () => {

    const ctx = document.getElementById("waterChart");

    if(ctx){

        new Chart(ctx,{

            type:"line",

            data:{

                labels:["Jan","Feb","Mar","Apr","May","Jun","Jul"],

                datasets:[

                    {

                        label:"Water Produced",

                        data:[1800,1950,2100,2250,2150,2300,2450],

                        borderColor:"#2563EB",

                        backgroundColor:"rgba(37,99,235,.12)",

                        fill:true,

                        tension:.4

                    },

                    {

                        label:"Water Billed",

                        data:[1200,1350,1480,1600,1580,1700,1820],

                        borderColor:"#10B981",

                        fill:false,

                        tension:.4

                    }

                ]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                animation:false

            }

        });

    }

    const menuItems=document.querySelectorAll(".sidebar li");

    menuItems.forEach(item=>{

        item.addEventListener("click",()=>{

            menuItems.forEach(i=>i.classList.remove("active"));

            item.classList.add("active");

        });

    });

    document.querySelectorAll("tbody tr").forEach(row=>{

        row.addEventListener("click",()=>{

            alert("Viewing details for "+row.cells[0].innerText);

        });

    });

});