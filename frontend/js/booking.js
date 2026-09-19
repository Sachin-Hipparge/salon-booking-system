const API_URL = "http://localhost:5000";

const token = localStorage.getItem("token");

// =================================================
// AUTH CHECK
// =================================================

if (!token) {
    window.location.href = "login.html";
}

// =================================================
// URL PARAMETERS
// =================================================

const urlParams = new URLSearchParams(
    window.location.search
);

const serviceId = urlParams.get("serviceId");

if (!serviceId) {
    window.location.href = "services.html";
}

// =================================================
// STATE
// =================================================

let selectedService = null;
let selectedTime = null;

// =================================================
// ELEMENTS
// =================================================

const staffSelect =
    document.getElementById("staff");

const appointmentDate =
    document.getElementById("appointmentDate");

const confirmBookingBtn =
    document.getElementById("confirmBookingBtn");

const bookingMessage =
    document.getElementById("bookingMessage");

// =================================================
// MINIMUM DATE
// =================================================

const today = new Date();

const localToday =
    new Date(
        today.getTime() -
        today.getTimezoneOffset() * 60000
    )
        .toISOString()
        .split("T")[0];

appointmentDate.min = localToday;

// =================================================
// SHOW MESSAGE
// =================================================

function showMessage(
    text,
    type = "error"
) {
    bookingMessage.className =
        `dashboard-message ${type}`;

    bookingMessage.textContent =
        text;

    bookingMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// =================================================
// FORMAT TIME
// =================================================

function formatTime(time) {

    const parts =
        String(time).split(":");

    let hour =
        parseInt(parts[0]);

    const minute =
        parts[1];

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}

// =================================================
// FORMAT DATE
// =================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "Not selected";
    }

    const date =
        new Date(
            `${dateValue}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

// =================================================
// LOAD SERVICE
// =================================================

async function loadService() {

    const serviceLoading =
        document.getElementById(
            "serviceLoading"
        );

    const serviceSummary =
        document.getElementById(
            "serviceSummary"
        );

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
                "Unable to load service"
            );
        }

        const services =
            Array.isArray(data)
                ? data
                : (
                    data.services ||
                    data.data ||
                    []
                );

        selectedService =
            services.find(
                service =>
                    String(service.id) ===
                    String(serviceId)
            );

        if (!selectedService) {

            throw new Error(
                "Selected service was not found."
            );
        }

        serviceLoading.style.display =
            "none";

        serviceSummary.style.display =
            "flex";

        document.getElementById(
            "serviceName"
        ).textContent =
            selectedService.name;

        document.getElementById(
            "serviceDetails"
        ).textContent =
            `${selectedService.duration} minutes`;

        document.getElementById(
            "servicePrice"
        ).textContent =
            Number(
                selectedService.price
            ).toLocaleString("en-IN");

        document.getElementById(
            "summaryService"
        ).textContent =
            selectedService.name;

        document.getElementById(
            "summaryPrice"
        ).textContent =
            Number(
                selectedService.price
            ).toLocaleString("en-IN");

    } catch (error) {

        console.error(
            "Service loading error:",
            error
        );

        serviceLoading.textContent =
            error.message;

        showMessage(
            error.message,
            "error"
        );
    }
}

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
                        Authorization:
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
            "User error:",
            error
        );
    }
}

// =================================================
// LOAD STAFF FOR SELECTED SERVICE
// =================================================

async function loadStaff() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/staff/service/${serviceId}`,
                {
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
                "Unable to load professionals"
            );
        }

        let staffList =
            Array.isArray(data)
                ? data
                : (
                    data.staff ||
                    data.data ||
                    []
                );

        // Only show active staff
        staffList =
            staffList.filter(
                staff =>
                    !staff.status ||
                    staff.status === "ACTIVE"
            );

        // Clear existing options
        staffSelect.innerHTML = `
            <option value="">
                Select a professional
            </option>
        `;

        // No staff assigned to this service
        if (!staffList.length) {

            staffSelect.innerHTML = `
                <option value="">
                    No professionals available for this service
                </option>
            `;

            document.getElementById(
                "summaryStaff"
            ).textContent =
                "Not selected";

            resetTimeSlots();

            return;
        }

        // Add staff to dropdown
        staffList.forEach(
            staff => {

                const id =
                    staff.id ||
                    staff.staff_id;

                const name =
                    staff.name ||
                    staff.staff_name ||
                    "Salon Professional";

                const specialization =
                    staff.specialization
                        ? ` — ${staff.specialization}`
                        : "";

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    id;

                option.textContent =
                    `${name}${specialization}`;

                staffSelect.appendChild(
                    option
                );
            }
        );

    } catch (error) {

        console.error(
            "Staff loading error:",
            error
        );

        staffSelect.innerHTML = `
            <option value="">
                Unable to load professionals
            </option>
        `;

        document.getElementById(
            "summaryStaff"
        ).textContent =
            "Not selected";

        resetTimeSlots();

        showMessage(
            error.message ||
            "Unable to load professionals.",
            "error"
        );
    }
}

