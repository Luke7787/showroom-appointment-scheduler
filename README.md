# 🗓️ Showroom Appointment Scheduler

**Live Site:**  
👉 https://showroom-appointment-scheduler.onrender.com

A full-stack web application that allows customers to book showroom appointments and provides admins with a secure dashboard to manage scheduling.

---

## 🚀 Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- React Hot Toast (notifications)

### Backend
- Next.js API Routes (App Router)
- Prisma ORM
- PostgreSQL (hosted on Render)

---

## 🔐 Authentication & Authorization
- Clerk for user authentication and session handling
- Admin access restricted via allow-listed admin emails
- Frontend verifies admin privileges via API before rendering admin dashboard

---

## ☁️ Deployment
- Render Web Service
- Connected to Render PostgreSQL instance
- Always-on service (Starter tier)

---

## ✨ Features

### 👤 Customer Features
- View available time slots for a selected date
- Time slot availability is calculated using:
  - Business hours
  - Slot duration
  - Existing bookings
  - Past time blocking
- Book an appointment with:
  - Name
  - Email
  - Optional phone number

---

### 🛠️ Admin Features
- Secure, admin-only dashboard
- View all appointments by date
- Real-time slot status:
  - Available
  - Pending
  - Confirmed
  - Past
- View full appointment details
- Confirm pending appointments
- Decline (delete) pending appointments

---

### ⏱️ Scheduling Logic
- Prevents double booking
- Prevents booking past time slots
- Automatically converts local time to UTC for database storage

---

## 👔 Admin Account (For Review)

To access the admin dashboard, log in with the following admin email:

- **Email:** showroom.team.booking@gmail.com  
- **Password:** Please reach out to the project owner for the password

Only allow-listed emails are granted admin privileges.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|--------|------------|
| GET | `/api/slots?date=YYYY-MM-DD` | Returns all time slots for selected date with status |
| POST | `/api/appointments` | Creates a new booking request (status = `PENDING`) |
| GET | `/api/admin/appointments?date=YYYY-MM-DD` | Returns appointments for selected date (admin only) |
| PATCH | `/api/admin/appointments/[id]` | Confirms an appointment (admin only) |
| DELETE | `/api/admin/appointments/[id]` | Declines an appointment (admin only) |
| GET | `/api/is-admin` | Verifies admin privileges for frontend |

---

## 🗄️ Database

- PostgreSQL hosted on Render
- Schema managed with Prisma
- Migrations tracked via Prisma Migrate
- Main models include:
  - Appointments
  - Timestamps
  - Status enums
