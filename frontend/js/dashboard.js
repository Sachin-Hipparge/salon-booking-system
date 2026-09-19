     const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "";

        const token = localStorage.getItem("token");

        let appointments = [];


        // =================================================
        // AUTH CHECK
        // =================================================

        if (!token) {

            window.location.href = "login.html";

        }


        // =================================================
        // ELEMENTS
        // =================================================

        const welcomeName =
            document.getElementById("welcomeName");

        const navUserName =
            document.getElementById("navUserName");

        const profileName =
            document.getElementById("profileName");

        const profileEmail =
            document.getElementById("profileEmail");

        const profilePhone =
            document.getElementById("profilePhone");

        const profileInitial =
            document.getElementById("profileInitial");

        const appointmentsList =
            document.getElementById("appointmentsList");

        const appointmentsLoading =
            document.getElementById("appointmentsLoading");

        const emptyAppointments =
            document.getElementById("emptyAppointments");

        const dashboardMessage =
            document.getElementById("dashboardMessage");


        // =================================================
        // SHOW MESSAGE
        // =================================================

        function showMessage(text, type = "success") {

            dashboardMessage.className =
                `dashboard-message ${type}`;

            dashboardMessage.textContent = text;

            setTimeout(() => {

                dashboardMessage.className =
                    "dashboard-message";

                dashboardMessage.textContent = "";

            }, 3500);

        }


        // =================================================
        // FORMAT DATE
        // =================================================

        function formatDate(dateValue) {

            if (!dateValue) {
                return "-";
            }

            const date =
                new Date(dateValue);

            if (isNaN(date.getTime())) {
                return dateValue;
            }

            return date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        }


        // =================================================
        // FORMAT TIME
        // =================================================

        function formatTime(timeValue) {

            if (!timeValue) {
                return "-";
            }

            const parts =
                String(timeValue).split(":");

            if (parts.length < 2) {
                return timeValue;
            }

            let hour =
                parseInt(parts[0]);

            const minute =
                parts[1];

            const period =
                hour >= 12 ? "PM" : "AM";

            hour =
                hour % 12 || 12;

            return `${hour}:${minute} ${period}`;

        }


        // =================================================
        // STATUS CLASS
        // =================================================

        function getStatusClass(status) {

            switch (status) {

                case "BOOKED":
                    return "status-booked";

                case "COMPLETED":
                    return "status-completed";

                case "CANCELLED":
                    return "status-cancelled";

                case "RESCHEDULED":
                    return "status-rescheduled";

                default:
                    return "";

            }

        }


        // =================================================
        // PAYMENT CLASS
        // =================================================

        function getPaymentClass(status) {

            if (status === "PAID") {
                return "payment-paid";
            }

            if (status === "FAILED") {
                return "payment-failed";
            }

            return "payment-pending";

        }


        // =================================================
        // LOAD PROFILE
        // =================================================

        async function loadProfile() {

            try {

                const response =
                    await fetch(
                        `${API_URL}/api/users/profile`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load profile"
                    );

                }


                const user =
                    data.user || data;


                const name =
                    user.name || "Customer";


                welcomeName.textContent =
                    name.split(" ")[0];

                navUserName.textContent =
                    name;

                profileName.textContent =
                    user.name || "-";

                profileEmail.textContent =
                    user.email || "-";

                profilePhone.textContent =
                    user.phone || "-";

                profileInitial.textContent =
                    name.charAt(0).toUpperCase();


            } catch (error) {

                console.error(
                    "Profile error:",
                    error
                );

            }

        }


        // =================================================
        // LOAD APPOINTMENTS
        // =================================================

        async function loadAppointments() {

            appointmentsLoading.style.display =
                "flex";

            emptyAppointments.style.display =
                "none";

            appointmentsList.innerHTML =
                "";


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/appointments/my`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load appointments"
                    );

                }


                appointments =
                    Array.isArray(data)
                        ? data
                        : (
                            data.appointments ||
                            data.data ||
                            []
                        );


                appointmentsLoading.style.display =
                    "none";


                updateStats();

                renderAppointments();


            } catch (error) {

                appointmentsLoading.style.display =
                    "none";

                console.error(
                    "Appointments error:",
                    error
                );


                appointmentsList.innerHTML = `
                    <div class="error-state">
                        <div class="empty-icon">!</div>

                        <h3>
                            Unable to load appointments
                        </h3>

                        <p>
                            ${error.message}
                        </p>

                        <button
                            class="btn btn-primary"
                            onclick="loadAppointments()">
                            Try Again
                        </button>

                    </div>
                `;

            }

        }



        // =================================================
        // UPDATE STATS
        // =================================================

        function updateStats() {

            const upcoming =
                appointments.filter(
                    appointment =>
                        appointment.status === "BOOKED" ||
                        appointment.status === "RESCHEDULED"
                ).length;


            const completed =
                appointments.filter(
                    appointment =>
                        appointment.status === "COMPLETED"
                ).length;


            const paid =
                appointments.filter(
                    appointment =>
                        appointment.payment_status === "PAID"
                ).length;


            document.getElementById(
                "upcomingCount"
            ).textContent = upcoming;


            document.getElementById(
                "completedCount"
            ).textContent = completed;


            document.getElementById(
                "paidCount"
            ).textContent = paid;




        }

        // =================================================
// LOAD CUSTOMER REVIEW COUNT
// =================================================

async function loadReviewCount() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/reviews/my`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load reviews"
            );

        }


        const reviews =
            data.reviews || [];


        document.getElementById(
            "reviewCount"
        ).textContent = reviews.length;


    } catch (error) {

        console.error(
            "Review count error:",
            error
        );

        document.getElementById(
            "reviewCount"
        ).textContent = 0;

    }

}

        // =================================================
        // RENDER APPOINTMENTS
        // =================================================

        function renderAppointments() {

            if (!appointments.length) {

                emptyAppointments.style.display =
                    "flex";

                return;

            }


            const sortedAppointments =
                [...appointments].sort(
                    (a, b) => {

                        const dateA =
                            new Date(
                                `${a.appointment_date} ${a.start_time || ""}`
                            );

                        const dateB =
                            new Date(
                                `${b.appointment_date} ${b.start_time || ""}`
                            );

                        return dateB - dateA;

                    }
                );


            appointmentsList.innerHTML =
                sortedAppointments.map(
                    appointment =>
                        createAppointmentCard(
                            appointment
                        )
                ).join("");

        }


        // =================================================
        // APPOINTMENT CARD
        // =================================================

        function createAppointmentCard(
            appointment
        ) {

            const appointmentId =
                appointment.id ||
                appointment.appointment_id;


            const serviceName =
                appointment.service_name ||
                appointment.service ||
                "Salon Service";


            const staffName =
                appointment.staff_name ||
                appointment.staff ||
                "Salon Professional";


            const status =
                appointment.status ||
                "BOOKED";


            const paymentStatus =
                appointment.payment_status ||
                "PENDING";


            const canCancel =
                status === "BOOKED" ||
                status === "RESCHEDULED";


            const canPay =
                paymentStatus !== "PAID" &&
                (
                    status === "BOOKED" ||
                    status === "RESCHEDULED"
                );


            const canReview =
                status === "COMPLETED";


            return `

                <article
                    class="appointment-card"
                    data-id="${appointmentId}">

                    <div class="appointment-date">

                        <span class="appointment-date-label">
                            VISIT
                        </span>

                        <strong>
                            ${formatDate(
                                appointment.appointment_date
                            )}
                        </strong>

                        <span>
                            ${formatTime(
                                appointment.start_time
                            )}
                        </span>

                    </div>


                    <div class="appointment-details">

                        <div class="appointment-main">

                            <h3>
                                ${serviceName}
                            </h3>

                            <p>
                                With ${staffName}
                            </p>

                        </div>


                        <div class="appointment-status">

                            <span
                                class="status-badge
                                ${getStatusClass(status)}">

                                ${status}

                            </span>

                            <span
                                class="payment-badge
                                ${getPaymentClass(paymentStatus)}">

                                Payment: ${paymentStatus}

                            </span>

                        </div>

                    </div>


                    <div class="appointment-actions">

                        ${
                            canPay
                                ? `
                                    <button
                                        class="appointment-action primary-action"
                                        onclick="goToPayment(${appointmentId})">

                                        Pay Now

                                    </button>
                                `
                                : ""
                        }


                        ${
                            canReview
                                ? `
                                    <button
                                        class="appointment-action"
                                        onclick="goToReview(${appointmentId})">

                                        ★ Review

                                    </button>
                                `
                                : ""
                        }


                        ${
                            canCancel
                                ? `
                                    <button
                                        class="appointment-action danger-action"
                                        onclick="cancelAppointment(${appointmentId})">

                                        Cancel

                                    </button>
                                `
                                : ""
                        }


                        ${
                            status === "COMPLETED" &&
                            paymentStatus === "PAID"
                                ? `
                                    <button
                                        class="appointment-action"
                                        onclick="viewInvoice(${appointmentId})">

                                        Invoice

                                    </button>
                                `
                                : ""
                        }

                    </div>

                </article>

            `;

        }


        // =================================================
        // CANCEL APPOINTMENT
        // =================================================

        async function cancelAppointment(
            appointmentId
        ) {

            const confirmed =
                confirm(
                    "Are you sure you want to cancel this appointment?"
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/appointments/${appointmentId}/cancel`,
                        {
                            method: "PUT",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to cancel appointment"
                    );

                }


                showMessage(
                    "Appointment cancelled successfully."
                );


                loadAppointments();


            } catch (error) {

                showMessage(
                    error.message,
                    "error"
                );

            }

        }


        // =================================================
        // NAVIGATION HELPERS
        // =================================================

        function goToPayment(
            appointmentId
        ) {

            window.location.href =
                `payment.html?appointmentId=${appointmentId}`;

        }


        function goToReview(
            appointmentId
        ) {

            window.location.href =
                `reviews.html?appointmentId=${appointmentId}`;

        }


        function viewInvoice(
            appointmentId
        ) {

            window.location.href =
                `invoice.html?appointmentId=${appointmentId}`;

        }


        // =================================================
        // VIEW LATEST PAID INVOICE
        // =================================================

        function viewLatestInvoice(event) {

            event.preventDefault();

            const paidAppointments =
                appointments.filter(
                    appointment =>
                        appointment.payment_status === "PAID"
                );


            if (!paidAppointments.length) {

                showMessage(
                    "No paid appointment found.",
                    "error"
                );

                return;

            }


            paidAppointments.sort((a, b) => {

                const dateA =
                    new Date(
                        `${a.appointment_date} ${a.start_time || ""}`
                    );

                const dateB =
                    new Date(
                        `${b.appointment_date} ${b.start_time || ""}`
                    );

                return dateB - dateA;

            });


            const latestAppointment =
                paidAppointments[0];


            const appointmentId =
                latestAppointment.id ||
                latestAppointment.appointment_id;


            if (!appointmentId) {

                showMessage(
                    "Unable to find appointment ID.",
                    "error"
                );

                return;

            }


            window.location.href =
                `invoice.html?appointmentId=${appointmentId}`;

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
        // REFRESH
        // =================================================

        document
            .getElementById("refreshBtn")
            .addEventListener(
                "click",
                loadAppointments
            );


        // =================================================
        // MOBILE MENU
        // =================================================

        const menuBtn =
            document.getElementById("menuBtn");

        const mobileMenu =
            document.getElementById("mobileMenu");


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
loadProfile();

loadAppointments();

loadReviewCount();