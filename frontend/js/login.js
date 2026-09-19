 const API_URL = "http://localhost:5000";

        const loginForm = document.getElementById("loginForm");
        const message = document.getElementById("message");
        const loginBtn = document.getElementById("loginBtn");

        const passwordInput = document.getElementById("password");
        const togglePassword = document.getElementById("togglePassword");


        // ================= PASSWORD VISIBILITY =================

        togglePassword.addEventListener("click", () => {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";
                togglePassword.textContent = "Hide";

            } else {

                passwordInput.type = "password";
                togglePassword.textContent = "Show";

            }

        });


        // ================= LOGIN =================

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;


            message.className = "auth-message";
            message.textContent = "";

            loginBtn.disabled = true;
            loginBtn.innerHTML = "Signing in...";


            try {

                const response = await fetch(
                    `${API_URL}/api/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );


                const data = await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message || "Login failed"
                    );

                }


                // Save JWT token

                localStorage.setItem(
                    "token",
                    data.token
                );


                // Save user information if backend sends it

                if (data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                }


                message.className =
                    "auth-message success";

                message.textContent =
                    "Login successful. Redirecting...";


                /*
                    Redirect according to role.

                    CUSTOMER → dashboard
                    ADMIN    → admin dashboard
                    STAFF    → staff dashboard
                */

                const role =
                    data.user?.role || data.role;


                setTimeout(() => {

                    if (role === "ADMIN") {

                        window.location.href =
                            "admin.html";

                    } else if (role === "STAFF") {

                        window.location.href =
                            "staff.html";

                    } else {

                        window.location.href =
                            "dashboard.html";

                    }

                }, 700);


            } catch (error) {

                message.className =
                    "auth-message error";

                message.textContent =
                    error.message ||
                    "Unable to login. Please try again.";


                loginBtn.disabled = false;

                loginBtn.innerHTML =
                    'Sign In <span>→</span>';

            }

        });