# Salon Appointment Booking System

A full-stack Salon Appointment Booking System built using Node.js, Express.js, MySQL, HTML, CSS, and JavaScript.

The system allows customers to register, book salon appointments, make online payments, receive email confirmations and reminders, submit reviews, and view invoices.

Admins can manage services, staff, users, appointments, payments, and reviews.

Staff members can view their assigned appointments and respond to customer reviews.

---

## Features

### Customer Features

- Customer registration and login
- JWT-based authentication
- View and update profile
- Browse salon services
- Book appointments
- Appointment availability checking
- Appointment conflict prevention
- View personal appointments
- Cancel appointments
- Reschedule appointments
- Receive appointment confirmation emails
- Receive appointment reminder emails
- Razorpay test payment integration
- Payment verification
- Generate and view invoices
- Submit reviews after completing an appointment
- View staff responses to reviews

### Staff Features

- Staff login
- View assigned appointments
- View customer details
- View customer reviews
- Respond to customer reviews

### Admin Features

- Admin authentication and authorization
- Admin dashboard
- View all users
- View all staff
- View all services
- View all appointments
- Update appointment status
- Activate/deactivate services
- View all payments
- View all reviews

---

## Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MySQL
- mysql2

### Authentication and Security

- JWT
- bcrypt

### Payment

- Razorpay Test Mode

### Email

- Nodemailer
- Gmail SMTP

### Other Technologies

- node-cron
- AWS EC2
- Amazon S3
- PM2
- Nginx

---

## Project Structure

```text
salon-booking-system/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── appointmentController.js
│   │   ├── authController.js
│   │   ├── paymentController.js
│   │   ├── reviewController.js
│   │   ├── serviceController.js
│   │   ├── staffController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   ├── adminMiddleware.js
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── availabilityRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── staffRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── services/
│   │   ├── emailService.js
│   │   ├── paymentService.js
│   │   └── reminderService.js
│   │
│   ├── cron/
│   │   └── appointmentReminder.js
│   │
│   ├── utils/
│   │   ├── generateInvoice.js
│   │   └── generateToken.js
│   │
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── booking.html
│   ├── payment.html
│   ├── invoice.html
│   ├── staff.html
│   ├── admin.html
│   ├── script.js
│   └── style.css
│
├── .gitignore
└── README.md
```

---

## Database

The application uses MySQL as the relational database.

### Main Tables

- `users`
- `services`
- `staff`
- `staff_services`
- `availability`
- `appointments`
- `payments`
- `invoices`
- `reviews`

### Main Relationships

```text
Users
 │
 ├── Appointments
 │       ├── Services
 │       └── Staff
 │
 ├── Payments
 │
 └── Reviews

Staff
 │
 ├── Staff Services
 ├── Availability
 └── Appointments

Services
 │
 ├── Staff Services
 ├── Appointments
 └── Reviews
```

---

## Authentication Flow

The application uses JWT for user authentication.

```text
User Login
     ↓
Verify Email and Password
     ↓
Generate JWT Token
     ↓
Send Token to Frontend
     ↓
Frontend Stores Token
     ↓
Token Sent in Authorization Header
     ↓
JWT Middleware Verifies Token
     ↓
Access Protected API
```

---

## Appointment Booking Flow

```text
Customer Login
      ↓
Select Service
      ↓
Select Staff
      ↓
Select Date and Time
      ↓
Check Staff Availability
      ↓
Check Appointment Conflict
      ↓
Create Appointment
      ↓
Appointment Status = BOOKED
      ↓
Payment Status = PENDING
      ↓
Confirmation Email
      ↓
Razorpay Payment
      ↓
Payment Verification
      ↓
Payment Status = PAID
      ↓
Appointment Completed
      ↓
Customer Submits Review
```

---

## Appointment Conflict Prevention

Before creating an appointment, the backend checks:

1. Staff availability
2. Whether the selected service is assigned to the staff
3. Existing appointments for the selected staff
4. Date and time overlap

This prevents multiple customers from booking the same staff member at the same time.

---

## Payment Flow

The application uses Razorpay Test Mode.

