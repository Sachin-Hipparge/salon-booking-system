const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async ({
    amount,
    receipt
}) => {

    const options = {
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: receipt
    };

    const order = await razorpay.orders.create(options);

    return order;
};

module.exports = {
    razorpay,
    createRazorpayOrder
};