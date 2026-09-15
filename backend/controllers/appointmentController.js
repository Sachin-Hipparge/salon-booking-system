const db = require("../config/db");
const {
    sendAppointmentConfirmation
} = require("../services/emailService");


// CREATE APPOINTMENT
const createAppointment = (req, res) => {
    const userId = req.user.id;

    const {
        staff_id,
        service_id,
        appointment_date,
        start_time
    } = req.body;

    if (!staff_id || !service_id || !appointment_date || !start_time) {
        return res.status(400).json({
            message: "staff_id, service_id, appointment_date and start_time are required"
        });
    }

    // Check staff
    const staffSql = `
        SELECT id
        FROM staff
        WHERE id = ?
        AND status = 'ACTIVE'
    `;

    db.execute(staffSql, [staff_id], (err, staffResult) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (staffResult.length === 0) {
            return res.status(404).json({
                message: "Staff not found or inactive"
            });
        }

        // Get service
        const serviceSql = `
            SELECT id, name, duration, price
            FROM services
            WHERE id = ?
            AND status = 'ACTIVE'
        `;

        db.execute(serviceSql, [service_id], (err, serviceResult) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err
                });
            }

            if (serviceResult.length === 0) {
                return res.status(404).json({
                    message: "Service not found or inactive"
                });
            }

            const service = serviceResult[0];

            // Check staff-service assignment
            const assignmentSql = `
                SELECT *
                FROM staff_services
                WHERE staff_id = ?
                AND service_id = ?
            `;

            db.execute(
                assignmentSql,
                [staff_id, service_id],
                (err, assignmentResult) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Database error",
                            error: err
                        });
                    }

                    if (assignmentResult.length === 0) {
                        return res.status(400).json({
                            message: "This service is not assigned to the selected staff"
                        });
                    }

                    // Find day of week
                    const daySql = `
                        SELECT DAYNAME(?) AS day_name
                    `;

                    db.execute(
                        daySql,
                        [appointment_date],
                        (err, dayResult) => {
                            if (err) {
                                return res.status(500).json({
                                    message: "Database error",
                                    error: err
                                });
                            }

                            const dayOfWeek =
                                dayResult[0].day_name.toUpperCase();

                            // Check availability
                            const availabilitySql = `
                                SELECT
                                    id,
                                    start_time,
                                    end_time,
                                    is_available
                                FROM availability
                                WHERE staff_id = ?
                                AND day_of_week = ?
                                AND is_available = TRUE
                                AND start_time <= ?
                                AND end_time >= ?
                            `;

                            db.execute(
                                availabilitySql,
                                [
                                    staff_id,
                                    dayOfWeek,
                                    start_time,
                                    start_time
                                ],
                                (err, availabilityResult) => {
                                    if (err) {
                                        return res.status(500).json({
                                            message: "Database error",
                                            error: err
                                        });
                                    }

                                    if (availabilityResult.length === 0) {
                                        return res.status(400).json({
                                            message:
                                                "Staff is not available at this time"
                                        });
                                    }

                                    const availability =
                                        availabilityResult[0];

                                    // Calculate end time
                                    const startDate = new Date(
                                        `1970-01-01T${start_time}`
                                    );

                                    startDate.setMinutes(
                                        startDate.getMinutes() +
                                        service.duration
                                    );

                                    const endTime = startDate
                                        .toTimeString()
                                        .substring(0, 8);

                                    // Check appointment fits inside availability
                                    if (
                                        endTime >
                                        availability.end_time
                                    ) {
                                        return res.status(400).json({
                                            message:
                                                "Appointment exceeds staff availability"
                                        });
                                    }

                                    // Check appointment conflict
                                    const conflictSql = `
                                        SELECT id
                                        FROM appointments
                                        WHERE staff_id = ?
                                        AND appointment_date = ?
                                        AND status IN ('BOOKED', 'RESCHEDULED')
                                        AND start_time < ?
                                        AND end_time > ?
                                    `;

                                    db.execute(
                                        conflictSql,
                                        [
                                            staff_id,
                                            appointment_date,
                                            endTime,
                                            start_time
                                        ],
                                        (err, conflictResult) => {
                                            if (err) {
                                                return res.status(500).json({
                                                    message:
                                                        "Database error",
                                                    error: err
                                                });
                                            }

                                            if (
                                                conflictResult.length > 0
                                            ) {
                                                return res.status(409).json({
                                                    message:
                                                        "Staff already has an appointment during this time"
                                                });
                                            }

                                            // Create appointment
                                            const insertSql = `
                                                INSERT INTO appointments
                                                (
                                                    user_id,
                                                    staff_id,
                                                    service_id,
                                                    appointment_date,
                                                    start_time,
                                                    end_time,
                                                    status,
                                                    payment_status
                                                )
                                                VALUES
                                                (
                                                    ?,
                                                    ?,
                                                    ?,
                                                    ?,
                                                    ?,
                                                    ?,
                                                    'BOOKED',
                                                    'PENDING'
                                                )
                                            `;

                                            db.execute(
                                                insertSql,
                                                [
                                                    userId,
                                                    staff_id,
                                                    service_id,
                                                    appointment_date,
                                                    start_time,
                                                    endTime
                                                ],
                                                (err, result) => {
                                                    if (err) {
                                                        return res.status(500).json({
                                                            message:
                                                                "Database error",
                                                            error: err
                                                        });
                                                    }

                                                    /*
                                                     * Appointment has now
                                                     * been successfully saved.
                                                     *
                                                     * Get customer, service
                                                     * and staff details for
                                                     * confirmation email.
                                                     */

                                                    const detailsSql = `
                                                        SELECT
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
                                                        [result.insertId],
                                                        async (
                                                            err,
                                                            detailsResult
                                                        ) => {
                                                            if (err) {
                                                                return res.status(201).json({
                                                                    message:
                                                                        "Appointment booked successfully, but confirmation email details could not be loaded",
                                                                    appointmentId:
                                                                        result.insertId,
                                                                    appointment: {
                                                                        staff_id,
                                                                        service_id,
                                                                        appointment_date,
                                                                        start_time,
                                                                        end_time:
                                                                            endTime,
                                                                        status:
                                                                            "BOOKED",
                                                                        payment_status:
                                                                            "PENDING"
                                                                    }
                                                                });
                                                            }

                                                            const details =
                                                                detailsResult[0];

                                                            try {
                                                                // Send confirmation email
                                                                await sendAppointmentConfirmation(
                                                                    {
                                                                        customerEmail:
                                                                            details.customer_email,

                                                                        customerName:
                                                                            details.customer_name,

                                                                        appointmentId:
                                                                            result.insertId,

                                                                        appointmentDate:
                                                                            appointment_date,

                                                                        startTime:
                                                                            start_time,

                                                                        endTime:
                                                                            endTime,

                                                                        serviceName:
                                                                            details.service_name,

                                                                        staffName:
                                                                            details.staff_name,

                                                                        price:
                                                                            details.price
                                                                    }
                                                                );

                                                               // Get customer, service and staff details
// for confirmation email

const detailsSql = `
    SELECT
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
    [result.insertId],
    async (err, detailsResult) => {

        if (err) {
            return res.status(201).json({
                message:
                    "Appointment booked successfully, but confirmation email details could not be loaded",

                appointmentId: result.insertId,

                appointment: {
                    staff_id,
                    service_id,
                    appointment_date,
                    start_time,
                    end_time: endTime,
                    status: "BOOKED",
                    payment_status: "PENDING"
                }
            });
        }

        const details = detailsResult[0];

        try {

            // Send confirmation email
            await sendAppointmentConfirmation({

                customerEmail:
                    details.customer_email,

                customerName:
                    details.customer_name,

                appointmentId:
                    result.insertId,

                appointmentDate:
                    appointment_date,

                startTime:
                    start_time,

                endTime:
                    endTime,

                serviceName:
                    details.service_name,

                staffName:
                    details.staff_name,

                price:
                    details.price
            });


            // Email sent successfully
            res.status(201).json({

                message:
                    "Appointment booked successfully and confirmation email sent",

                appointmentId:
                    result.insertId,

                appointment: {
                    staff_id,
                    service_id,
                    appointment_date,
                    start_time,
                    end_time: endTime,
                    status: "BOOKED",
                    payment_status: "PENDING"
                }
            });

        } catch (emailError) {

            console.error(
                "Email sending failed:",
                emailError
            );


            // Appointment is already saved.
            // Email failure should not cancel it.

            res.status(201).json({

                message:
                    "Appointment booked successfully, but confirmation email could not be sent",

                appointmentId:
                    result.insertId,

                appointment: {
                    staff_id,
                    service_id,
                    appointment_date,
                    start_time,
                    end_time: endTime,
                    status: "BOOKED",
                    payment_status: "PENDING"
                }
            });
        }
    }
);

                                                            } catch (emailError) {

                                                                console.error(
                                                                    "Email sending failed:",
                                                                    emailError
                                                                );

                                                                /*
                                                                 * Appointment is already
                                                                 * saved successfully.
                                                                 *
                                                                 * Email failure should not
                                                                 * cancel the appointment.
                                                                 */

                                                                res.status(201).json({
                                                                    message:
                                                                        "Appointment booked successfully, but confirmation email could not be sent",

                                                                    appointmentId:
                                                                        result.insertId,

                                                                    appointment: {
                                                                        staff_id,
                                                                        service_id,
                                                                        appointment_date,
                                                                        start_time,
                                                                        end_time:
                                                                            endTime,
                                                                        status:
                                                                            "BOOKED",
                                                                        payment_status:
                                                                            "PENDING"
                                                                    }
                                                                });
                                                            }
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
                }
            );
        });
    });
};


