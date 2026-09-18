const crypto = require("crypto");
const db = require("../config/db");

const {
    createRazorpayOrder
} = require("../services/paymentService");

const {
    sendAppointmentConfirmation
} = require("../services/emailService");


// =========================================================
// CREATE RAZORPAY ORDER
// =========================================================

const createPaymentOrder = async (req, res) => {

    try {

        const { appointmentId } = req.body;
        const userId = req.user.id;


        if (!appointmentId) {

            return res.status(400).json({
                message: "Appointment ID is required"
            });

        }


        const sql = `
            SELECT
                a.id,
                a.user_id,
                a.status,
                a.payment_status,
                s.name AS service_name,
                s.price
            FROM appointments a
            JOIN services s
                ON a.service_id = s.id
            WHERE a.id = ?
        `;


        db.execute(
            sql,
            [appointmentId],
            async (err, results) => {

                if (err) {

                    console.error(
                        "Appointment lookup error:",
                        err
                    );

                    return res.status(500).json({
                        message: "Database error"
                    });

                }


                if (results.length === 0) {

                    return res.status(404).json({
                        message: "Appointment not found"
                    });

                }


                const appointment = results[0];


                // Check appointment ownership
                if (appointment.user_id !== userId) {

                    return res.status(403).json({
                        message:
                            "You are not allowed to pay for this appointment"
                    });

                }


                // Appointment must be active
                if (
                    appointment.status !== "BOOKED" &&
                    appointment.status !== "RESCHEDULED"
                ) {

                    return res.status(400).json({
                        message:
                            "Payment is not allowed for this appointment"
                    });

                }


                // Prevent duplicate payment
                if (
                    appointment.payment_status === "PAID"
                ) {

                    return res.status(400).json({
                        message:
                            "Appointment is already paid"
                    });

                }


                const amount =
                    Number(appointment.price);


                const receipt =
                    `appointment_${appointmentId}_${Date.now()}`;


                // Create Razorpay order
                const order =
                    await createRazorpayOrder({
                        amount,
                        receipt
                    });


                // Store pending payment
                const insertPaymentSql = `
                    INSERT INTO payments
                    (
                        appointment_id,
                        payment_gateway,
                        transaction_id,
                        amount,
                        status
                    )
                    VALUES
                    (
                        ?,
                        'RAZORPAY',
                        ?,
                        ?,
                        'PENDING'
                    )
                `;


                db.execute(
                    insertPaymentSql,
                    [
                        appointmentId,
                        order.id,
                        amount
                    ],
                    (paymentErr) => {

                        if (paymentErr) {

                            console.error(
                                "Payment record creation error:",
                                paymentErr
                            );

                            return res.status(500).json({
                                message:
                                    "Payment order created but database record could not be created"
                            });

                        }


                        return res.status(201).json({

                            message:
                                "Payment order created successfully",

                            key_id:
                                process.env.RAZORPAY_KEY_ID,

                            order_id:
                                order.id,

                            amount:
                                order.amount,

                            currency:
                                order.currency,

                            appointment_id:
                                appointmentId,

                            service_name:
                                appointment.service_name

                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "Create payment order error:",
            error
        );

        return res.status(500).json({

            message:
                "Failed to create payment order",

            error:
                error.message

        });

    }

};



// =========================================================
// VERIFY RAZORPAY PAYMENT
// =========================================================

const verifyPayment = async (req, res) => {

    try {

        const {
            appointmentId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        if (
            !appointmentId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({
                message:
                    "All payment details are required"
            });

        }


        const userId = req.user.id;


        // =================================================
        // GET APPOINTMENT
        // =================================================

        const appointmentSql = `
            SELECT
                id,
                user_id,
                payment_status
            FROM appointments
            WHERE id = ?
        `;


        db.execute(
            appointmentSql,
            [appointmentId],
            (appointmentErr, appointmentResults) => {

                if (appointmentErr) {

                    console.error(
                        "Appointment verification lookup error:",
                        appointmentErr
                    );

                    return res.status(500).json({
                        message: "Database error"
                    });

                }


                if (
                    appointmentResults.length === 0
                ) {

                    return res.status(404).json({
                        message:
                            "Appointment not found"
                    });

                }


                const appointment =
                    appointmentResults[0];


                // Check ownership
                if (
                    appointment.user_id !== userId
                ) {

                    return res.status(403).json({
                        message:
                            "You are not allowed to verify this payment"
                    });

                }


                // =================================================
                // VERIFY RAZORPAY SIGNATURE
                // =================================================

                const generatedSignature =
                    crypto
                        .createHmac(
                            "sha256",
                            process.env.RAZORPAY_KEY_SECRET
                        )
                        .update(
                            `${razorpay_order_id}|${razorpay_payment_id}`
                        )
                        .digest("hex");


                if (
                    generatedSignature !==
                    razorpay_signature
                ) {

                    return res.status(400).json({
                        message:
                            "Invalid payment signature"
                    });

                }


                // =================================================
                // FIND PAYMENT ORDER
                // =================================================

                const paymentSql = `
                    SELECT
                        id,
                        status
                    FROM payments
                    WHERE appointment_id = ?
                    AND transaction_id = ?
                `;


                db.execute(
                    paymentSql,
                    [
                        appointmentId,
                        razorpay_order_id
                    ],
                    (
                        paymentErr,
                        paymentResults
                    ) => {

                        if (paymentErr) {

                            console.error(
                                "Payment lookup error:",
                                paymentErr
                            );

                            return res.status(500).json({
                                message:
                                    "Database error"
                            });

                        }


                        if (
                            paymentResults.length === 0
                        ) {

                            return res.status(404).json({
                                message:
                                    "Payment order not found"
                            });

                        }


                        const payment =
                            paymentResults[0];


                        // =================================================
                        // UPDATE PAYMENT
                        // =================================================

                        const updatePaymentSql = `
                            UPDATE payments
                            SET
                                transaction_id = ?,
                                status = 'SUCCESS'
                            WHERE id = ?
                        `;


                        db.execute(
                            updatePaymentSql,
                            [
                                razorpay_payment_id,
                                payment.id
                            ],
                            (updateErr) => {

                                if (updateErr) {

                                    console.error(
                                        "Payment update error:",
                                        updateErr
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to update payment"
                                    });

                                }


                                // =================================================
                                // UPDATE APPOINTMENT PAYMENT STATUS
                                // =================================================

                                const updateAppointmentSql = `
                                    UPDATE appointments
                                    SET
                                        payment_status = 'PAID',
                                        payment_id = ?
                                    WHERE id = ?
                                `;


                                db.execute(
                                    updateAppointmentSql,
                                    [
                                        razorpay_payment_id,
                                        appointmentId
                                    ],
                                    (
                                        appointmentUpdateErr
                                    ) => {

                                        if (
                                            appointmentUpdateErr
                                        ) {

                                            console.error(
                                                "Appointment payment update error:",
                                                appointmentUpdateErr
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Payment successful but appointment status could not be updated"
                                            });

                                        }


                                        // =================================================
                                        // GET APPOINTMENT DETAILS FOR EMAIL
                                        // =================================================

                                        const detailsSql = `
                                            SELECT

                                                a.id AS appointment_id,

                                                DATE_FORMAT(
                                                    a.appointment_date,
                                                    '%Y-%m-%d'
                                                ) AS appointment_date,

                                                a.start_time,

                                                a.end_time,

                                                u.name AS customer_name,

                                                u.email AS customer_email,

                                                s.name AS service_name,

                                                s.price,

                                                staffUser.name AS staff_name

                                            FROM appointments a

                                            JOIN users u
                                                ON a.user_id = u.id

                                            JOIN services s
                                                ON a.service_id = s.id

                                            JOIN staff st
                                                ON a.staff_id = st.id

                                            JOIN users staffUser
                                                ON st.user_id = staffUser.id

                                            WHERE a.id = ?
                                        `;


                                        db.execute(
                                            detailsSql,
                                            [appointmentId],
                                            async (
                                                detailsErr,
                                                detailsResults
                                            ) => {

                                                // =================================================
                                                // IF DETAILS CANNOT BE LOADED
                                                // PAYMENT IS STILL SUCCESSFUL
                                                // =================================================

                                                if (
                                                    detailsErr
                                                ) {

                                                    console.error(
                                                        "Appointment details lookup error:",
                                                        detailsErr
                                                    );

                                                    return res.status(200).json({

                                                        message:
                                                            "Payment verified successfully, but confirmation email could not be prepared",

                                                        appointment_id:
                                                            appointmentId,

                                                        payment_id:
                                                            razorpay_payment_id,

                                                        payment_status:
                                                            "PAID"

                                                    });

                                                }


                                                if (
                                                    detailsResults.length === 0
                                                ) {

                                                    return res.status(200).json({

                                                        message:
                                                            "Payment verified successfully, but appointment details could not be found for email",

                                                        appointment_id:
                                                            appointmentId,

                                                        payment_id:
                                                            razorpay_payment_id,

                                                        payment_status:
                                                            "PAID"

                                                    });

                                                }


                                                const appointmentDetails =
                                                    detailsResults[0];


                                                // =================================================
                                                // SEND CONFIRMATION EMAIL
                                                // =================================================

                                                try {

                                                    await sendAppointmentConfirmation({

                                                        customerEmail:
                                                            appointmentDetails.customer_email,

                                                        customerName:
                                                            appointmentDetails.customer_name,

                                                        appointmentId:
                                                            appointmentDetails.appointment_id,

                                                        appointmentDate:
                                                            appointmentDetails.appointment_date,

                                                        startTime:
                                                            appointmentDetails.start_time,

                                                        endTime:
                                                            appointmentDetails.end_time,

                                                        serviceName:
                                                            appointmentDetails.service_name,

                                                        staffName:
                                                            appointmentDetails.staff_name,

                                                        price:
                                                            appointmentDetails.price

                                                    });


                                                    console.log(
                                                        "Appointment confirmation email sent successfully"
                                                    );


                                                } catch (
                                                    emailError
                                                ) {

                                                    console.error(
                                                        "Confirmation email error:",
                                                        emailError
                                                    );


                                                    // Payment is already successful.
                                                    // Email failure must NOT make payment failed.

                                                    return res.status(200).json({

                                                        message:
                                                            "Payment verified successfully, but confirmation email could not be sent",

                                                        appointment_id:
                                                            appointmentId,

                                                        payment_id:
                                                            razorpay_payment_id,

                                                        payment_status:
                                                            "PAID"

                                                    });

                                                }


                                                // =================================================
                                                // FINAL SUCCESS
                                                // =================================================

                                                return res.status(200).json({

                                                    message:
                                                        "Payment verified successfully and appointment confirmed",

                                                    appointment_id:
                                                        appointmentId,

                                                    payment_id:
                                                        razorpay_payment_id,

                                                    payment_status:
                                                        "PAID"

                                                });

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "Verify payment error:",
            error
        );

        return res.status(500).json({

            message:
                "Payment verification failed",

            error:
                error.message

        });

    }

};



/* =========================================================
   EXPORT FUNCTIONS
========================================================= */

module.exports = {

    createPaymentOrder,

    verifyPayment

};