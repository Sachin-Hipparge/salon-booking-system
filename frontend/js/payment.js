// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = "http://localhost:5000";


// ==========================================
// TOKEN
// ==========================================

const token = localStorage.getItem("token");


// ==========================================
// GET APPOINTMENT ID FROM URL
// ==========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const appointmentId =
    params.get("appointmentId");


// ==========================================
// ELEMENTS
// ==========================================

const payButton =
    document.getElementById("payButton");

const message =
    document.getElementById("message");


// ==========================================
// BASIC VALIDATION
// ==========================================

if (!token) {

    showError(
        "Please login first."
    );

    payButton.disabled = true;
}


if (!appointmentId) {

    showError(
        "Appointment ID is missing."
    );

    payButton.disabled = true;
}


// ==========================================
// DISPLAY APPOINTMENT ID
// ==========================================

if (appointmentId) {

    document.getElementById(
        "summaryAppointment"
    ).textContent =
        "#" + appointmentId;
}


// ==========================================
// LOAD APPOINTMENT DETAILS
// ==========================================

async function loadAppointment() {

    if (!token || !appointmentId) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/api/appointments/${appointmentId}`,
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

        console.log(
            "Appointment details:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load appointment"
            );
        }


        // ==========================================
        // SERVICE
        // ==========================================

        const serviceName =
            data.service_name ||
            "Salon Service";

        document.getElementById(
            "leftService"
        ).textContent =
            serviceName;

        document.getElementById(
            "summaryService"
        ).textContent =
            serviceName;


        // ==========================================
        // STAFF
        // ==========================================

        document.getElementById(
            "staffName"
        ).textContent =
            data.staff_name ||
            "Salon Professional";


        // ==========================================
        // DATE
        // ==========================================

        let formattedDate = "-";

        if (data.appointment_date) {

            const date =
                new Date(
                    data.appointment_date
                );

            if (!isNaN(date)) {

                formattedDate =
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );

            } else {

                formattedDate =
                    data.appointment_date;
            }
        }

        document.getElementById(
            "appointmentDate"
        ).textContent =
            formattedDate;

        document.getElementById(
            "summaryDate"
        ).textContent =
            formattedDate;


        // ==========================================
        // TIME
        // ==========================================

        const startTime =
            data.start_time ||
            "-";

        const endTime =
            data.end_time ||
            "";

        const timeText =
            endTime
                ? `${startTime} - ${endTime}`
                : startTime;

        document.getElementById(
            "appointmentTime"
        ).textContent =
            timeText;

        document.getElementById(
            "summaryTime"
        ).textContent =
            timeText;


        // ==========================================
        // PAYMENT STATUS
        // ==========================================

        if (
            data.payment_status === "PAID"
        ) {

            document.getElementById(
                "summaryStatus"
            ).textContent =
                "PAID";

            document.getElementById(
                "summaryStatus"
            ).style.color =
                "#26733b";

            document.getElementById(
                "notice"
            ).textContent =
                "This appointment has already been paid.";

            payButton.disabled = true;

            return;
        }


        // ==========================================
        // AMOUNT
        // ==========================================

        if (
            data.price !== undefined
        ) {

            document.getElementById(
                "amount"
            ).textContent =
                Number(
                    data.price
                ).toLocaleString(
                    "en-IN"
                );
        }

    } catch (error) {

        console.error(
            "Appointment loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load appointment details."
        );
    }
}


// ==========================================
// START PAYMENT
// ==========================================

async function startPayment() {

    if (!token) {

        showError(
            "Please login first."
        );

        return;
    }


    if (!appointmentId) {

        showError(
            "Appointment ID is missing."
        );

        return;
    }


    payButton.disabled = true;

    payButton.textContent =
        "CREATING PAYMENT ORDER...";

    hideMessage();


    try {

        // ==========================================
        // CREATE RAZORPAY ORDER
        // ==========================================

        const response =
            await fetch(
                `${API_URL}/api/payments/create-order`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        appointmentId:
                            Number(
                                appointmentId
                            )
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "Create order response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to create payment order"
            );
        }


        // ==========================================
        // VALIDATE RAZORPAY RESPONSE
        // ==========================================

        if (
            !data.key_id ||
            !data.order_id ||
            !data.amount
        ) {

            console.error(
                "Invalid Razorpay response:",
                data
            );

            throw new Error(
                "Razorpay order was not created correctly."
            );
        }


        // ==========================================
        // UPDATE UI WITH AMOUNT
        // ==========================================

        document.getElementById(
            "amount"
        ).textContent =
            (
                data.amount / 100
            ).toLocaleString(
                "en-IN"
            );


        // ==========================================
        // RAZORPAY OPTIONS
        // ==========================================

        const options = {

            key:
                data.key_id,

            amount:
                data.amount,

            currency:
                data.currency ||
                "INR",

            name:
                "Luxe Salon",

            description:
                data.service_name ||
                "Salon Appointment",

            order_id:
                data.order_id,


            // ==========================================
            // PAYMENT SUCCESS
            // ==========================================

            handler:
                async function (
                    razorpayResponse
                ) {

                    console.log(
                        "Razorpay payment response:",
                        razorpayResponse
                    );

                    payButton.textContent =
                        "VERIFYING PAYMENT...";


                    try {

                        // ==========================================
                        // VERIFY PAYMENT
                        // ==========================================

                        const verifyResponse =
                            await fetch(
                                `${API_URL}/api/payments/verify`,
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json",

                                        Authorization:
                                            `Bearer ${token}`
                                    },

                                    body: JSON.stringify({

                                        appointmentId:
                                            Number(
                                                appointmentId
                                            ),

                                        razorpay_order_id:
                                            razorpayResponse
                                                .razorpay_order_id,

                                        razorpay_payment_id:
                                            razorpayResponse
                                                .razorpay_payment_id,

                                        razorpay_signature:
                                            razorpayResponse
                                                .razorpay_signature
                                    })
                                }
                            );


                        const verifyData =
                            await verifyResponse.json();

                        console.log(
                            "Payment verification:",
                            verifyData
                        );


                        if (
                            !verifyResponse.ok
                        ) {

                            throw new Error(
                                verifyData.message ||
                                "Payment verification failed"
                            );
                        }


                        // ==========================================
                        // SUCCESS
                        // ==========================================

                        document.getElementById(
                            "summaryStatus"
                        ).textContent =
                            "PAID";

                        document.getElementById(
                            "summaryStatus"
                        ).style.color =
                            "#26733b";

                        document.getElementById(
                            "notice"
                        ).textContent =
                            "Payment completed successfully. Your appointment is confirmed.";

                        showSuccess(
                            "Payment completed successfully!"
                        );

                        payButton.textContent =
                            "PAYMENT COMPLETED";

                        payButton.disabled =
                            true;


                        // Redirect after success

                        setTimeout(
                            () => {

                                window.location.href =
                                    "index.html";

                            },
                            2000
                        );

                    } catch (error) {

                        console.error(
                            "Payment verification error:",
                            error
                        );

                        showError(
                            error.message ||
                            "Payment verification failed."
                        );

                        payButton.disabled =
                            false;

                        payButton.textContent =
                            "PROCEED TO SECURE PAYMENT";
                    }
                },


            // ==========================================
            // MODAL CLOSED
            // ==========================================

            modal: {

                ondismiss:
                    function () {

                        payButton.disabled =
                            false;

                        payButton.textContent =
                            "PROCEED TO SECURE PAYMENT";

                        showError(
                            "Payment was cancelled."
                        );
                    }
            },


            // ==========================================
            // THEME
            // ==========================================

            theme: {

                color:
                    "#b27d4d"
            }
        };


        // ==========================================
        // CREATE RAZORPAY INSTANCE
        // ==========================================

        const razorpay =
            new Razorpay(
                options
            );


        // ==========================================
        // PAYMENT FAILED
        // ==========================================

        razorpay.on(
            "payment.failed",
            function (response) {

                console.error(
                    "Payment failed:",
                    response.error
                );

                showError(
                    "Payment failed. Please try again."
                );

                payButton.disabled =
                    false;

                payButton.textContent =
                    "PROCEED TO SECURE PAYMENT";
            }
        );


        // ==========================================
        // OPEN RAZORPAY
        // ==========================================

        razorpay.open();

        payButton.textContent =
            "RAZORPAY CHECKOUT OPENED";

    } catch (error) {

        console.error(
            "Payment error:",
            error
        );

        showError(
            error.message ||
            "Something went wrong."
        );

        payButton.disabled =
            false;

        payButton.textContent =
            "PROCEED TO SECURE PAYMENT";
    }
}


// ==========================================
// MESSAGE FUNCTIONS
// ==========================================

function showError(text) {

    message.textContent =
        text;

    message.className =
        "error";
}


function showSuccess(text) {

    message.textContent =
        text;

    message.className =
        "success";
}


function hideMessage() {

    message.textContent =
        "";

    message.className =
        "";
}


// ==========================================
// LOAD DATA
// ==========================================

loadAppointment();