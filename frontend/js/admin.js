const API_URL = "http://localhost:5000";

const token = localStorage.getItem("token");

let availableServices = [];

/* =========================================
   AUTHENTICATION CHECK
========================================= */

if (!token) {

    alert("Please login first.");

    window.location.href = "index.html";

}


/* =========================================
   COMMON FETCH FUNCTION
========================================= */

async function apiRequest(url, options = {}) {

    const response = await fetch(
        API_URL + url,
        {
            ...options,

            headers: {

                "Content-Type": "application/json",

                "Authorization": `Bearer ${token}`,

                ...(options.headers || {})

            }

        }
    );


    const data = await response.json();


    if (!response.ok) {

        const error = new Error(
            data.message || "Something went wrong"
        );

        error.status = response.status;

        error.data = data;

        throw error;

    }


    return data;

}


/* =========================================
   MESSAGE
========================================= */

function showMessage(message, type = "success") {

    const element =
        document.getElementById("message");


    element.textContent = message;


    element.className =
        `message ${type}`;


    element.style.display = "block";


    setTimeout(() => {

        element.style.display = "none";

    }, 5000);

}


/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadDashboard() {

    /*
       We load each section separately.

       This means if leave loading fails,
       the other dashboard sections can still load.
    */

    const loaders = [

        loadStatistics(),

        loadAppointments(),

        loadUsers(),

        loadServices(),

        loadPayments(),

        loadReviews(),

        loadStaff(),

        loadLeaves(),

        loadAvailabilityStaff()

    ];


    const results =
        await Promise.allSettled(loaders);


    results.forEach((result, index) => {

        if (result.status === "rejected") {

            console.error(
                "Dashboard section error:",
                index,
                result.reason
            );

        }

    });

}


/* =========================================
   STATISTICS
========================================= */

async function loadStatistics() {

    const data =
        await apiRequest("/api/admin/dashboard");


    console.log("Dashboard:", data);


    const dashboard =
        data.dashboard || data;


    document.getElementById(
        "totalCustomers"
    ).textContent =
        dashboard.total_customers || 0;


    document.getElementById(
        "totalStaff"
    ).textContent =
        dashboard.total_staff || 0;


    document.getElementById(
        "totalServices"
    ).textContent =
        dashboard.total_services || 0;


    document.getElementById(
        "totalAppointments"
    ).textContent =
        dashboard.total_appointments || 0;


    document.getElementById(
        "bookedAppointments"
    ).textContent =
        dashboard.booked_appointments || 0;


    document.getElementById(
        "completedAppointments"
    ).textContent =
        dashboard.completed_appointments || 0;


    document.getElementById(
        "cancelledAppointments"
    ).textContent =
        dashboard.cancelled_appointments || 0;


    document.getElementById(
        "totalRevenue"
    ).textContent =
        "₹" + (dashboard.total_revenue || 0);

}


/* =========================================
   APPOINTMENTS
========================================= */

