const cron = require("node-cron");
const { sendAppointmentReminders } = require("../services/reminderService");

const startAppointmentReminder = () => {

    cron.schedule("* * * * *", () => {

        console.log("Running appointment reminder job...");

        sendAppointmentReminders();

    });

    console.log("Appointment reminder cron job started");
};

module.exports = startAppointmentReminder;