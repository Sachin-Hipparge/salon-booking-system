        const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "";

        const token =
            localStorage.getItem("token");


        // =================================================
        // AUTH CHECK
        // =================================================

        if (!token) {

            window.location.href =
                "login.html";

        }


        // =================================================
        // ELEMENTS
        // =================================================

        const servicesLoading =
            document.getElementById(
                "servicesLoading"
            );

        const servicesGrid =
            document.getElementById(
                "servicesGrid"
            );

        const servicesEmpty =
            document.getElementById(
                "servicesEmpty"
            );

        const servicesMessage =
            document.getElementById(
                "servicesMessage"
            );


        // =================================================
        // LOAD USER
        // =================================================

        async function loadUser() {

            try {

                const response =
                    await fetch(
                        `${API_URL}/api/users/profile`,
                        {
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {
                    return;
                }


                const user =
                    data.user || data;


                if (user.name) {

                    document.getElementById(
                        "navUserName"
                    ).textContent =
                        user.name;

                }

            } catch (error) {

                console.error(
                    "User loading error:",
                    error
                );

            }

        }


        // =================================================
        // LOAD SERVICES
        // =================================================

        async function loadServices() {

            servicesLoading.style.display =
                "flex";

            servicesGrid.innerHTML = "";

            servicesEmpty.style.display =
                "none";


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/services`
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load services"
                    );

                }


                /*
                    Support both:

                    [
                        {...}
                    ]

                    and:

                    {
                        services: [...]
                    }
                */

                let services =
                    Array.isArray(data)
                        ? data
                        : (
                            data.services ||
                            data.data ||
                            []
                        );


                // Show only active services

                services =
                    services.filter(
                        service =>
                            service.status === "ACTIVE"
                    );


                servicesLoading.style.display =
                    "none";


                if (!services.length) {

                    servicesEmpty.style.display =
                        "flex";

                    return;

                }


                servicesGrid.innerHTML =
                    services
                        .map(
                            service =>
                                createServiceCard(
                                    service
                                )
                        )
                        .join("");


            } catch (error) {

                servicesLoading.style.display =
                    "none";


                servicesMessage.className =
                    "dashboard-message error";

                servicesMessage.textContent =
                    error.message ||
                    "Unable to load services.";

            }

        }


        // =================================================
        // CREATE SERVICE CARD
        // =================================================

        function createServiceCard(service) {

            const serviceId =
                service.id ||
                service.service_id;


            const name =
                service.name ||
                "Salon Service";


            const description =
                service.description ||
                "Professional salon service tailored to you.";


            const duration =
                service.duration ||
                "-";


            const price =
                Number(service.price || 0);


            return `

                <article
                    class="service-page-card"
                >

                    <div class="service-page-top">

                        <span class="service-page-number">
                            ${String(serviceId)
                                .padStart(2, "0")}
                        </span>

                        <div class="service-page-icon">
                            ✦
                        </div>

                    </div>


                    <div class="service-page-content">

                        <h2>
                            ${name}
                        </h2>

                        <p>
                            ${description}
                        </p>

                    </div>


                    <div class="service-page-info">

                        <div>

                            <span>
                                DURATION
                            </span>

                            <strong>
                                ${duration} mins
                            </strong>

                        </div>


                        <div>

                            <span>
                                PRICE
                            </span>

                            <strong>
                                ₹${price.toLocaleString("en-IN")}
                            </strong>

                        </div>

                    </div>


                    <button
                        class="btn btn-primary service-book-btn"
                        onclick="bookService(${serviceId})"
                    >
                        Book This Service
                        <span>→</span>
                    </button>

                </article>

            `;

        }


        // =================================================
        // BOOK SERVICE
        // =================================================

        function bookService(serviceId) {

            window.location.href =
                `booking.html?serviceId=${serviceId}`;

        }


        // =================================================
        // LOGOUT
        // =================================================

        function logout() {

            localStorage.removeItem("token");

            localStorage.removeItem("user");

            window.location.href =
                "login.html";

        }


        document
            .getElementById("logoutBtn")
            .addEventListener(
                "click",
                logout
            );


        document
            .getElementById("mobileLogoutBtn")
            .addEventListener(
                "click",
                logout
            );


        // =================================================
        // MOBILE MENU
        // =================================================

        const menuBtn =
            document.getElementById(
                "menuBtn"
            );

        const mobileMenu =
            document.getElementById(
                "mobileMenu"
            );


        menuBtn.addEventListener(
            "click",
            () => {

                mobileMenu.classList.toggle(
                    "show"
                );

                menuBtn.textContent =
                    mobileMenu.classList.contains("show")
                        ? "✕"
                        : "☰";

            }
        );


        // =================================================
        // INITIAL LOAD
        // =================================================

        loadUser();

        loadServices();