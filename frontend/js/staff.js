
    // ==========================================
    // CONFIGURATION
    // ==========================================

    const API_URL = "http://localhost:5000";

    const token = localStorage.getItem("token");


    /*
        Rahul's current staff ID.

        Database:
        Rahul user_id = 2
        Rahul staff_id = 1

        We will remove this hardcoded value
        later when we make the dashboard dynamic.
    */

    // Staff ID is loaded dynamically from /api/staff/me
// for the currently logged-in staff member.
let currentStaffId = null;


    // ==========================================
    // CHECK LOGIN
    // ==========================================

    if (!token) {

        window.location.href = "index.html";

    }


    // ==========================================
    // LOGOUT
    // ==========================================

    function logout() {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        window.location.href = "index.html";

    }


    // ==========================================
    // SHOW MESSAGE
    // ==========================================

    function showMessage(
        elementId,
        message,
        type = ""
    ) {

        const element =
            document.getElementById(elementId);


        if (!element) {
            return;
        }


        element.textContent =
            message;


        element.className =
            "message " + type;


        element.style.display =
            "block";

    }

    // ==========================================
// LOAD LOGGED-IN STAFF PROFILE
// ==========================================

async function loadStaffProfile() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/staff/me`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load staff profile"
            );

        }

        currentStaffId =
            data.staff.staff_id;

        console.log(
            "Logged-in staff ID:",
            currentStaffId
        );

        return data.staff;

    } catch (error) {

        console.error(
            "Staff profile error:",
            error
        );

        showMessage(
            "appointmentMessage",
            error.message,
            "error"
        );

        return null;
    }
}

    // ==========================================
    // LOAD STAFF PROFILE
    // ==========================================

    async function loadProfile() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/users/profile`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (!response.ok) {

                const errorData =
                    await response.json();

                throw new Error(
                    errorData.message ||
                    "Unable to load staff profile"
                );

            }


            const data =
                await response.json();


            /*
               Some APIs return the user directly.
               Some return { user: ... }.
            */

            const user =
                data.user || data;


            document.getElementById(
                "staffName"
            ).textContent =
                user.name || "Staff";


            document.getElementById(
                "welcomeName"
            ).textContent =
                user.name || "Staff";


        } catch (error) {

            console.error(
                "Profile error:",
                error
            );

        }

    }


    // ==========================================
    // LOAD APPOINTMENTS
    // ==========================================

    async function loadAppointments() {

        try {
                if (!currentStaffId) {
    throw new Error(
        "Staff profile is not loaded yet."
    );
}
            const response =
                await fetch(
                    `${API_URL}/api/appointments/staff/${currentStaffId}`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (!response.ok) {

                const errorData =
                    await response.json();

                throw new Error(
                    errorData.message ||
                    "Unable to load appointments"
                );

            }


            const data =
                await response.json();


            /*
               Support both:
               [appointments]
               and
               { appointments: [...] }
            */

            const appointments =
                Array.isArray(data)
                    ? data
                    : (data.appointments || []);


            displayAppointments(
                appointments
            );


        } catch (error) {

            console.error(
                "Appointment error:",
                error
            );


            showMessage(
                "appointmentMessage",
                error.message,
                "error"
            );

        }

    }


    // ==========================================
    // DISPLAY APPOINTMENTS
    // ==========================================

    function displayAppointments(
        appointments
    ) {

        const table =
            document.getElementById(
                "appointmentsTable"
            );


        table.innerHTML = "";


        document.getElementById(
            "totalAppointments"
        ).textContent =
            appointments.length;


        document.getElementById(
            "bookedAppointments"
        ).textContent =
            appointments.filter(
                appointment =>
                    appointment.status === "BOOKED"
            ).length;


        document.getElementById(
            "completedAppointments"
        ).textContent =
            appointments.filter(
                appointment =>
                    appointment.status === "COMPLETED"
            ).length;


        document.getElementById(
            "cancelledAppointments"
        ).textContent =
            appointments.filter(
                appointment =>
                    appointment.status === "CANCELLED"
            ).length;


        if (appointments.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="8">
                        No appointments found.
                    </td>
                </tr>
            `;

            return;

        }


        appointments.forEach(
            appointment => {

                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${appointment.id}
                    </td>

                    <td>
                        ${escapeHTML(
                            appointment.customer_name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            appointment.customer_email
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            appointment.service_name
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            appointment.appointment_date
                        )}
                    </td>

                    <td>
                        ${formatTime(
                            appointment.start_time
                        )}
                        -
                        ${formatTime(
                            appointment.end_time
                        )}
                    </td>

                    <td>

                        <span
                            class="status ${getStatusClass(
                                appointment.status
                            )}"
                        >
                            ${appointment.status}
                        </span>

                    </td>

                    <td>

                        <span
                            class="status ${getPaymentClass(
                                appointment.payment_status
                            )}"
                        >
                            ${appointment.payment_status || "-"}
                        </span>

                    </td>

                `;


                table.appendChild(row);

            }
        );

    }


    // ==========================================
    // FULL DAY LEAVE CHECKBOX
    // ==========================================

    document
        .getElementById("fullDayLeave")
        .addEventListener(
            "change",
            function () {

                const startTime =
                    document.getElementById(
                        "leaveStartTime"
                    );


                const endTime =
                    document.getElementById(
                        "leaveEndTime"
                    );


                if (this.checked) {

                    startTime.value =
                        "00:00";

                    endTime.value =
                        "23:59";

                    startTime.disabled =
                        true;

                    endTime.disabled =
                        true;

                } else {

                    startTime.value =
                        "";

                    endTime.value =
                        "";

                    startTime.disabled =
                        false;

                    endTime.disabled =
                        false;

                }

            }
        );


    // ==========================================
    // SET MINIMUM LEAVE DATE
    // ==========================================

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    document.getElementById(
        "leaveDate"
    ).min = today;


    // ==========================================
    // APPLY FOR LEAVE
    // ==========================================

    document
        .getElementById("leaveForm")
        .addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const leaveDate =
                    document.getElementById(
                        "leaveDate"
                    ).value;


                const startTime =
                    document.getElementById(
                        "leaveStartTime"
                    ).value;


                const endTime =
                    document.getElementById(
                        "leaveEndTime"
                    ).value;


                const reason =
                    document.getElementById(
                        "leaveReason"
                    ).value.trim();


                const message =
                    document.getElementById(
                        "leaveMessage"
                    );


                const submitButton =
                    document.getElementById(
                        "leaveSubmitButton"
                    );


                if (
                    !leaveDate ||
                    !startTime ||
                    !endTime
                ) {

                    message.textContent =
                        "Please fill all required leave details.";

                    message.className =
                        "leave-message error";

                    return;

                }


                if (startTime >= endTime) {

                    message.textContent =
                        "End time must be after start time.";

                    message.className =
                        "leave-message error";

                    return;

                }


                try {

                    submitButton.disabled =
                        true;


                    submitButton.textContent =
                        "Submitting...";


                    const response =
                        await fetch(
                            `${API_URL}/api/leaves`,
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    Authorization:
                                        `Bearer ${token}`

                                },

                                body:
                                    JSON.stringify({

                                        leave_date:
                                            leaveDate,

                                        start_time:
                                            startTime,

                                        end_time:
                                            endTime,

                                        reason:
                                            reason

                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        message.textContent =
                            data.message ||
                            "Failed to apply for leave.";

                        message.className =
                            "leave-message error";

                        return;

                    }


                    message.textContent =
                        data.message ||
                        "Leave request submitted successfully.";

                    message.className =
                        "leave-message success";


                    document.getElementById(
                        "leaveForm"
                    ).reset();


                    document.getElementById(
                        "leaveStartTime"
                    ).disabled =
                        false;


                    document.getElementById(
                        "leaveEndTime"
                    ).disabled =
                        false;


                    await loadMyLeaves();


                } catch (error) {

                    console.error(
                        "Leave application error:",
                        error
                    );


                    message.textContent =
                        "Unable to submit leave request: " +
                        error.message;

                    message.className =
                        "leave-message error";

                } finally {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Apply for Leave";

                }

            }
        );


    // ==========================================
    // LOAD MY LEAVES
    // ==========================================

    async function loadMyLeaves() {

        const tableBody =
            document.getElementById(
                "leaveTableBody"
            );


        try {

            console.log(
                "Loading staff leave requests..."
            );


            const response =
                await fetch(
                    `${API_URL}/api/leaves/my`,
                    {

                        method: "GET",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`

                        }

                    }
                );


            const data =
                await response.json();


            console.log(
                "Staff leave API response:",
                response.status,
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Unable to load leave requests (${response.status})`
                );

            }


            /*
            ==========================================
            IMPORTANT FIX

            Backend returns:

            {
                leaves: [...]
            }

            So we must extract data.leaves.
            ==========================================
            */

            const leaves =
                Array.isArray(data)
                    ? data
                    : (data.leaves || []);


            tableBody.innerHTML = "";


            if (leaves.length === 0) {

                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            No leave requests found.
                        </td>
                    </tr>
                `;

                return;

            }


            leaves.forEach(
                leave => {

                    const row =
                        document.createElement("tr");


                    row.innerHTML = `

                        <td>
                            ${formatLeaveDate(
                                leave.leave_date
                            )}
                        </td>

                        <td>
                            ${formatTime(
                                leave.start_time
                            )}
                        </td>

                        <td>
                            ${formatTime(
                                leave.end_time
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                leave.reason || "-"
                            )}
                        </td>

                        <td>

                            <span
                                class="leave-status ${getLeaveStatusClass(
                                    leave.status
                                )}"
                            >
                                ${leave.status}
                            </span>

                        </td>

                    `;


                    tableBody.appendChild(
                        row
                    );

                }
            );


        } catch (error) {

            console.error(
                "Load leaves error:",
                error
            );


            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load leave requests:
                        ${escapeHTML(
                            error.message
                        )}
                    </td>
                </tr>
            `;

        }

    }


    // ==========================================
    // LOAD STAFF REVIEWS
    // ==========================================

    async function loadReviews() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/reviews/staff/my`,
                    {

                        method: "GET",

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }
                );


            if (!response.ok) {

                const errorData =
                    await response.json();

                throw new Error(
                    errorData.message ||
                    "Unable to load reviews"
                );

            }


            const data =
                await response.json();


            const reviews =
                Array.isArray(data)
                    ? data
                    : (data.reviews || []);


            displayReviews(
                reviews
            );


        } catch (error) {

            console.error(
                "Review error:",
                error
            );


            showMessage(
                "reviewMessage",
                error.message,
                "error"
            );

        }

    }


    // ==========================================
    // DISPLAY REVIEWS
    // ==========================================

    function displayReviews(
        reviews
    ) {

        const container =
            document.getElementById(
                "reviewsContainer"
            );


        container.innerHTML = "";


        if (reviews.length === 0) {

            container.innerHTML = `
                <div class="message">
                    No customer reviews yet.
                </div>
            `;

            return;

        }


        reviews.forEach(
            review => {

                const card =
                    document.createElement("div");


                card.className =
                    "review-card";


                const rating =
                    Number(
                        review.rating
                    );


                const stars =
                    "★".repeat(
                        rating
                    ) +
                    "☆".repeat(
                        5 - rating
                    );


                let responseHTML =
                    "";


                if (
                    review.staff_response &&
                    review.staff_response.trim() !== ""
                ) {

                    responseHTML = `

                        <div class="response-box">

                            <strong>
                                Your Response:
                            </strong>

                            ${escapeHTML(
                                review.staff_response
                            )}

                        </div>

                    `;

                }


                card.innerHTML = `

                    <div class="review-header">

                        <span class="customer-name">

                            ${escapeHTML(
                                review.customer_name
                            )}

                        </span>


                        <span class="stars">

                            ${stars}

                        </span>

                    </div>


                    <div class="review-service">

                        Service:
                        ${escapeHTML(
                            review.service_name
                        )}

                    </div>


                    <div class="review-comment">

                        ${escapeHTML(
                            review.comment ||
                            "No comment provided."
                        )}

                    </div>


                    ${responseHTML}


                    <div class="reply-area">

                        <textarea
                            id="reply-${review.id}"
                            placeholder="${
                                review.staff_response
                                    ? "Update your response..."
                                    : "Write a response to the customer..."
                            }"
                        ></textarea>


                        <button
                            class="reply-btn"
                            onclick="replyToReview(${review.id})"
                        >

                            ${
                                review.staff_response
                                    ? "Update Response"
                                    : "Reply to Customer"
                            }

                        </button>

                    </div>

                `;


                container.appendChild(
                    card
                );

            }
        );

    }


    // ==========================================
    // REPLY TO REVIEW
    // ==========================================

    async function replyToReview(
        reviewId
    ) {

        const textarea =
            document.getElementById(
                `reply-${reviewId}`
            );


        const responseText =
            textarea.value.trim();


        if (!responseText) {

            alert(
                "Please enter a response."
            );

            return;

        }


        try {

            const response =
                await fetch(
                    `${API_URL}/api/reviews/${reviewId}/respond`,
                    {

                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify({
                                response:
                                    responseText
                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to respond to review"
                );

            }


            alert(
                data.message ||
                "Response submitted successfully."
            );


            await loadReviews();


        } catch (error) {

            console.error(
                "Reply error:",
                error
            );


            alert(
                error.message
            );

        }

    }


    // ==========================================
    // FORMAT APPOINTMENT DATE
    // ==========================================

    function formatDate(date) {

        if (!date) {
            return "";
        }


        /*
           Handle MySQL DATE without
           timezone conversion.
        */

        const dateString =
            String(date)
                .split("T")[0];


        const parts =
            dateString.split("-");


        if (parts.length === 3) {

            return (
                `${parts[2]}-${parts[1]}-${parts[0]}`
            );

        }


        return dateString;

    }


    // ==========================================
    // FORMAT LEAVE DATE
    // ==========================================

    function formatLeaveDate(date) {

        if (!date) {
            return "";
        }


        const dateString =
            String(date)
                .split("T")[0];


        const parts =
            dateString.split("-");


        if (parts.length === 3) {

            return (
                `${parts[2]}-${parts[1]}-${parts[0]}`
            );

        }


        return dateString;

    }


    // ==========================================
    // FORMAT TIME
    // ==========================================

    function formatTime(time) {

        if (!time) {
            return "";
        }


        return String(time)
            .substring(0, 5);

    }


    // ==========================================
    // APPOINTMENT STATUS CLASS
    // ==========================================

    function getStatusClass(status) {

        if (status === "BOOKED") {
            return "booked";
        }


        if (status === "COMPLETED") {
            return "completed";
        }


        if (status === "CANCELLED") {
            return "cancelled";
        }


        if (status === "RESCHEDULED") {
            return "rescheduled";
        }


        return "";

    }


    // ==========================================
    // PAYMENT STATUS CLASS
    // ==========================================

    function getPaymentClass(status) {

        if (status === "PAID") {
            return "paid";
        }


        return "pending";

    }


    // ==========================================
    // LEAVE STATUS CLASS
    // ==========================================

    function getLeaveStatusClass(status) {

        if (status === "PENDING") {
            return "leave-pending";
        }


        if (status === "APPROVED") {
            return "leave-approved";
        }


        if (status === "REJECTED") {
            return "leave-rejected";
        }


        if (status === "CANCELLED") {
            return "leave-cancelled";
        }


        return "";

    }


    // ==========================================
    // BASIC HTML ESCAPING
    // ==========================================

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }

// ==========================================
// INITIAL LOAD
// ==========================================

async function initializeDashboard() {

    const staff =
        await loadStaffProfile();

    if (!staff) {
        return;
    }

    await loadProfile();

    await loadAppointments();

    await loadMyLeaves();

    await loadReviews();
}

initializeDashboard();