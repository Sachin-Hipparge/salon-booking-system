const db = require("../config/db");
const { generateInvoiceNumber } = require("../utils/generateInvoice");

const createInvoice = (req, res, next) => {
    const { appointmentId } = req.body;
    const userId = req.user.id;

    if (!appointmentId) {
        return res.status(400).json({
            message: "Appointment ID is required"
        });
    }

    const appointmentSql = `
        SELECT
            a.id,
            a.user_id,
            a.payment_status,
            s.price,
            s.name AS service_name
        FROM appointments a
        JOIN services s
            ON a.service_id = s.id
        WHERE a.id = ?
    `;

    db.execute(
        appointmentSql,
        [appointmentId],
        (err, appointments) => {

            if (err) {
                return next(err);
            }

            if (appointments.length === 0) {
                return res.status(404).json({
                    message: "Appointment not found"
                });
            }

            const appointment = appointments[0];

            // Check appointment ownership
            if (appointment.user_id !== userId) {
                return res.status(403).json({
                    message:
                        "You are not allowed to create an invoice for this appointment"
                });
            }

            // Invoice can only be generated after payment
            if (appointment.payment_status !== "PAID") {
                return res.status(400).json({
                    message:
                        "Invoice can only be generated after successful payment"
                });
            }

            // Check whether invoice already exists
            const existingInvoiceSql = `
                SELECT *
                FROM invoices
                WHERE appointment_id = ?
            `;

            db.execute(
                existingInvoiceSql,
                [appointmentId],
                (err, existingInvoices) => {

                    if (err) {
                        return next(err);
                    }

                    // Don't create duplicate invoice
                    if (existingInvoices.length > 0) {
                        return res.status(200).json({
                            message: "Invoice already exists",
                            invoice: existingInvoices[0]
                        });
                    }

                    const amount = Number(appointment.price);

                    // 18% GST
                    const tax = Number(
                        (amount * 0.18).toFixed(2)
                    );

                    const totalAmount = Number(
                        (amount + tax).toFixed(2)
                    );

                    const invoiceNumber =
                        generateInvoiceNumber();

                    const insertInvoiceSql = `
                        INSERT INTO invoices
                        (
                            appointment_id,
                            invoice_number,
                            amount,
                            tax,
                            total_amount,
                            invoice_date
                        )
                        VALUES (?, ?, ?, ?, ?, NOW())
                    `;

                    db.execute(
                        insertInvoiceSql,
                        [
                            appointmentId,
                            invoiceNumber,
                            amount,
                            tax,
                            totalAmount
                        ],
                        (err, result) => {

                            if (err) {
                                return next(err);
                            }

                            return res.status(201).json({
                                message:
                                    "Invoice created successfully",

                                invoice: {
                                    id: result.insertId,
                                    appointment_id:
                                        appointmentId,
                                    invoice_number:
                                        invoiceNumber,
                                    service_name:
                                        appointment.service_name,
                                    amount: amount,
                                    tax: tax,
                                    total_amount:
                                        totalAmount
                                }
                            });
                        }
                    );
                }
            );
        }
    );
};


const getInvoice = (req, res, next) => {

    const { appointmentId } = req.params;
    const userId = req.user.id;

    const sql = `
        SELECT
            i.*,
            a.user_id,
            s.name AS service_name
        FROM invoices i
        JOIN appointments a
            ON i.appointment_id = a.id
        JOIN services s
            ON a.service_id = s.id
        WHERE i.appointment_id = ?
    `;

    db.execute(
        sql,
        [appointmentId],
        (err, invoices) => {

            if (err) {
                return next(err);
            }

            if (invoices.length === 0) {
                return res.status(404).json({
                    message: "Invoice not found"
                });
            }

            if (invoices[0].user_id !== userId) {
                return res.status(403).json({
                    message:
                        "You are not allowed to view this invoice"
                });
            }

            return res.status(200).json({
                invoice: invoices[0]
            });
        }
    );
};


module.exports = {
    createInvoice,
    getInvoice
};