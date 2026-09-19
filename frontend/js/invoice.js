    const API_URL =
        "http://localhost:5000";


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const token =
        localStorage.getItem("token");


    // =====================================================
    // APPOINTMENT ID
    // =====================================================

    const params =
        new URLSearchParams(
            window.location.search
        );


    const appointmentId =
        params.get("appointmentId");


    // =====================================================
    // ELEMENTS
    // =====================================================

    const loading =
        document.getElementById(
            "loading"
        );


    const invoiceCard =
        document.getElementById(
            "invoiceCard"
        );


    const errorBox =
        document.getElementById(
            "errorBox"
        );


    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    // =====================================================
    // ERROR HANDLER
    // =====================================================

    function showError(message) {

        loading.style.display =
            "none";


        invoiceCard.style.display =
            "none";


        errorBox.style.display =
            "block";


        errorMessage.textContent =
            message;

    }


    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(value) {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


        if (isNaN(date.getTime())) {
            return value;
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


    // =====================================================
    // TIME FORMAT
    // =====================================================

    function formatTime(value) {

        if (!value) {
            return "-";
        }


        const parts =
            String(value).split(":");


        if (parts.length < 2) {
            return value;
        }


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


    // =====================================================
    // LOAD APPOINTMENT
    // =====================================================

    async function loadAppointment() {

        const response =
            await fetch(
                `${API_URL}/api/appointments/${appointmentId}`,
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
                "Unable to load appointment."
            );

        }


        return data;

    }


    // =====================================================
    // CREATE / GET INVOICE
    // =====================================================

    async function loadInvoice() {


        // -------------------------------------------------
        // First create invoice
        // -------------------------------------------------

        const createResponse =
            await fetch(
                `${API_URL}/api/invoices`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        appointmentId:
                            Number(appointmentId)
                    })
                }
            );


        const createData =
            await createResponse.json();


        console.log(
            "Create invoice response:",
            createData
        );


        /*
            If invoice already exists, the backend may
            return the existing invoice. We continue
            to GET the invoice below so the page always
            gets the final stored record.
        */


        // -------------------------------------------------
        // Get invoice
        // -------------------------------------------------

        const invoiceResponse =
            await fetch(
                `${API_URL}/api/invoices/${appointmentId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const invoiceData =
            await invoiceResponse.json();


        console.log(
            "Get invoice response:",
            invoiceData
        );


        if (!invoiceResponse.ok) {

            throw new Error(
                invoiceData.message ||
                createData.message ||
                "Unable to load invoice."
            );

        }


        return invoiceData.invoice ||
               invoiceData;

    }


    // =====================================================
    // LOAD CUSTOMER
    // =====================================================

    async function loadCustomer() {

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


        if (!response.ok) {
            return null;
        }


        const data =
            await response.json();


        return data.user ||
               data;

    }


    // =====================================================
    // DISPLAY INVOICE
    // =====================================================

    async function displayInvoice() {

        if (!token) {

            showError(
                "Please login before viewing your invoice."
            );

            return;
        }


        if (!appointmentId) {

            showError(
                "Appointment ID is missing."
            );

            return;
        }


        try {


            // =============================================
            // GET APPOINTMENT
            // =============================================

            const appointment =
                await loadAppointment();


            // =============================================
            // CHECK PAYMENT
            // =============================================

            if (
                appointment.payment_status !==
                "PAID"
            ) {

                throw new Error(
                    "Invoice is available only after successful payment."
                );

            }


            // =============================================
            // GET INVOICE
            // =============================================

            const invoice =
                await loadInvoice();


            // =============================================
            // GET CUSTOMER
            // =============================================

            const customer =
                await loadCustomer();


            // =============================================
            // INVOICE NUMBER
            // =============================================

            document.getElementById(
                "invoiceNumber"
            ).textContent =
                invoice.invoice_number ||
                "-";


            // =============================================
            // INVOICE DATE
            // =============================================

            document.getElementById(
                "invoiceDate"
            ).textContent =
                formatDate(
                    invoice.invoice_date
                );


            // =============================================
            // APPOINTMENT ID
            // =============================================

            document.getElementById(
                "appointmentId"
            ).textContent =
                `#${appointmentId}`;


            // =============================================
            // CUSTOMER
            // =============================================

            document.getElementById(
                "customerName"
            ).textContent =
                appointment.customer_name ||
                customer?.name ||
                "Customer";


            document.getElementById(
                "customerEmail"
            ).textContent =
                appointment.customer_email ||
                customer?.email ||
                "";


            // =============================================
            // SERVICE
            // =============================================

            document.getElementById(
                "serviceName"
            ).textContent =
                appointment.service_name ||
                "Salon Service";


            // =============================================
            // STAFF
            // =============================================

            document.getElementById(
                "staffName"
            ).textContent =
                `Professional: ${
                    appointment.staff_name ||
                    "Salon Professional"
                }`;


            // =============================================
            // DATE
            // =============================================

            document.getElementById(
                "appointmentDate"
            ).textContent =
                formatDate(
                    appointment.appointment_date
                );


            // =============================================
            // TIME
            // =============================================

            document.getElementById(
                "appointmentTime"
            ).textContent =
                formatTime(
                    appointment.start_time
                );


            // =============================================
            // AMOUNTS
            // =============================================

            const baseAmount =
                Number(
                    invoice.amount ||
                    appointment.price ||
                    0
                );


            const tax =
                Number(
                    invoice.tax ||
                    (baseAmount * 0.18)
                );


            const total =
                Number(
                    invoice.total_amount ||
                    (baseAmount + tax)
                );


            document.getElementById(
                "baseAmount"
            ).textContent =
                baseAmount.toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );


            document.getElementById(
                "subtotal"
            ).textContent =
                baseAmount.toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );


            document.getElementById(
                "tax"
            ).textContent =
                tax.toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );


            document.getElementById(
                "totalAmount"
            ).textContent =
                total.toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );


            // =============================================
            // SHOW INVOICE
            // =============================================

            loading.style.display =
                "none";


            invoiceCard.style.display =
                "block";


        } catch (error) {

            console.error(
                "Invoice error:",
                error
            );


            showError(
                error.message ||
                "Unable to load invoice."
            );

        }

    }


    // =====================================================
    // START
    // =====================================================

    displayInvoice();