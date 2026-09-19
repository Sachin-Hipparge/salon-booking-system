      const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "";

        const token =
            localStorage.getItem("token");


        // =================================================
        // AUTH CHECK
        // =================================================

        if (!token) {

            window.location.href =
                "login.html";

        }


        // =================================================
        // ELEMENTS
        // =================================================

        const reviewForm =
            document.getElementById(
                "reviewForm"
            );

        const reviewMessage =
            document.getElementById(
                "reviewMessage"
            );

        const appointmentIdInput =
            document.getElementById(
                "appointmentId"
            );

        const ratingInput =
            document.getElementById(
                "rating"
            );

        const commentInput =
            document.getElementById(
                "comment"
            );

        const reviewsContainer =
            document.getElementById(
                "reviewsContainer"
            );

        const navUserName =
            document.getElementById(
                "navUserName"
            );


        // =================================================
        // SHOW MESSAGE
        // =================================================

        function showMessage(
            message,
            type
        ) {

            reviewMessage.textContent =
                message;

            reviewMessage.className =
                `review-message ${type}`;

        }


        // =================================================
        // LOAD PROFILE
        // =================================================

        async function loadProfile() {

            try {

                const response =
                    await fetch(
                        `${API_URL}/api/users/profile`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {
                    return;
                }


                const user =
                    data.user || data;


                navUserName.textContent =
                    user.name || "Customer";


            } catch (error) {

                console.error(
                    "Profile error:",
                    error
                );

            }

        }


        // =================================================
        // RATING STARS
        // =================================================

        const ratingStars =
            document.querySelectorAll(
                ".rating-star"
            );


        ratingStars.forEach(
            star => {

                star.addEventListener(
                    "click",
                    () => {

                        const selectedRating =
                            Number(
                                star.dataset.rating
                            );


                        ratingInput.value =
                            selectedRating;


                        ratingStars.forEach(
                            item => {

                                const itemRating =
                                    Number(
                                        item.dataset.rating
                                    );

                                if (
                                    itemRating <=
                                    selectedRating
                                ) {

                                    item.classList.add(
                                        "active"
                                    );

                                } else {

                                    item.classList.remove(
                                        "active"
                                    );

                                }

                            }
                        );

                    }
                );

            }
        );


        // =================================================
        // GET APPOINTMENT ID FROM URL
        // =================================================

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const urlAppointmentId =
            urlParams.get(
                "appointmentId"
            );


        if (urlAppointmentId) {

            appointmentIdInput.value =
                urlAppointmentId;

            loadAppointment(
                urlAppointmentId
            );

        }


        // =================================================
        // LOAD APPOINTMENT
        // =================================================

        async function loadAppointment(
            appointmentId
        ) {

            try {

                const response =
                    await fetch(
                        `${API_URL}/api/appointments/${appointmentId}`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    return;

                }


                const appointment =
                    data.appointment ||
                    data;


                const appointmentInfo =
                    document.getElementById(
                        "appointmentInfo"
                    );


                appointmentInfo.innerHTML = `

                    <p>
                        <strong>Service:</strong>
                        ${appointment.service_name || "-"}
                    </p>

                    <p>
                        <strong>Staff:</strong>
                        ${appointment.staff_name || "-"}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${appointment.appointment_date || "-"}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${appointment.status || "-"}
                    </p>

                `;


                appointmentInfo.style.display =
                    "block";


                const selectedAppointment =
                    document.getElementById(
                        "selectedAppointment"
                    );

                const selectedDetails =
                    document.getElementById(
                        "selectedAppointmentDetails"
                    );


                selectedDetails.innerHTML = `

                    <p>
                        <strong>Appointment ID:</strong>
                        ${appointment.id || appointmentId}
                    </p>

                    <p>
                        <strong>Service:</strong>
                        ${appointment.service_name || "-"}
                    </p>

                    <p>
                        <strong>Staff:</strong>
                        ${appointment.staff_name || "-"}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${appointment.status || "-"}
                    </p>

                    <p>
                        <strong>Payment:</strong>
                        ${appointment.payment_status || "-"}
                    </p>

                `;


                selectedAppointment.style.display =
                    "block";


            } catch (error) {

                console.error(
                    "Appointment error:",
                    error
                );

            }

        }


        // =================================================
        // SUBMIT REVIEW
        // =================================================

        reviewForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const appointmentId =
                    Number(
                        appointmentIdInput.value
                    );

                const rating =
                    Number(
                        ratingInput.value
                    );

                const comment =
                    commentInput.value.trim();


                if (!appointmentId) {

                    showMessage(
                        "Please enter an appointment ID.",
                        "error"
                    );

                    return;

                }


                if (
                    rating < 1 ||
                    rating > 5
                ) {

                    showMessage(
                        "Please select a rating from 1 to 5 stars.",
                        "error"
                    );

                    return;

                }


                if (!comment) {

                    showMessage(
                        "Please enter your review.",
                        "error"
                    );

                    return;

                }


                try {

                    const response =
                        await fetch(
                            `${API_URL}/api/reviews`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body: JSON.stringify({
                                    appointmentId:
                                        appointmentId,

                                    rating:
                                        rating,

                                    comment:
                                        comment
                                })
                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to submit review."
                        );

                    }


                    showMessage(
                        "Review submitted successfully!",
                        "success"
                    );


                    reviewForm.reset();

                    ratingInput.value =
                        0;


                    ratingStars.forEach(
                        star =>
                            star.classList.remove(
                                "active"
                            )
                    );


                    loadReviews();


                } catch (error) {

                    console.error(
                        "Review submission error:",
                        error
                    );


                    showMessage(
                        error.message,
                        "error"
                    );

                }

            }
        );


        // =================================================
        // LOAD REVIEWS
        // =================================================

        async function loadReviews() {

            reviewsContainer.innerHTML = `

                <div class="loading-reviews">
                    Loading reviews...
                </div>

            `;


            try {

                /*
                 * Load services first.
                 * Then load reviews for each service.
                 */

                const servicesResponse =
                    await fetch(
                        `${API_URL}/api/services`
                    );


                const servicesData =
                    await servicesResponse.json();


                if (!servicesResponse.ok) {

                    throw new Error(
                        servicesData.message ||
                        "Unable to load services."
                    );

                }


                const services =
                    Array.isArray(servicesData)
                        ? servicesData
                        : (
                            servicesData.services ||
                            servicesData.data ||
                            []
                        );


                let html = "";

                let hasReviews = false;


                for (
                    const service
                    of services
                ) {

                    try {

                        const response =
                            await fetch(
                                `${API_URL}/api/reviews/service/${service.id}`
                            );


                        const data =
                            await response.json();


                        if (!response.ok) {
                            continue;
                        }


                        const reviews =
                            Array.isArray(data)
                                ? data
                                : (
                                    data.reviews ||
                                    data.data ||
                                    []
                                );


                        if (!reviews.length) {
                            continue;
                        }


                        hasReviews = true;


                        html += `

                            <div class="service-review-section">

                                <h3>
                                    ${service.name}
                                </h3>

                        `;


                        reviews.forEach(
                            review => {

                                const rating =
                                    Number(
                                        review.rating
                                    );


                                const stars =
                                    "★".repeat(
                                        rating
                                    ) +
                                    "☆".repeat(
                                        5 - rating
                                    );


                                html += `

                                    <div class="review-item">

                                        <div class="review-top">

                                            <span class="review-customer">
                                                ${review.customer_name || review.user_name || "Customer"}
                                            </span>

                                            <span class="review-rating">
                                                ${stars}
                                            </span>

                                        </div>


                                        <div class="review-comment">

                                            ${review.comment || "No comment"}

                                        </div>


                                        ${
                                            review.staff_response
                                                ? `
                                                    <div class="staff-response">

                                                        <strong>
                                                            Staff Response
                                                        </strong>

                                                        <span>
                                                            ${review.staff_response}
                                                        </span>

                                                    </div>
                                                `
                                                : ""
                                        }

                                    </div>

                                `;

                            }
                        );


                        html += `
                            </div>
                        `;


                    } catch (error) {

                        console.error(
                            `Unable to load reviews for service ${service.id}:`,
                            error
                        );

                    }

                }


                if (!hasReviews) {

                    reviewsContainer.innerHTML = `

                        <div class="no-reviews">

                            <h3>
                                No reviews yet
                            </h3>

                            <p>
                                Be the first customer to share
                                your salon experience.
                            </p>

                        </div>

                    `;

                    return;

                }


                reviewsContainer.innerHTML =
                    html;


            } catch (error) {

                console.error(
                    "Reviews loading error:",
                    error
                );


                reviewsContainer.innerHTML = `

                    <div class="no-reviews">

                        <h3>
                            Unable to load reviews
                        </h3>

                        <p>
                            ${error.message}
                        </p>

                    </div>

                `;

            }

        }


        // =================================================
        // LOGOUT
        // =================================================

        function logout() {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );


            window.location.href =
                "login.html";

        }


        document
            .getElementById("logoutBtn")
            .addEventListener(
                "click",
                logout
            );


        document
            .getElementById("mobileLogoutBtn")
            .addEventListener(
                "click",
                logout
            );


        // =================================================
        // MOBILE MENU
        // =================================================

        const menuBtn =
            document.getElementById(
                "menuBtn"
            );

        const mobileMenu =
            document.getElementById(
                "mobileMenu"
            );


        menuBtn.addEventListener(
            "click",
            () => {

                mobileMenu.classList.toggle(
                    "show"
                );


                menuBtn.textContent =
                    mobileMenu.classList.contains(
                        "show"
                    )
                        ? "✕"
                        : "☰";

            }
        );


        // =================================================
        // INITIAL LOAD
        // =================================================

        loadProfile();

        loadReviews();