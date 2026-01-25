-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING';
