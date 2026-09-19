       const menuBtn =
            document.getElementById("menuBtn");


        const mobileMenu =
            document.getElementById("mobileMenu");


        menuBtn.addEventListener("click", () => {

            mobileMenu.classList.toggle("show");


            if (
                mobileMenu.classList.contains("show")
            ) {

                menuBtn.innerHTML = "✕";

            } else {

                menuBtn.innerHTML = "☰";

            }

        });


        document
            .querySelectorAll(".mobile-menu a")
            .forEach(link => {

                link.addEventListener("click", () => {

                    mobileMenu.classList.remove("show");

                    menuBtn.innerHTML = "☰";

                });

            });


        // ==========================================
        // LOGIN STATUS
        // ==========================================

        const token =
            localStorage.getItem("token");


        const navActions =
            document.getElementById("navActions");


        const mobileActions =
            document.getElementById("mobileActions");


        // ==========================================
        // IF USER IS LOGGED IN
        // ==========================================

        if (token) {


            // ==========================================
            // DESKTOP NAVBAR
            // ==========================================

            navActions.innerHTML = `

                <a
                    href="dashboard.html"
                    class="login-link"
                >
                    Dashboard
                </a>


                <button
                    id="logoutBtn"
                    class="btn btn-primary nav-btn"
                >
                    Logout
                </button>

            `;


            // ==========================================
            // MOBILE NAVBAR
            // ==========================================

            mobileActions.innerHTML = `

                <a href="dashboard.html">
                    Dashboard
                </a>


                <button
                    id="mobileLogoutBtn"
                    class="btn btn-primary"
                >
                    Logout
                </button>

            `;


            // ==========================================
            // LOGOUT FUNCTION
            // ==========================================

            function logout() {

                localStorage.removeItem("token");

                localStorage.removeItem("user");

                window.location.href =
                    "login.html";

            }


            // ==========================================
            // DESKTOP LOGOUT
            // ==========================================

            document
                .getElementById("logoutBtn")
                .addEventListener(
                    "click",
                    logout
                );


            // ==========================================
            // MOBILE LOGOUT
            // ==========================================

            document
                .getElementById("mobileLogoutBtn")
                .addEventListener(
                    "click",
                    logout
                );

        }