const db = require("../config/db");


/* =========================================================
   CREATE APPOINTMENT
========================================================= */

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
            message:
                "staff_id, service_id, appointment_date and start_time are required"
        });

    }


    /* =====================================================
       CHECK PAST DATE / TIME
    ===================================================== */

    const now = new Date();

    const todayDate =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0");


    if (appointment_date < todayDate) {

        return res.status(400).json({
            message:
                "You cannot book an appointment for a past date"
        });

    }


    if (appointment_date === todayDate) {

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();

        const timeParts =
            start_time.substring(0, 5).split(":");

        const appointmentMinutes =
            Number(timeParts[0]) * 60 +
            Number(timeParts[1]);


        if (appointmentMinutes <= currentMinutes) {

            return res.status(400).json({
                message:
                    "You cannot book an appointment for a past time"
            });

        }

    }


    /* =====================================================
       CHECK STAFF
    ===================================================== */

    const staffSql = `
        SELECT id
        FROM staff
        WHERE id = ?
        AND status = 'ACTIVE'
    `;


    db.execute(
        staffSql,
        [staff_id],
        (err, staffResult) => {

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


            /* =====================================================
               GET SERVICE
            ===================================================== */

            const serviceSql = `
                SELECT id, name, duration, price
                FROM services
                WHERE id = ?
                AND status = 'ACTIVE'
            `;


            db.execute(
                serviceSql,
                [service_id],
                (err, serviceResult) => {

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


                    /* =====================================================
                       CHECK STAFF-SERVICE ASSIGNMENT
                    ===================================================== */

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
                                    message:
                                        "This service is not assigned to the selected staff"
                                });

                            }


                            /* =====================================================
                               FIND DAY OF WEEK
                            ===================================================== */

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
                                        dayResult[0]
                                            .day_name
                                            .toUpperCase();


                                    /* =====================================================
                                       CHECK AVAILABILITY
                                    ===================================================== */

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


                                            /* =====================================================
                                               CALCULATE END TIME
                                            ===================================================== */

                                            const startDate = new Date(
                                                `1970-01-01T${start_time}`
                                            );


                                            startDate.setMinutes(
                                                startDate.getMinutes() +
                                                service.duration
                                            );


                                            const endTime =
                                                startDate
                                                    .toTimeString()
                                                    .substring(0, 8);


                                            /* =====================================================
                                               CHECK AVAILABILITY BOUNDARY
                                            ===================================================== */

                                            if (
                                                endTime >
                                                availability.end_time
                                            ) {

                                                return res.status(400).json({
                                                    message:
                                                        "Appointment exceeds staff availability"
                                                });

                                            }


                                            /* =====================================================
                                               CHECK APPROVED STAFF LEAVE
                                            ===================================================== */

                                            const leaveSql = `
                                                SELECT id
                                                FROM staff_leaves
                                                WHERE staff_id = ?
                                                AND leave_date = ?
                                                AND status = 'APPROVED'
                                                AND start_time < ?
                                                AND end_time > ?
                                            `;


                                            db.execute(
                                                leaveSql,
                                                [
                                                    staff_id,
                                                    appointment_date,
                                                    endTime,
                                                    start_time
                                                ],
                                                (err, leaveResult) => {

                                                    if (err) {

                                                        return res.status(500).json({
                                                            message:
                                                                "Database error while checking staff leave",
                                                            error: err
                                                        });

                                                    }


                                                    if (
                                                        leaveResult.length > 0
                                                    ) {

                                                        return res.status(409).json({
                                                            message:
                                                                "Staff is on approved leave during the selected time"
                                                        });

                                                    }


                                                    /* =====================================================
                                                       CHECK APPOINTMENT CONFLICT
                                                    ===================================================== */

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


                                                            /* =====================================================
                                                               CREATE APPOINTMENT
                                                            ===================================================== */

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


                                                                    /* =====================================================
                                                                       RETURN APPOINTMENT
                                                                       PAYMENT WILL HAPPEN NEXT
                                                                    ===================================================== */

                                                                    return res.status(201).json({

                                                                        message:
                                                                            "Appointment reserved successfully. Please complete payment.",

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

                }
            );

        }
    );

};



/* =========================================================
   GET MY APPOINTMENTS
========================================================= */

const getMyAppointments = (req, res) => {

    const userId = req.user.id;


    const sql = `
        SELECT
            a.id,

            DATE_FORMAT(
                a.appointment_date,
                '%Y-%m-%d'
            ) AS appointment_date,

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


    db.execute(
        sql,
        [userId],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    message: "Database error",
                    error: err
                });

            }


            res.status(200).json(result);

        }
    );

};



/* =========================================================
   GET STAFF APPOINTMENTS
========================================================= */

const getStaffAppointments = (req, res) => {

    const staffId = req.params.staffId;


    const sql = `
        SELECT
            a.id,

            DATE_FORMAT(
                a.appointment_date,
                '%Y-%m-%d'
            ) AS appointment_date,

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


    db.execute(
        sql,
        [staffId],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    message: "Database error",
                    error: err
                });

            }


            res.status(200).json(result);

        }
    );

};



