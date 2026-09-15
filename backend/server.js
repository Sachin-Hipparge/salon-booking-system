require("dotenv").config();

const app = require("./app");
const startAppointmentReminder = require("./cron/appointmentReminder");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

startAppointmentReminder();