async function loadAppointments() {

    const data =
        await apiRequest("/api/admin/appointments");


    const appointments =
        data.appointments || data;


    const table =
        document.getElementById(
            "appointmentsTable"
        );


    table.innerHTML = "";


    if (
        !Array.isArray(appointments) ||
        appointments.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="9" class="no-data">
                    No appointments found
                </td>
            </tr>
            `;

        return;

    }


    appointments.forEach(appointment => {

        table.innerHTML += `

            <tr>

                <td>
                    ${appointment.id}
                </td>

                <td>
                    ${appointment.customer_name || "-"}
                </td>

                <td>
                    ${appointment.staff_name || "-"}
                </td>

                <td>
                    ${appointment.service_name || "-"}
                </td>

                <td>
                    ${appointment.appointment_date || "-"}
                </td>

                <td>
                    ${appointment.start_time || "-"}
                    -
                    ${appointment.end_time || "-"}
                </td>

                <td>

                    <span class="status ${appointment.status}">
                        ${appointment.status}
                    </span>

                </td>

                <td>
                    ${appointment.payment_status || "-"}
                </td>

                <td>

                    <select
                        id="status-${appointment.id}">

                        <option
                            value="BOOKED"
                            ${appointment.status === "BOOKED"
                                ? "selected"
                                : ""}>
                            BOOKED
                        </option>

                        <option
                            value="COMPLETED"
                            ${appointment.status === "COMPLETED"
                                ? "selected"
                                : ""}>
                            COMPLETED
                        </option>

                        <option
                            value="CANCELLED"
                            ${appointment.status === "CANCELLED"
                                ? "selected"
                                : ""}>
                            CANCELLED
                        </option>

                        <option
                            value="RESCHEDULED"
                            ${appointment.status === "RESCHEDULED"
                                ? "selected"
                                : ""}>
                            RESCHEDULED
                        </option>

                    </select>


                    <button
                        class="update-btn"
                        onclick="updateAppointmentStatus(${appointment.id})">

                        Update

                    </button>

                </td>

            </tr>

        `;

    });

}


/* =========================================
   UPDATE APPOINTMENT STATUS
========================================= */

async function updateAppointmentStatus(
    appointmentId
) {

    const select =
        document.getElementById(
            `status-${appointmentId}`
        );


    const status =
        select.value;


    try {

        await apiRequest(
            `/api/admin/appointments/${appointmentId}/status`,
            {

                method: "PUT",

                body: JSON.stringify({
                    status: status
                })

            }
        );


        showMessage(
            "Appointment status updated successfully"
        );


        await loadAppointments();

    }

    catch (error) {

        showMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================
   USERS
========================================= */

async function loadUsers() {

    const data =
        await apiRequest("/api/admin/users");


    const users =
        data.users || data;


    const table =
        document.getElementById(
            "usersTable"
        );


    table.innerHTML = "";


    if (
        !Array.isArray(users) ||
        users.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="6" class="no-data">
                    No users found
                </td>
            </tr>
            `;

        return;

    }


    users.forEach(user => {

        table.innerHTML += `

            <tr>

                <td>
                    ${user.id}
                </td>

                <td>
                    ${user.name}
                </td>

                <td>
                    ${user.email}
                </td>

                <td>
                    ${user.phone || "-"}
                </td>

                <td>
                    ${user.role}
                </td>

                <td>
                    ${formatDate(user.created_at)}
                </td>

            </tr>

        `;

    });

}


/* =========================================
   SERVICES
========================================= */

async function loadServices() {

    const data =
        await apiRequest("/api/admin/services");


    const services =
        data.services || data;


    const table =
        document.getElementById(
            "servicesTable"
        );


    table.innerHTML = "";


    if (
        !Array.isArray(services) ||
        services.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="7" class="no-data">
                    No services found
                </td>
            </tr>
            `;

        return;

    }


    services.forEach(service => {

        table.innerHTML += `

            <tr>

                <td>
                    ${service.id}
                </td>

                <td>
                    ${service.name}
                </td>

                <td>
                    ${service.description || "-"}
                </td>

                <td>
                    ${service.duration} mins
                </td>

                <td>
                    ₹${service.price}
                </td>

                <td>

                    <span class="status ${service.status}">
                        ${service.status}
                    </span>

                </td>

                <td>

                    <button
                        class="service-btn"
                        onclick="toggleServiceStatus(
                            ${service.id},
                            '${service.status}'
                        )">

                        ${
                            service.status === "ACTIVE"
                                ? "Deactivate"
                                : "Activate"
                        }

                    </button>

                </td>

            </tr>

        `;

    });

}


/* =========================================
   SERVICE STATUS
========================================= */

async function toggleServiceStatus(
    serviceId,
    currentStatus
) {

    const newStatus =
        currentStatus === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";


    try {

        await apiRequest(
            `/api/admin/services/${serviceId}/status`,
            {

                method: "PUT",

                body: JSON.stringify({
                    status: newStatus
                })

            }
        );


        showMessage(
            `Service ${newStatus.toLowerCase()} successfully`
        );


        await loadServices();

    }

    catch (error) {

        showMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================
   PAYMENTS
========================================= */

async function loadPayments() {

    const data =
        await apiRequest("/api/admin/payments");


    const payments =
        data.payments || data;


    const table =
        document.getElementById(
            "paymentsTable"
        );


    table.innerHTML = "";


    if (
        !Array.isArray(payments) ||
        payments.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="8" class="no-data">
                    No payments found
                </td>
            </tr>
            `;

        return;

    }


    payments.forEach(payment => {

        table.innerHTML += `

            <tr>

                <td>
                    ${payment.id}
                </td>

                <td>
                    ${payment.appointment_id}
                </td>

                <td>
                    ${payment.customer_name || "-"}
                </td>

                <td>
                    ${payment.service_name || "-"}
                </td>

                <td>
                    ${payment.payment_gateway || "-"}
                </td>

                <td>
                    ${payment.transaction_id || "-"}
                </td>

                <td>
                    ₹${payment.amount || 0}
                </td>

                <td>
                    ${payment.status}
                </td>

            </tr>

        `;

    });

}