// =================================================
// STAFF CHANGE
// =================================================

staffSelect.addEventListener(
    "change",
    async () => {

        const option =
            staffSelect.options[
                staffSelect.selectedIndex
            ];

        document.getElementById(
            "summaryStaff"
        ).textContent =
            staffSelect.value
                ? option.textContent
                : "Not selected";

        await checkStaffAvailability();
    }
);

// =================================================
// DATE CHANGE
// =================================================

appointmentDate.addEventListener(
    "change",
    async () => {

        document.getElementById(
            "summaryDate"
        ).textContent =
            formatDate(
                appointmentDate.value
            );

        await checkStaffAvailability();
    }
);

// =================================================
// CHECK STAFF WEEKLY AVAILABILITY + LEAVE
// =================================================

async function checkStaffAvailability() {

    const staffId =
        staffSelect.value;

    const selectedDate =
        appointmentDate.value;

    if (!staffId || !selectedDate) {

        resetTimeSlots();

        return;
    }

    try {

        // ==========================================
        // GET WEEKLY AVAILABILITY
        // ==========================================

        const availabilityResponse =
            await fetch(
                `${API_URL}/api/availability/staff/${staffId}`
            );

        const availabilityData =
            await availabilityResponse.json();

        if (!availabilityResponse.ok) {

            throw new Error(
                availabilityData.message ||
                "Unable to check staff availability"
            );
        }

        const availability =
            Array.isArray(
                availabilityData
            )
                ? availabilityData
                : (
                    availabilityData.availability ||
                    availabilityData.data ||
                    []
                );

        console.log(
            "Staff weekly availability:",
            availability
        );

        // ==========================================
        // FIND SELECTED DAY
        // ==========================================

        const selectedDateObject =
            new Date(
                `${selectedDate}T00:00:00`
            );

        const dayNames = [
            "SUNDAY",
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY"
        ];

        const selectedDay =
            dayNames[
                selectedDateObject.getDay()
            ];

        console.log(
            "Selected day:",
            selectedDay
        );

        // ==========================================
        // FIND AVAILABILITY FOR SELECTED DAY
        // ==========================================

        const dayAvailability =
            availability.find(
                item => {

                    const itemDay =
                        String(
                            item.day_of_week
                        )
                            .trim()
                            .toUpperCase();

                    const isAvailable =
                        item.is_available === true ||
                        item.is_available === 1 ||
                        item.is_available === "1";

                    return (
                        itemDay === selectedDay &&
                        isAvailable
                    );
                }
            );

        console.log(
            "Availability for selected day:",
            dayAvailability
        );

        // ==========================================
        // GET STAFF LEAVE
        // ==========================================

        const leaveResponse =
            await fetch(
                `${API_URL}/api/leaves/staff/${staffId}?date=${selectedDate}`
            );

        const leaveData =
            await leaveResponse.json();

        let leaves = [];

        if (leaveResponse.ok) {

            leaves =
                Array.isArray(leaveData)
                    ? leaveData
                    : (
                        leaveData.leaves ||
                        []
                    );
        }

        console.log(
            "Approved staff leaves:",
            leaves
        );

        // ==========================================
        // UPDATE TIME SLOTS
        // ==========================================

        updateTimeSlots(
            dayAvailability,
            leaves
        );

    } catch (error) {

        console.error(
            "Staff availability check error:",
            error
        );

        /*
         * Do not block the customer completely
         * if availability checking fails.
         *
         * Backend will still perform the final
         * availability validation.
         */

        resetTimeSlots();
    }
}

