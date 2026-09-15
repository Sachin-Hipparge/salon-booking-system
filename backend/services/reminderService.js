const db = require("../config/db");
const {
    sendAppointmentReminder
} = require("./emailService");


// Send reminder for upcoming appointments
const sendAppointmentReminders = () => {

    const sql = `
        SELECT
            a.id,
            a.appointment_date,
            a.start_time,
            a.end_time,

            u.name AS customer_name,
            u.email AS customer_email,

            s.name AS service_name,

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

        WHERE a.status IN ('BOOKED', 'RESCHEDULED')

        AND a.reminder_sent = FALSE

        AND TIMESTAMP(
            a.appointment_date,
            a.start_time
        )
        BETWEEN NOW()
        AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
    `;


    db.execute(sql, (err, appointments) => {

        if (err) {

            console.error(
                "Reminder database error:",
                err
            );

            return;
        }


        if (appointments.length === 0) {

            console.log(
                "No appointments require reminders."
            );

            return;
        }


        appointments.forEach(async (appointment) => {

            try {

                await sendAppointmentReminder({

                    customerEmail:
                        appointment.customer_email,

                    customerName:
                        appointment.customer_name,

                    appointmentId:
                        appointment.id,

                    appointmentDate:
                        appointment.appointment_date,

                    startTime:
                        appointment.start_time,

                    endTime:
                        appointment.end_time,

                    serviceName:
                        appointment.service_name,

                    staffName:
                        appointment.staff_name
                });


                // Mark reminder as sent
                const updateSql = `
                    UPDATE appointments
                    SET reminder_sent = TRUE
                    WHERE id = ?
                `;


                db.execute(
                    updateSql,
                    [appointment.id],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "Failed to update reminder status:",
                                updateErr
                            );

                            return;
                        }


                        console.log(
                            `Reminder sent for appointment ${appointment.id}`
                        );
                    }
                );

            } catch (emailError) {

                console.error(
                    `Reminder email failed for appointment ${appointment.id}:`,
                    emailError
                );
            }
        });
    });
};


module.exports = {
    sendAppointmentReminders
};