# Luke Zhuang's [Appointment Scheduler](https://showroom-appointment-scheduler.onrender.com)

**Live Site:** https://showroom-appointment-scheduler.onrender.com

Full-stack appointment scheduling application with role-based admin dashboard access.

## System Architecture

<p align="center">
  <img
    width="900"
    alt="System Architecture Diagram — Created by Luke Zhuang"
    src="https://github.com/user-attachments/assets/c1b7bfe6-ffac-45fc-8e6b-11adc981b9cd"
  />
</p>

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Render
- React Hot Toast

## Security
- Clerk for authentication and session management
- Admin access restricted to allow-listed emails
- Admin privileges verified via API before rendering the dashboard

## Deployment
- Deployed on Render
- PostgreSQL hosted on Render

## Features

### Customer
- View available time slots by date
- Real-time slot status (Available, Pending, Confirmed, Past)
- Book appointments with name, email, and optional phone number

### Admin
- View available time slots by date
- Real-time slot status (Available, Pending, Confirmed, Past)
- Secure dashboard with allow-listed email access
- Confirm or decline pending appointments
- View full appointment details

### Scheduling Logic
- Prevents booking past time slots
- Prevents double booking

## Admin Access

Admin dashboard access is restricted to allow-listed email accounts.

To request admin access for review purposes, please contact:
lukewzhuang@gmail.com

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/slots?date=YYYY-MM-DD` | Returns time slots for a selected date with current status |
| POST | `/api/appointments` | Creates a new appointment (status: `PENDING`) |
| GET | `/api/admin/appointments?date=YYYY-MM-DD` | Returns appointments for a selected date (admin only) |
| PATCH | `/api/admin/appointments/[id]` | Updates appointment status to confirmed (admin only) |
| DELETE | `/api/admin/appointments/[id]` | Deletes an appointment (admin only) |
| GET | `/api/is-admin` | Verifies admin privileges for frontend access |

## Database

- PostgreSQL
- Schema managed with Prisma
- Migrations handled via Prisma Migrate

## SQL Database Tradeoffs (PostgreSQL)

### Pros
- Enforced schema ensures data integrity
- Supports joins and complex relational queries
  - Example: retrieve appointments with user name and email
  - Example: filter appointments by admin users

### Cons
- Schema changes require migrations
- Less flexible for evolving data structures