/* =========================================
   REVIEWS
========================================= */

async function loadReviews() {

    const data =
        await apiRequest("/api/admin/reviews");


    const reviews =
        data.reviews || data;


    const table =
        document.getElementById(
            "reviewsTable"
        );


    table.innerHTML = "";


    if (
        !Array.isArray(reviews) ||
        reviews.length === 0
    ) {

        table.innerHTML =
            `
            <tr>
                <td colspan="7" class="no-data">
                    No reviews found
                </td>
            </tr>
            `;

        return;

    }


    reviews.forEach(review => {

        table.innerHTML += `

            <tr>

                <td>
                    ${review.id}
                </td>

                <td>
                    ${review.customer_name || "-"}
                </td>

                <td>
                    ${review.service_name || "-"}
                </td>

                <td>
                    ${review.staff_name || "-"}
                </td>

                <td>
                    ${"⭐".repeat(review.rating)}
                </td>

                <td>
                    ${review.comment || "-"}
                </td>

                <td>
                    ${review.staff_response || "-"}
                </td>

            </tr>

        `;

    });

}

/* =========================================
   STAFF
========================================= */

/* =========================================
   STAFF MANAGEMENT
========================================= */


/* -----------------------------------------
   LOAD AVAILABLE SERVICES
----------------------------------------- */

async function loadAvailableServices() {

    try {

        const data =
            await apiRequest("/api/admin/services");

        availableServices =
            data.services || data || [];

    }

    catch (error) {

        console.error(
            "Load available services error:",
            error
        );

        availableServices = [];

    }

}


/* -----------------------------------------
   HIRE NEW STAFF
----------------------------------------- */

document
    .getElementById("staffForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("staffName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("staffEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("staffPassword")
                    .value;


            const phone =
                document
                    .getElementById("staffPhone")
                    .value
                    .trim();


            const specialization =
                document
                    .getElementById("staffSpecialization")
                    .value
                    .trim();


            const bio =
                document
                    .getElementById("staffBio")
                    .value
                    .trim();


            try {

                await apiRequest(
                    "/api/staff",
                    {

                        method: "POST",

                        body: JSON.stringify({

                            name: name,

                            email: email,

                            password: password,

                            phone:
                                phone || null,

                            specialization:
                                specialization || null,

                            bio:
                                bio || null

                        })

                    }
                );


                showMessage(
                    "Staff hired successfully",
                    "success"
                );


                document
                    .getElementById("staffForm")
                    .reset();


                await loadStaff();


                await loadStatistics();

            }

            catch (error) {

                console.error(
                    "Hire staff error:",
                    error
                );


                showMessage(
                    error.message,
                    "error"
                );

            }

        }
    );


/* -----------------------------------------
   LOAD ALL STAFF
----------------------------------------- */

