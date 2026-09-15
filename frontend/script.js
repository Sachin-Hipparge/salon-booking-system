const payButton = document.getElementById("payButton");

payButton.addEventListener("click", async () => {

    try {

        // Get JWT token
        const token = prompt("Enter your customer JWT token:");

        if (!token) {
            alert("JWT token is required");
            return;
        }

        // Create Razorpay order
        const response = await fetch(
            "http://localhost:5000/api/payments/create-order",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    appointmentId: 5
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to create payment order");
            console.error(data);
            return;
        }

        console.log("Payment order:", data);


        // Razorpay Checkout options
        const options = {

            key: data.key_id,

            amount: data.amount,

            currency: data.currency,

            name: "My Salon",

            description: data.service_name,

            order_id: data.order_id,

            handler: async function (paymentResponse) {

                console.log(
                    "Razorpay payment response:",
                    paymentResponse
                );


                // Verify payment on backend
                const verifyResponse = await fetch(
                    "http://localhost:5000/api/payments/verify",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },

                        body: JSON.stringify({

                            appointmentId: 5,

                            razorpay_order_id:
                                paymentResponse.razorpay_order_id,

                            razorpay_payment_id:
                                paymentResponse.razorpay_payment_id,

                            razorpay_signature:
                                paymentResponse.razorpay_signature
                        })
                    }
                );


                const verifyData =
                    await verifyResponse.json();


                console.log(
                    "Verification response:",
                    verifyData
                );


                if (verifyResponse.ok) {

                    alert(
                        "Payment successful and verified!"
                    );

                } else {

                    alert(
                        verifyData.message ||
                        "Payment verification failed"
                    );
                }
            },


            prefill: {
                name: "Customer",
                email: "sachinhipparge064@gmail.com"
            },


            theme: {
                color: "#3399cc"
            }
        };


        const razorpay =
            new Razorpay(options);


        razorpay.on(
            "payment.failed",
            function (response) {

                console.error(
                    "Payment failed:",
                    response.error
                );

                alert(
                    "Payment failed: " +
                    response.error.description
                );
            }
        );


        razorpay.open();

    } catch (error) {

        console.error(
            "Payment error:",
            error
        );

        alert(
            "Something went wrong while starting payment"
        );
    }
});