// GET MY APPOINTMENTS
const getMyAppointments = (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT
            a.id,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.payment_status,
            s.name AS service_name,
            s.price,
            st.id AS staff_id,
            u.name AS staff_name
        FROM appointments a
        JOIN services s
            ON a.service_id = s.id
        JOIN staff st
            ON a.staff_id = st.id
        JOIN users u
            ON st.user_id = u.id
        WHERE a.user_id = ?
        ORDER BY
            a.appointment_date DESC,
            a.start_time DESC
    `;

    db.execute(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        res.status(200).json(result);
    });
};


// GET STAFF APPOINTMENTS
const getStaffAppointments = (req, res) => {
    const staffId = req.params.staffId;

    const sql = `
        SELECT
            a.id,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.payment_status,
            u.id AS customer_id,
            u.name AS customer_name,
            u.email AS customer_email,
            s.name AS service_name
        FROM appointments a
        JOIN users u
            ON a.user_id = u.id
        JOIN services s
            ON a.service_id = s.id
        WHERE a.staff_id = ?
        ORDER BY
            a.appointment_date DESC,
            a.start_time DESC
    `;

    db.execute(sql, [staffId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        res.status(200).json(result);
    });
};


// GET APPOINTMENT BY ID
const getAppointmentById = (req, res) => {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const sql = `
        SELECT
            a.id,
            a.user_id,
            a.staff_id,
            a.service_id,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.payment_status,
            u.name AS customer_name,
            u.email AS customer_email,
            s.name AS service_name,
            s.price,
            st.user_id AS staff_user_id
        FROM appointments a
        JOIN users u
            ON a.user_id = u.id
        JOIN services s
            ON a.service_id = s.id
        JOIN staff st
            ON a.staff_id = st.id
        WHERE a.id = ?
    `;

    db.execute(sql, [appointmentId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        const appointment = result[0];

        // Customer can only see their own appointment
        if (
            userRole === "CUSTOMER" &&
            appointment.user_id !== userId
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        // Staff can only see appointments assigned to them
        if (
            userRole === "STAFF" &&
            appointment.staff_user_id !== userId
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        res.status(200).json(appointment);
    });
};


// CANCEL APPOINTMENT
const cancelAppointment = (req, res) => {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const findSql = `
        SELECT
            id,
            user_id,
            staff_id,
            status
        FROM appointments
        WHERE id = ?
    `;

    db.execute(findSql, [appointmentId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        const appointment = result[0];

        // Customer can cancel only their own appointment
        if (
            userRole === "CUSTOMER" &&
            appointment.user_id !== userId
        ) {
            return res.status(403).json({
                message:
                    "You can only cancel your own appointment"
            });
        }

        // Staff can cancel appointments assigned to them
        if (userRole === "STAFF") {
            const staffSql = `
                SELECT id
                FROM staff
                WHERE id = ?
                AND user_id = ?
            `;

            db.execute(
                staffSql,
                [appointment.staff_id, userId],
                (err, staffResult) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Database error",
                            error: err
                        });
                    }

                    if (staffResult.length === 0) {
                        return res.status(403).json({
                            message:
                                "You cannot cancel this appointment"
                        });
                    }

                    performCancellation();
                }
            );
        } else {
            performCancellation();
        }

        function performCancellation() {

            if (appointment.status === "CANCELLED") {
                return res.status(400).json({
                    message:
                        "Appointment is already cancelled"
                });
            }

            const updateSql = `
                UPDATE appointments
                SET status = 'CANCELLED'
                WHERE id = ?
            `;

            db.execute(
                updateSql,
                [appointmentId],
                (err) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Database error",
                            error: err
                        });
                    }

                    res.status(200).json({
                        message:
                            "Appointment cancelled successfully",
                        appointmentId: appointmentId,
                        status: "CANCELLED"
                    });
                }
            );
        }
    });
};


// RESCHEDULE APPOINTMENT
const rescheduleAppointment = (req, res) => {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const {
        appointment_date,
        start_time
    } = req.body;

    if (!appointment_date || !start_time) {
        return res.status(400).json({
            message:
                "appointment_date and start_time are required"
        });
    }

    // Get existing appointment
    const appointmentSql = `
        SELECT
            id,
            user_id,
            staff_id,
            service_id,
            status
        FROM appointments
        WHERE id = ?
    `;

    db.execute(
        appointmentSql,
        [appointmentId],
        (err, appointmentResult) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error",
                    error: err
                });
            }

            if (appointmentResult.length === 0) {
                return res.status(404).json({
                    message: "Appointment not found"
                });
            }

            const appointment = appointmentResult[0];

            // Customer can reschedule only their own appointment
            if (
                userRole === "CUSTOMER" &&
                appointment.user_id !== userId
            ) {
                return res.status(403).json({
                    message:
                        "You can only reschedule your own appointment"
                });
            }

            // Staff can reschedule appointments assigned to them
            if (userRole === "STAFF") {

                const staffSql = `
                    SELECT id
                    FROM staff
                    WHERE id = ?
                    AND user_id = ?
                `;

                db.execute(
                    staffSql,
                    [appointment.staff_id, userId],
                    (err, staffResult) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Database error",
                                error: err
                            });
                        }

                        if (staffResult.length === 0) {
                            return res.status(403).json({
                                message:
                                    "You cannot reschedule this appointment"
                            });
                        }

                        continueReschedule();
                    }
                );

            } else {
                continueReschedule();
            }


            function continueReschedule() {

                if (appointment.status === "CANCELLED") {
                    return res.status(400).json({
                        message:
                            "Cancelled appointment cannot be rescheduled"
                    });
                }

                // Get service duration
                const serviceSql = `
                    SELECT duration
                    FROM services
                    WHERE id = ?
                    AND status = 'ACTIVE'
                `;

                db.execute(
                    serviceSql,
                    [appointment.service_id],
                    (err, serviceResult) => {

                        if (err) {
                            return res.status(500).json({
                                message: "Database error",
                                error: err
                            });
                        }

                        if (serviceResult.length === 0) {
                            return res.status(404).json({
                                message:
                                    "Service not found or inactive"
                            });
                        }

                        const duration =
                            serviceResult[0].duration;

                        // Find day of week
                        const daySql = `
                            SELECT DAYNAME(?) AS day_name
                        `;

                        db.execute(
                            daySql,
                            [appointment_date],
                            (err, dayResult) => {

                                if (err) {
                                    return res.status(500).json({
                                        message:
                                            "Database error",
                                        error: err
                                    });
                                }

                                const dayOfWeek =
                                    dayResult[0]
                                        .day_name
                                        .toUpperCase();

                                // Check staff availability
                                const availabilitySql = `
                                    SELECT
                                        id,
                                        start_time,
                                        end_time,
                                        is_available
                                    FROM availability
                                    WHERE staff_id = ?
                                    AND day_of_week = ?
                                    AND is_available = TRUE
                                    AND start_time <= ?
                                    AND end_time >= ?
                                `;

                                db.execute(
                                    availabilitySql,
                                    [
                                        appointment.staff_id,
                                        dayOfWeek,
                                        start_time,
                                        start_time
                                    ],
                                    (err, availabilityResult) => {

                                        if (err) {
                                            return res.status(500).json({
                                                message:
                                                    "Database error",
                                                error: err
                                            });
                                        }

                                        if (
                                            availabilityResult.length === 0
                                        ) {
                                            return res.status(400).json({
                                                message:
                                                    "Staff is not available at this time"
                                            });
                                        }

                                        const availability =
                                            availabilityResult[0];

                                        // Calculate new end time
                                        const startDate =
                                            new Date(
                                                `1970-01-01T${start_time}`
                                            );

                                        startDate.setMinutes(
                                            startDate.getMinutes() +
                                            duration
                                        );

                                        const endTime =
                                            startDate
                                                .toTimeString()
                                                .substring(0, 8);

                                        // Check availability boundary
                                        if (
                                            endTime >
                                            availability.end_time
                                        ) {
                                            return res.status(400).json({
                                                message:
                                                    "Appointment exceeds staff availability"
                                            });
                                        }

                                        // Check conflicts
                                        // Exclude current appointment
                                        const conflictSql = `
                                            SELECT id
                                            FROM appointments
                                            WHERE staff_id = ?
                                            AND appointment_date = ?
                                            AND id != ?
                                            AND status IN ('BOOKED', 'RESCHEDULED')
                                            AND start_time < ?
                                            AND end_time > ?
                                        `;

                                        db.execute(
                                            conflictSql,
                                            [
                                                appointment.staff_id,
                                                appointment_date,
                                                appointmentId,
                                                endTime,
                                                start_time
                                            ],
                                            (err, conflictResult) => {

                                                if (err) {
                                                    return res.status(500).json({
                                                        message:
                                                            "Database error",
                                                        error: err
                                                    });
                                                }

                                                if (
                                                    conflictResult.length > 0
                                                ) {
                                                    return res.status(409).json({
                                                        message:
                                                            "Staff already has an appointment during this time"
                                                    });
                                                }

                                                // Update appointment
                                                const updateSql = `
                                                    UPDATE appointments
                                                    SET
                                                        appointment_date = ?,
                                                        start_time = ?,
                                                        end_time = ?,
                                                        status = 'RESCHEDULED'
                                                    WHERE id = ?
                                                `;

                                                db.execute(
                                                    updateSql,
                                                    [
                                                        appointment_date,
                                                        start_time,
                                                        endTime,
                                                        appointmentId
                                                    ],
                                                    (err) => {

                                                        if (err) {
                                                            return res.status(500).json({
                                                                message:
                                                                    "Database error",
                                                                error: err
                                                            });
                                                        }

                                                        res.status(200).json({
                                                            message:
                                                                "Appointment rescheduled successfully",

                                                            appointmentId:
                                                                appointmentId,

                                                            appointment: {
                                                                appointment_date,
                                                                start_time,
                                                                end_time:
                                                                    endTime,
                                                                status:
                                                                    "RESCHEDULED"
                                                            }
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
            }
        }
    );
};


// EXPORT FUNCTIONS
module.exports = {
    createAppointment,
    getMyAppointments,
    getStaffAppointments,
    getAppointmentById,
    cancelAppointment,
    rescheduleAppointment
};