// =================================================
// UPDATE TIME SLOTS
// WEEKLY AVAILABILITY + LEAVE + PAST TIME
// =================================================

function updateTimeSlots(
    availability,
    leaves
) {

    const slots =
        document.querySelectorAll(
            ".time-slot"
        );

    // Clear previous selection
    selectedTime = null;

    document.getElementById(
        "summaryTime"
    ).textContent =
        "Not selected";

    // ==========================================
    // TODAY'S DATE
    // ==========================================

    const today =
        new Date();

    const todayDate =
        today.getFullYear() +
        "-" +
        String(
            today.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            today.getDate()
        ).padStart(2, "0");

    const selectedDate =
        appointmentDate.value;

    // ==========================================
    // CURRENT TIME
    // ==========================================

    const currentMinutes =
        today.getHours() * 60 +
        today.getMinutes();

    // ==========================================
    // PROCESS EACH SLOT
    // ==========================================

    slots.forEach(
        slot => {

            const slotTime =
                slot.dataset.time;

            const slotMinutes =
                convertTimeToMinutes(
                    slotTime
                );

            // Reset previous state

            slot.disabled =
                false;

            slot.classList.remove(
                "availability-disabled"
            );

            slot.classList.remove(
                "leave-disabled"
            );

            slot.classList.remove(
                "past-disabled"
            );

            slot.classList.remove(
                "selected"
            );

            // ======================================
            // CHECK PAST TIME
            // ======================================

            if (
                selectedDate === todayDate &&
                slotMinutes <= currentMinutes
            ) {

                slot.classList.add(
                    "past-disabled"
                );

                slot.disabled =
                    true;

                return;
            }

            // ======================================
            // CHECK WEEKLY AVAILABILITY
            // ======================================

            if (!availability) {

                /*
                 * No availability for this day
                 * means staff does not work
                 * on this day.
                 */

                slot.classList.add(
                    "availability-disabled"
                );

                slot.disabled =
                    true;

                return;
            }

            const staffStartMinutes =
                convertTimeToMinutes(
                    availability.start_time
                );

            const staffEndMinutes =
                convertTimeToMinutes(
                    availability.end_time
                );

            // ======================================
            // SERVICE DURATION
            // ======================================

            const serviceDuration =
                selectedService
                    ? Number(
                        selectedService.duration
                    )
                    : 0;

            const appointmentEndMinutes =
                slotMinutes +
                serviceDuration;

            /*
             * Disable if appointment:
             *
             * starts before staff working time
             * OR
             * ends after staff working time
             */

            if (
                slotMinutes <
                    staffStartMinutes ||
                appointmentEndMinutes >
                    staffEndMinutes
            ) {

                slot.classList.add(
                    "availability-disabled"
                );

                slot.disabled =
                    true;

                return;
            }

            // ======================================
            // CHECK APPROVED LEAVE
            // ======================================

            const isOnLeave =
                Array.isArray(leaves) &&
                leaves.some(
                    leave =>
                        isTimeWithinLeave(
                            slotTime,
                            leave.start_time,
                            leave.end_time
                        )
                );

            if (isOnLeave) {

                slot.classList.add(
                    "leave-disabled"
                );

                slot.disabled =
                    true;
            }
        }
    );
}

// =================================================
// CHECK TIME AGAINST LEAVE
// =================================================

function isTimeWithinLeave(
    slotTime,
    leaveStart,
    leaveEnd
) {

    const slot =
        convertTimeToMinutes(
            slotTime
        );

    const start =
        convertTimeToMinutes(
            leaveStart
        );

    const end =
        convertTimeToMinutes(
            leaveEnd
        );

    return (
        slot >= start &&
        slot < end
    );
}

