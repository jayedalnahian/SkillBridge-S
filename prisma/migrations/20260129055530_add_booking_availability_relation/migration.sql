/*
  Warnings:

  - You are about to drop the `availability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bookings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "availability" DROP CONSTRAINT "availability_tutorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_studentId_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_tutorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_bookingId_fkey";

-- DropTable
DROP TABLE "availability";

-- DropTable
DROP TABLE "bookings";

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "dayOfWeek" "Days" NOT NULL,
    "startTime" VARCHAR(10) NOT NULL,
    "endTime" VARCHAR(10) NOT NULL,
    "duration" INTEGER NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "maxStudents" INTEGER NOT NULL DEFAULT 1,
    "specificDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "availabilityId" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "meetingLink" VARCHAR(500),
    "meetingType" "MeetingTypes" NOT NULL DEFAULT 'ONLINE',
    "studentNotes" TEXT,
    "cancelledBy" "CancelledBy",
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
