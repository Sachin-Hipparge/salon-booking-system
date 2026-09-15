const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Appointment confirmation email
const sendAppointmentConfirmation = async ({
    customerEmail,
    customerName,
    appointmentId,
    appointmentDate,
    startTime,
    endTime,
    serviceName,
    staffName,
    price
}) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: "Salon Appointment Confirmation",
        html: `
            <h2>Appointment Confirmed</h2>

            <p>Hello ${customerName},</p>

            <p>Your salon appointment has been successfully booked.</p>

            <h3>Appointment Details</h3>

            <p><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Staff:</strong> ${staffName}</p>
            <p><strong>Date:</strong> ${appointmentDate}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
            <p><strong>Price:</strong> ₹${price}</p>

            <p>Please arrive a few minutes before your scheduled appointment.</p>

            <p>Thank you for choosing our salon!</p>
        `
    };

    await transporter.sendMail(mailOptions);
};


// Appointment reminder email
const sendAppointmentReminder = async ({
    customerEmail,
    customerName,
    appointmentId,
    appointmentDate,
    startTime,
    endTime,
    serviceName,
    staffName
}) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: "Salon Appointment Reminder",
        html: `
            <h2>Appointment Reminder</h2>

            <p>Hello ${customerName},</p>

            <p>This is a reminder about your upcoming salon appointment.</p>

            <h3>Appointment Details</h3>

            <p><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Staff:</strong> ${staffName}</p>
            <p><strong>Date:</strong> ${appointmentDate}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>

            <p>Please arrive a few minutes before your scheduled appointment.</p>

            <p>Thank you for choosing our salon!</p>
        `
    };

    await transporter.sendMail(mailOptions);
};


module.exports = {
    sendAppointmentConfirmation,
    sendAppointmentReminder
};