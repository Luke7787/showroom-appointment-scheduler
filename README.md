**Showroom Appointment Scheduler**

**Live Site:** https://showroom-appointment-scheduler.onrender.com

**Tech Stack**

  **Frontend**
    - Next.js (App Router)
    - React
    - TypeScript
    - Tailwind CSS
    - React Hot Toast for notifications

  **Backend**
    - Next.js API Routes (App Router)
    - Prisma ORM
    - PostgreSQL (hosted on Render)

**Authentication**
  - Clerk for user authentication and session handling
  - Admin access controlled by allow-listed admin emails

**Deployment**
  - Render Web Service
  - Connected to Render PostgreSQL
  - Always-on service (Starter tier)

**Features**

  **Customer Features**
  
  - View available time slots for a selected date

  **Time slots integrated:**
    - business hours
    - slot duration
    - existing bookings
    - past time blocking
    
  **Book an appointment with:**
    - name
    - email
    - optional phone number

  **Admin Features**
    - Secure admin-only dashboard
    - View all appointment requests by date

  **See real-time slot status:**
    - Available
    - Pending
    - Confirmed
    - Past
    - View full appointment details
    - Confirm pending appointments
    - Decline (delete) pending appointments

  **Scheduling Logic**
    - Prevents double booking
    - Prevents booking past time slots
    - Automatically converts local time to UTC for storage

**API Endpoints**
  - GET /api/slots?date=YYYY-MM-DD : Returns all time slots for the selected date with status
  - POST /api/appointments : Creates a new booking request (status = PENDING)
  - GET /api/admin/appointments?date=YYYY-MM-DD : Get Appointments for a Date
  - PATCH /api/admin/appointments/[id] : Confirm Appointment
  - DELETE /api/admin/appointments/[id] : Decline Appointment
  - GET /api/is-admin : Used by frontend to verify admin privileges

**Database**
  - PostgreSQL hosted on Render
  - Migrations tracked via Prisma
  - Prisma schema manages:
      - appointments
      - timestamps
      - status enums