async function loadStaff() {

    const data =
        await apiRequest("/api/admin/staff");

    const staff =
        data.staff || data;

    const table =
        document.getElementById("staffTable");

    table.innerHTML = "";


    if (
        !Array.isArray(staff) ||
        staff.length === 0
    ) {

        table.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    class="no-data">

                    No staff found

                </td>

            </tr>
        `;

        return;

    }


    /* -----------------------------------------
       LOAD ACTIVE SERVICES
    ----------------------------------------- */

    let services = [];

    try {

        const serviceData =
            await apiRequest("/api/services");

        services =
            serviceData.services || serviceData;

        if (!Array.isArray(services)) {
            services = [];
        }

        services =
            services.filter(
                service =>
                    service.status === "ACTIVE"
            );

    }

    catch (error) {

        console.error(
            "Load services error:",
            error
        );

    }


    /* -----------------------------------------
       LOAD EACH STAFF MEMBER
    ----------------------------------------- */

    for (const member of staff) {

        let assignedServices = [];


        try {

            const serviceData =
                await apiRequest(
                    `/api/staff/${member.staff_id}/services`
                );

            assignedServices =
                serviceData.services || serviceData;

            if (!Array.isArray(assignedServices)) {
                assignedServices = [];
            }

        }

        catch (error) {

            console.error(
                `Unable to load services for staff ${member.staff_id}:`,
                error
            );

        }


        /* -----------------------------------------
           ASSIGNED SERVICES HTML
        ----------------------------------------- */

        let assignedServicesHTML =
            "No services assigned";


        if (assignedServices.length > 0) {

            assignedServicesHTML =

                assignedServices.map(service => `

                    <span class="service-tag">

                        ${service.name}

                        <button
                            class="remove-service-btn"
                            onclick="removeService(
                                ${member.staff_id},
                                ${service.id}
                            )">

                            ×

                        </button>

                    </span>

                `).join("");

        }


        /* -----------------------------------------
           SERVICE DROPDOWN
        ----------------------------------------- */

        let serviceOptions = `
            <option value="">
                Select Service
            </option>
        `;


        services.forEach(service => {

            serviceOptions += `
                <option value="${service.id}">
                    ${service.name}
                </option>
            `;

        });


        const isActive =
            member.status === "ACTIVE";


        /* -----------------------------------------
           CREATE ROW
        ----------------------------------------- */

        table.innerHTML += `

            <tr>

                <td>
                    ${member.staff_id}
                </td>


                <td>
                    ${member.name || "-"}
                </td>


                <td>
                    ${member.email || "-"}
                </td>


                <td>
                    ${member.phone || "-"}
                </td>


                <td>
                    ${member.specialization || "-"}
                </td>


                <td>

                    <span
                        class="status ${member.status}">

                        ${member.status}

                    </span>

                </td>


                <td>

                    <div class="assigned-services">

                        ${assignedServicesHTML}

                    </div>

                </td>


                <td>

                    ${
                        isActive

                        ?

                        `

                        <div class="staff-action-box">

                            <div class="assign-box">

                                <select
                                    id="service-${member.staff_id}">

                                    ${serviceOptions}

                                </select>


                                <button
                                    class="assign-btn"
                                    onclick="assignService(
                                        ${member.staff_id}
                                    )">

                                    Assign

                                </button>

                            </div>


                            <button
                                class="fire-btn"
                                onclick="fireStaff(
                                    ${member.staff_id}
                                )">

                                Fire

                            </button>

                        </div>

                        `

                        :

                        `

                        <span class="inactive-text">
                            Inactive
                        </span>

                        `
                    }

                </td>

            </tr>

        `;

    }

}

/* -----------------------------------------
   ASSIGN SERVICE TO STAFF
----------------------------------------- */

async function assignService(staffId) {

    const select =
        document.getElementById(
            `service-${staffId}`
        );


    const serviceId =
        select.value;


    if (!serviceId) {

        showMessage(
            "Please select a service first.",
            "error"
        );

        return;

    }


    try {

        await apiRequest(
            `/api/staff/${staffId}/services`,
            {

                method: "POST",

                body: JSON.stringify({

                    serviceId:
                        Number(serviceId)

                })

            }
        );


        showMessage(
            "Service assigned successfully.",
            "success"
        );


        await loadStaff();

    }

    catch (error) {

        console.error(
            "Assign service error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}

/* -----------------------------------------
   REMOVE SERVICE FROM STAFF
----------------------------------------- */

async function removeService(
    staffId,
    serviceId
) {

    const confirmed =
        confirm(
            "Remove this service from this staff member?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/api/staff/${staffId}/services/${serviceId}`,
            {
                method: "DELETE"
            }
        );


        showMessage(
            "Service removed successfully.",
            "success"
        );


        await loadStaff();

    }

    catch (error) {

        console.error(
            "Remove service error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}



/* -----------------------------------------
   FIRE / DEACTIVATE STAFF
----------------------------------------- */

async function fireStaff(
    staffId
) {

    const confirmed =
        confirm(
            "Are you sure you want to deactivate this staff member?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await apiRequest(
            `/api/staff/${staffId}`,
            {

                method: "DELETE"

            }
        );


        showMessage(
            "Staff deactivated successfully",
            "success"
        );


        await loadStaff();


        await loadStatistics();

    }

    catch (error) {

        console.error(
            "Fire staff error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}

/* =========================================
   STAFF WEEKLY AVAILABILITY
========================================= */


/* -----------------------------------------
   LOAD STAFF INTO AVAILABILITY DROPDOWN
----------------------------------------- */

async function loadAvailabilityStaff() {

    const select =
        document.getElementById("availabilityStaff");

    if (!select) {
        return;
    }

    try {

        const data =
            await apiRequest("/api/admin/staff");

        const staff =
            data.staff || data;

        select.innerHTML = `
            <option value="">
                Select Staff
            </option>
        `;

        if (!Array.isArray(staff)) {
            return;
        }

        staff
            .filter(
                member =>
                    member.status === "ACTIVE"
            )
            .forEach(member => {

                select.innerHTML += `
                    <option value="${member.staff_id}">
                        ${member.name}
                    </option>
                `;

            });

    } catch (error) {

        console.error(
            "Load availability staff error:",
            error
        );

    }

}


async function loadAvailability(staffId) {

    const table =
        document.getElementById(
            "availabilityTable"
        );

    if (!table) {
        return;
    }

    if (!staffId) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="no-data"
                >
                    Select a staff member to view availability
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="loading"
            >
                Loading availability...
            </td>
        </tr>
    `;

    try {

        const data =
            await apiRequest(
                `/api/availability/staff/${staffId}`
            );

        const availability =
            data.availability || data;

        if (
            !Array.isArray(availability) ||
            availability.length === 0
        ) {

            table.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="no-data"
                    >
                        No availability configured
                    </td>
                </tr>
            `;

            return;
        }

        table.innerHTML =
            availability.map(item => {

                const day =
                    String(
                        item.day_of_week
                    ).toUpperCase();

                const formattedDay =
                    day.charAt(0) +
                    day.slice(1).toLowerCase();

                return `
                    <tr>

                        <td>
                            ${formattedDay}
                        </td>

                        <td>
                            ${formatTime(
                                item.start_time
                            )}
                        </td>

                        <td>
                            ${formatTime(
                                item.end_time
                            )}
                        </td>

                        <td>

                            <span
                                class="status ${
                                    item.is_available
                                        ? "ACTIVE"
                                        : "INACTIVE"
                                }"
                            >

                                ${
                                    item.is_available
                                        ? "AVAILABLE"
                                        : "UNAVAILABLE"
                                }

                            </span>

                        </td>

                        <td>

                            <button
                                type="button"
                                class="delete-availability-btn"
                                onclick="deleteAvailability(
                                    ${item.id},
                                    ${staffId}
                                )"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "Load availability error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="no-data"
                >
                    Unable to load availability
                </td>
            </tr>
        `;

    }

}


/* -----------------------------------------
   STAFF SELECTION
----------------------------------------- */

document
    .getElementById("availabilityStaff")
    .addEventListener(
        "change",
        function() {

            loadAvailability(
                this.value
            );

        }
    );


/* -----------------------------------------
   SAVE WEEKLY SCHEDULE
----------------------------------------- */
document
    .getElementById("availabilityForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const staffId =
                document.getElementById(
                    "availabilityStaff"
                ).value;

            const startTime =
                document.getElementById(
                    "availabilityStart"
                ).value;

            const endTime =
                document.getElementById(
                    "availabilityEnd"
                ).value;

            const selectedDays =
                Array.from(
                    document.querySelectorAll(
                        'input[name="workingDays"]:checked'
                    )
                ).map(
                    checkbox =>
                        checkbox.value
                );


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (!staffId) {

                showMessage(
                    "Please select a staff member.",
                    "error"
                );

                return;
            }


            if (selectedDays.length === 0) {

                showMessage(
                    "Please select at least one working day.",
                    "error"
                );

                return;
            }


            if (!startTime || !endTime) {

                showMessage(
                    "Please select start and end time.",
                    "error"
                );

                return;
            }


            if (startTime >= endTime) {

                showMessage(
                    "End time must be later than start time.",
                    "error"
                );

                return;
            }


            try {

                /* -----------------------------------------
                   GET EXISTING AVAILABILITY
                ----------------------------------------- */

                const existingData =
                    await apiRequest(
                        `/api/availability/staff/${staffId}`
                    );

                const existingAvailability =
                    existingData.availability ||
                    existingData ||
                    [];


                const existingDays =
                    Array.isArray(
                        existingAvailability
                    )
                        ? existingAvailability.map(
                            item =>
                                String(
                                    item.day_of_week
                                ).toUpperCase()
                        )
                        : [];


                /* -----------------------------------------
                   ADD ONLY NEW DAYS
                ----------------------------------------- */

                let addedCount = 0;
                let skippedCount = 0;


                for (
                    const day
                    of selectedDays
                ) {

                    /*
                     * Do not create duplicate
                     * availability for the same day.
                     */

                    if (
                        existingDays.includes(day)
                    ) {

                        skippedCount++;

                        continue;
                    }


                    await apiRequest(
                        `/api/availability/staff/${staffId}`,
                        {

                            method: "POST",

                            body: JSON.stringify({

                                day_of_week:
                                    day,

                                start_time:
                                    startTime,

                                end_time:
                                    endTime,

                                is_available:
                                    true

                            })

                        }
                    );


                    addedCount++;

                }


                /* -----------------------------------------
                   SUCCESS MESSAGE
                ----------------------------------------- */

                if (
                    addedCount > 0 &&
                    skippedCount > 0
                ) {

                    showMessage(
                        `${addedCount} day(s) added. ${skippedCount} day(s) already existed.`,
                        "success"
                    );

                } else if (
                    addedCount > 0
                ) {

                    showMessage(
                        "Weekly availability saved successfully.",
                        "success"
                    );

                } else {

                    showMessage(
                        "Selected days already have availability.",
                        "success"
                    );

                }


                clearAvailabilityForm();


                await loadAvailability(
                    staffId
                );

            } catch (error) {

                console.error(
                    "Save weekly availability error:",
                    error
                );

                showMessage(
                    error.message,
                    "error"
                );

            }

        }
    );

/* -----------------------------------------
   CLEAR FORM
----------------------------------------- */

function clearAvailabilityForm() {

    document
        .getElementById(
            "availabilityForm"
        )
        .reset();

}


/* -----------------------------------------
   DELETE AVAILABILITY
----------------------------------------- */

async function deleteAvailability(
    availabilityId,
    staffId
) {

    const confirmed =
        confirm(
            "Delete this availability day?"
        );

    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/api/availability/${availabilityId}`,
            {
                method: "DELETE"
            }
        );


        showMessage(
            "Availability deleted successfully.",
            "success"
        );


        await loadAvailability(
            staffId
        );

    } catch (error) {

        console.error(
            "Delete availability error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}

/* =========================================
   STAFF LEAVE REQUESTS
========================================= */

/* =========================================
   STAFF LEAVE REQUESTS
========================================= */


/* -----------------------------------------
   LOAD ALL LEAVE REQUESTS
----------------------------------------- */

async function loadLeaves() {

    const table =
        document.getElementById(
            "leavesTable"
        );


    try {

        console.log(
            "Loading admin leave requests..."
        );


        const data =
            await apiRequest(
                "/api/leaves/admin"
            );


        console.log(
            "Admin leaves response:",
            data
        );


        const leaves =
            data.leaves || data;


        table.innerHTML = "";


        if (
            !Array.isArray(leaves) ||
            leaves.length === 0
        ) {

            table.innerHTML =
                `
                <tr>
                    <td colspan="9" class="no-data">
                        No leave requests found
                    </td>
                </tr>
                `;

            return;

        }


        leaves.forEach(leave => {

            const isPending =
                leave.status === "PENDING";


            table.innerHTML += `

                <tr>

                    <td>
                        ${leave.id}
                    </td>

                    <td>
                        ${leave.staff_name || "-"}
                    </td>

                    <td>
                        ${leave.staff_email || "-"}
                    </td>

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
                        ${leave.reason || "-"}
                    </td>

                    <td>

                        <span
                            class="status ${leave.status}">

                            ${leave.status}

                        </span>

                    </td>

                    <td>

                        ${
                            isPending

                            ?

                            `
                            <button
                                class="approve-btn"
                                onclick="updateLeaveStatus(
                                    ${leave.id},
                                    'APPROVED'
                                )">

                                Approve

                            </button>

                            <button
                                class="reject-btn"
                                onclick="updateLeaveStatus(
                                    ${leave.id},
                                    'REJECTED'
                                )">

                                Reject

                            </button>
                            `

                            :

                            "No action"
                        }

                    </td>

                </tr>

            `;

        });

    }

    catch (error) {

        console.error(
            "Load leaves error:",
            error
        );


        table.innerHTML =
            `
            <tr>
                <td colspan="9" class="no-data">
                    Unable to load leave requests
                </td>
            </tr>
            `;

        /*
           Do not throw the error here.
           Other admin dashboard sections
           should continue working.
        */

    }

}


/* =========================================
   APPROVE / REJECT LEAVE
========================================= */

async function updateLeaveStatus(
    leaveId,
    status
) {

    const action =
        status === "APPROVED"
            ? "approve"
            : "reject";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} this leave request?`
        );


    if (!confirmed) {

        return;

    }


    try {

        console.log(
            "Updating leave:",
            leaveId,
            status
        );


        const response =
            await fetch(
                `${API_URL}/api/leaves/admin/${leaveId}/status`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({
                        status: status
                    })

                }
            );


        const data =
            await response.json();


        console.log(
            "Update leave response:",
            response.status,
            data
        );


        /*
        ==========================================
        ERROR RESPONSE
        ==========================================
        */

        if (!response.ok) {

            let errorMessage =
                data.message ||
                "Failed to update leave request";


            /*
               If backend found appointment
               conflicts, show them clearly.
            */

            if (
                Array.isArray(data.conflicts) &&
                data.conflicts.length > 0
            ) {

                const conflictDetails =
                    data.conflicts
                        .map(conflict => {

                            return (
                                `Appointment #${conflict.id}\n` +

                                `Customer: ${
                                    conflict.customer_name || "-"
                                }\n` +

                                `Service: ${
                                    conflict.service_name || "-"
                                }\n` +

                                `Date: ${
                                    formatLeaveDate(
                                        conflict.appointment_date
                                    )
                                }\n` +

                                `Time: ${
                                    formatTime(
                                        conflict.start_time
                                    )
                                } - ${
                                    formatTime(
                                        conflict.end_time
                                    )
                                }\n` +

                                `Status: ${
                                    conflict.status || "-"
                                }`
                            );

                        })
                        .join("\n\n");


                errorMessage +=
                    "\n\nExisting appointment conflict:\n\n" +
                    conflictDetails;

            }


            alert(errorMessage);

            return;

        }


        /*
        ==========================================
        SUCCESS
        ==========================================
        */

        const successMessage =
            data.message ||
            `Leave request ${action}d successfully`;


        showMessage(
            successMessage,
            "success"
        );


        /*
           Reload leave table so the status
           immediately changes from PENDING
           to APPROVED / REJECTED.
        */

        await loadLeaves();

    }

    catch (error) {

        console.error(
            "Update leave error:",
            error
        );


        alert(
            "Unable to update leave request.\n\n" +
            error.message
        );

    }

}


/* =========================================
   FORMAT LEAVE DATE
========================================= */

function formatLeaveDate(date) {

    if (!date) {

        return "-";

    }


    /*
       MySQL DATE normally comes as:

       YYYY-MM-DD

       or sometimes:

       YYYY-MM-DDTHH:mm:ss
    */

    const dateString =
        String(date).split("T")[0];


    const parts =
        dateString.split("-");


    if (parts.length === 3) {

        return (
            `${parts[2]}-${parts[1]}-${parts[0]}`
        );

    }


    return dateString;

}


/* =========================================
   FORMAT TIME
========================================= */

function formatTime(time) {

    if (!time) {

        return "-";

    }


    return String(time).substring(0, 5);

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(date) {

    if (!date) {

        return "-";

    }


    return new Date(
        date
    ).toLocaleDateString();

}


/* =========================================
   LOGOUT
========================================= */

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href =
        "index.html";

}


/* =========================================
   INITIAL LOAD
========================================= */

loadDashboard();