/* =========================================================
   GET APPOINTMENT BY ID
========================================================= */

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

            DATE_FORMAT(
                a.appointment_date,
                '%Y-%m-%d'
            ) AS appointment_date,

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


    db.execute(
        sql,
        [appointmentId],
        (err, result) => {

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


            if (
                userRole === "CUSTOMER" &&
                appointment.user_id !== userId
            ) {

                return res.status(403).json({
                    message: "Access denied"
                });

            }


            if (
                userRole === "STAFF" &&
                appointment.staff_user_id !== userId
            ) {

                return res.status(403).json({
                    message: "Access denied"
                });

            }


            res.status(200).json(appointment);

        }
    );

};



/* =========================================================
   CANCEL APPOINTMENT
========================================================= */

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


    db.execute(
        findSql,
        [appointmentId],
        (err, result) => {

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


            if (
                userRole === "CUSTOMER" &&
                appointment.user_id !== userId
            ) {

                return res.status(403).json({
                    message:
                        "You can only cancel your own appointment"
                });

            }


            if (userRole === "STAFF") {

                const staffSql = `
                    SELECT id
                    FROM staff
                    WHERE id = ?
                    AND user_id = ?
                `;


                db.execute(
                    staffSql,
                    [
                        appointment.staff_id,
                        userId
                    ],
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

                            appointmentId:
                                appointmentId,

                            status:
                                "CANCELLED"

                        });

                    }
                );

            }

        }
    );

};



/* =========================================================
   RESCHEDULE APPOINTMENT
========================================================= */

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


    /* =====================================================
       GET EXISTING APPOINTMENT
    ===================================================== */

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


            const appointment =
                appointmentResult[0];


            if (
                userRole === "CUSTOMER" &&
                appointment.user_id !== userId
            ) {

                return res.status(403).json({
                    message:
                        "You can only reschedule your own appointment"
                });

            }


            if (userRole === "STAFF") {

                const staffSql = `
                    SELECT id
                    FROM staff
                    WHERE id = ?
                    AND user_id = ?
                `;


                db.execute(
                    staffSql,
                    [
                        appointment.staff_id,
                        userId
                    ],
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


            /* =====================================================
               CONTINUE RESCHEDULE
            ===================================================== */

            function continueReschedule() {

                if (appointment.status === "CANCELLED") {

                    return res.status(400).json({
                        message:
                            "Cancelled appointment cannot be rescheduled"
                    });

                }


                /* =====================================================
                   CHECK PAST DATE / TIME
                ===================================================== */

                const now = new Date();

                const todayDate =
                    now.getFullYear() +
                    "-" +
                    String(now.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(now.getDate()).padStart(2, "0");


                if (appointment_date < todayDate) {

                    return res.status(400).json({
                        message:
                            "You cannot reschedule to a past date"
                    });

                }


                if (appointment_date === todayDate) {

                    const currentMinutes =
                        now.getHours() * 60 +
                        now.getMinutes();

                    const timeParts =
                        start_time
                            .substring(0, 5)
                            .split(":");

                    const appointmentMinutes =
                        Number(timeParts[0]) * 60 +
                        Number(timeParts[1]);


                    if (appointmentMinutes <= currentMinutes) {

                        return res.status(400).json({
                            message:
                                "You cannot reschedule to a past time"
                        });

                    }

                }


                /* =====================================================
                   GET SERVICE DURATION
                ===================================================== */

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


                        /* =====================================================
                           FIND DAY OF WEEK
                        ===================================================== */

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


                                /* =====================================================
                                   CHECK STAFF AVAILABILITY
                                ===================================================== */

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


                                        /* =====================================================
                                           CALCULATE NEW END TIME
                                        ===================================================== */

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


                                        /* =====================================================
                                           CHECK AVAILABILITY BOUNDARY
                                        ===================================================== */

                                        if (
                                            endTime >
                                            availability.end_time
                                        ) {

                                            return res.status(400).json({
                                                message:
                                                    "Appointment exceeds staff availability"
                                            });

                                        }


                                        /* =====================================================
                                           CHECK APPROVED STAFF LEAVE
                                        ===================================================== */

                                        const leaveSql = `
                                            SELECT id
                                            FROM staff_leaves
                                            WHERE staff_id = ?
                                            AND leave_date = ?
                                            AND status = 'APPROVED'
                                            AND start_time < ?
                                            AND end_time > ?
                                        `;


                                        db.execute(
                                            leaveSql,
                                            [
                                                appointment.staff_id,
                                                appointment_date,
                                                endTime,
                                                start_time
                                            ],
                                            (err, leaveResult) => {

                                                if (err) {

                                                    return res.status(500).json({
                                                        message:
                                                            "Database error while checking staff leave",
                                                        error: err
                                                    });

                                                }


                                                if (
                                                    leaveResult.length > 0
                                                ) {

                                                    return res.status(409).json({
                                                        message:
                                                            "Staff is on approved leave during the selected time"
                                                    });

                                                }


                                                /* =====================================================
                                                   CHECK CONFLICTS
                                                ===================================================== */

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


                                                        /* =====================================================
                                                           UPDATE APPOINTMENT
                                                        ===================================================== */

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
                                                                        error:
                                                                            err
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
                );

            }

        }
    );

};



/* =========================================================
   EXPORT FUNCTIONS
========================================================= */

module.exports = {

    createAppointment,

    getMyAppointments,

    getStaffAppointments,

    getAppointmentById,

    cancelAppointment,

    rescheduleAppointment

};