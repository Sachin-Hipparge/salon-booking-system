const API_URL = "http://localhost:5000";

const registerForm =
    document.getElementById("registerForm");

const message =
    document.getElementById("message");

const registerBtn =
    document.getElementById("registerBtn");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const togglePassword =
    document.getElementById("togglePassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");


// =================================================
// PASSWORD VISIBILITY
// =================================================

togglePassword.addEventListener(
    "click",
    () => {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            togglePassword.textContent =
                "Hide";

        } else {

            passwordInput.type = "password";

            togglePassword.textContent =
                "Show";
        }
    }
);


toggleConfirmPassword.addEventListener(
    "click",
    () => {

        if (
            confirmPasswordInput.type ===
            "password"
        ) {

            confirmPasswordInput.type =
                "text";

            toggleConfirmPassword.textContent =
                "Hide";

        } else {

            confirmPasswordInput.type =
                "password";

            toggleConfirmPassword.textContent =
                "Show";
        }
    }
);


// =================================================
// PHONE VALIDATION
// =================================================

document
    .getElementById("phone")
    .addEventListener(
        "input",
        (event) => {

            event.target.value =
                event.target.value.replace(
                    /\D/g,
                    ""
                );
        }
    );


// =================================================
// REGISTER
// =================================================

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            document
                .getElementById("name")
                .value
                .trim();

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const phone =
            document
                .getElementById("phone")
                .value
                .trim();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // ==========================================
        // CLEAR OLD MESSAGE
        // ==========================================

        message.className =
            "auth-message";

        message.textContent =
            "";


        // ==========================================
        // PASSWORD VALIDATION
        // ==========================================

        if (
            password !==
            confirmPassword
        ) {

            message.className =
                "auth-message error";

            message.textContent =
                "Passwords do not match.";

            return;
        }


        // ==========================================
        // PHONE VALIDATION
        // ==========================================

        if (
            phone.length !== 10
        ) {

            message.className =
                "auth-message error";

            message.textContent =
                "Please enter a valid 10-digit phone number.";

            return;
        }


        // ==========================================
        // DISABLE BUTTON
        // ==========================================

        registerBtn.disabled =
            true;

        registerBtn.innerHTML =
            "Creating account...";


        try {

            // ==========================================
            // REGISTER API
            // ==========================================

            const response =
                await fetch(
                    `${API_URL}/api/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name,
                            email,
                            password,
                            phone
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Registration failed"
                );
            }


            // ==========================================
            // SUCCESS
            // ==========================================

            message.className =
                "auth-message success";

            message.textContent =
                "Account created successfully. Redirecting to login...";


            registerForm.reset();


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                1200
            );


        } catch (error) {

            // ==========================================
            // ERROR
            // ==========================================

            message.className =
                "auth-message error";

            message.textContent =
                error.message ||
                "Unable to create account. Please try again.";


            registerBtn.disabled =
                false;

            registerBtn.innerHTML =
                'Create Account <span>→</span>';
        }
    }
);