// =================================================
// CONVERT TIME TO MINUTES
// =================================================

function convertTimeToMinutes(
    time
) {

    const parts =
        String(time)
            .substring(0, 5)
            .split(":");

    return (
        Number(parts[0]) * 60 +
        Number(parts[1])
    );
}

// =================================================
// RESET TIME SLOTS
// =================================================

function resetTimeSlots() {

    selectedTime =
        null;

    document.getElementById(
        "summaryTime"
    ).textContent =
        "Not selected";

    document
        .querySelectorAll(
            ".time-slot"
        )
        .forEach(
            slot => {

                slot.disabled =
                    false;

                slot.classList.remove(
                    "availability-disabled"
                );

                slot.classList.remove(
                    "leave-disabled"
                );

                slot.classList.remove(
                    "past-disabled"
                );

                slot.classList.remove(
                    "selected"
                );
            }
        );
}

// =================================================
// TIME SLOT CLICK
// =================================================

document
    .querySelectorAll(
        ".time-slot"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.disabled
                    ) {
                        return;
                    }

                    document
                        .querySelectorAll(
                            ".time-slot"
                        )
                        .forEach(
                            slot =>
                                slot.classList.remove(
                                    "selected"
                                )
                        );

                    button.classList.add(
                        "selected"
                    );

                    selectedTime =
                        button.dataset.time;

                    document.getElementById(
                        "summaryTime"
                    ).textContent =
                        formatTime(
                            selectedTime
                        );
                }
            );
        }
    );

// =================================================
// CREATE APPOINTMENT
// =================================================

confirmBookingBtn.addEventListener(
    "click",
    async () => {

        // Validate service

        if (!selectedService) {

            showMessage(
                "Please select a valid service."
            );

            return;
        }

        // Validate staff

        if (!staffSelect.value) {

            showMessage(
                "Please select a professional."
            );

            staffSelect.focus();

            return;
        }

        // Validate date

        if (!appointmentDate.value) {

            showMessage(
                "Please select an appointment date."
            );

            appointmentDate.focus();

            return;
        }

        // Validate time

        if (!selectedTime) {

            showMessage(
                "Please select an appointment time."
            );

            return;
        }

        // Extra safety:
        // selected time must belong to an enabled button

        const selectedButton =
            document.querySelector(
                `.time-slot[data-time="${selectedTime}"]`
            );

        if (
            !selectedButton ||
            selectedButton.disabled
        ) {

            selectedTime =
                null;

            document.getElementById(
                "summaryTime"
            ).textContent =
                "Not selected";

            showMessage(
                "Please select an available appointment time."
            );

            return;
        }

        // Disable button while booking

        confirmBookingBtn.disabled =
            true;

        confirmBookingBtn.innerHTML =
            "Booking appointment...";

        try {

            const response =
                await fetch(
                    `${API_URL}/api/appointments`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({

                            staff_id:
                                Number(
                                    staffSelect.value
                                ),

                            service_id:
                                Number(
                                    serviceId
                                ),

                            appointment_date:
                                appointmentDate.value,

                            start_time:
                                selectedTime
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to book appointment"
                );
            }

            const appointmentId =
                data.appointmentId ||
                data.appointment?.id;

            showMessage(
                data.message ||
                "Appointment booked successfully!",
                "success"
            );

            // Go to payment after successful booking

            setTimeout(
                () => {

                    if (appointmentId) {

                        window.location.href =
                            `payment.html?appointmentId=${appointmentId}`;

                    } else {

                        window.location.href =
                            "dashboard.html";
                    }

                },
                1200
            );

        } catch (error) {

            console.error(
                "Appointment booking error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to book appointment.",
                "error"
            );

            // Enable button again

            confirmBookingBtn.disabled =
                false;

            confirmBookingBtn.innerHTML =
                'Confirm Appointment <span>→</span>';
        }
    }
);

// =================================================
// LOGOUT
// =================================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

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
            mobileMenu.classList.contains(
                "show"
            )
                ? "✕"
                : "☰";
    }
);

// =================================================
// INITIAL LOAD
// =================================================

loadUser();

loadService();

loadStaff();