```text
Customer Selects Appointment
          ↓
Create Razorpay Order
          ↓
Razorpay Checkout
          ↓
Customer Completes Payment
          ↓
Receive Payment ID
          ↓
Verify Payment Signature
          ↓
Payment Marked SUCCESS
          ↓
Appointment Marked PAID
```

---

## Invoice Flow

After successful payment and completion of the appointment:

```text
Paid Appointment
      ↓
Generate Invoice
      ↓
Generate Invoice Number
      ↓
Calculate Tax
      ↓
Store Invoice
      ↓
Customer Views Invoice
      ↓
Print / Save as PDF
```

---

## Email Notifications

Nodemailer with Gmail SMTP is used for email notifications.

### Appointment Confirmation

A confirmation email is sent after an appointment is successfully booked.

### Appointment Reminder

A scheduled cron job checks upcoming appointments and sends reminder emails.

The appointment is marked as reminded after the email is sent to avoid duplicate reminders.

---

## Cron Job

The project uses `node-cron` for appointment reminders.

During development, the reminder job runs every minute so that it can be tested easily.

For production, the schedule can be changed to a suitable interval.

---

## Reviews

Customers can submit a review only after their appointment is marked as `COMPLETED`.

A review contains:

- Rating
- Comment
- Service
- Staff
- Appointment

Staff members can respond to reviews associated with them.

---

## Admin Authorization

Admin APIs are protected using authentication and role-based authorization.

```text
Request
   ↓
JWT Authentication
   ↓
Check User Role
   ↓
Is User ADMIN?
   ↓
Allow Access
```

---

## API Base URL

For local development:

```text
http://localhost:5000/api
```

---

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

User
GET /api/users/profile
PUT /api/users/profile

Services
GET /api/services
POST /api/services
PUT /api/services/:id
DELETE /api/services/:id

Staff
GET /api/staff
POST /api/staff
PUT /api/staff/:id
DELETE /api/staff/:id

Availability
GET /api/availability/:staffId
POST /api/availability
PUT /api/availability/:id
DELETE /api/availability/:id

Appointments
POST /api/appointments
GET /api/appointments/my
GET /api/appointments/:id
GET /api/appointments/staff/:staffId
PUT /api/appointments/:id/cancel
PUT /api/appointments/:id/reschedule

Payments
POST /api/payments/create-order
POST /api/payments/verify

Reviews
POST /api/reviews
GET /api/reviews/service/:serviceId
PUT /api/reviews/:reviewId/respond

Admin
GET /api/admin/dashboard
GET /api/admin/appointments
PUT /api/admin/appointments/:appointmentId/status
GET /api/admin/users
GET /api/admin/services
PUT /api/admin/services/:serviceId/status
GET /api/admin/payments
GET /api/admin/reviews
GET /api/admin/staff

---

## Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=salon_booking

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email
EMAIL_PASS=your_google_app_password

RAZORPAY_KEY_ID=your_razorpay_test_key
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-github-repository-url>

cd salon-booking-system/backend

npm install

CREATE DATABASE salon_booking;

node server.js

http://localhost:5000
```

---

## Testing

The application APIs were tested using Postman.

The following features were tested:

- User registration
- User login
- JWT authentication
- Profile management
- Service management
- Staff management
- Staff-service assignment
- Staff availability
- Appointment booking
- Appointment conflict checking
- Appointment cancellation
- Appointment rescheduling
- Email confirmation
- Appointment reminder
- Razorpay test payment
- Payment verification
- Invoice generation
- Customer reviews
- Staff review response
- Admin dashboard
- Admin appointment management
- Admin user management
- Admin service management
- Admin payment management
- Admin review management
- Staff appointment dashboard

---

## Deployment

The backend can be deployed on an AWS EC2 instance.

A typical production architecture is:

```text
Internet
    ↓
Nginx
    ↓
Node.js / Express
    ↓
MySQL
```

---

## Security

The application implements:

- Password hashing using bcrypt
- JWT authentication
- Role-based authorization
- Protected APIs
- Razorpay payment signature verification
- Environment variables for sensitive credentials
- `.gitignore` for sensitive files

---

## Author

**Sachin Hipparge**

Full Stack Developer | Node.js | Express.js | MySQL | JavaScript
