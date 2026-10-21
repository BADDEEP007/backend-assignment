// services/BookingService.js

class BookingService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async bookSlot(patientId, slotId, idempotencyKey) {
    if (!idempotencyKey?.trim()) {
      const error = new Error("Idempotency-Key header is required");
      error.status = 400;
      throw error;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Return the original result if this request was already processed.
        const existing = await tx.consultation.findUnique({
          where: { idempotencyKey },
        });

        if (existing) {
          if (
            existing.patientId !== patientId ||
            existing.slotId !== slotId
          ) {
            const error = new Error(
              "Idempotency key was already used for another request"
            );
            error.status = 409;
            throw error;
          }

          return existing;
        }

        const slot = await tx.availabilitySlot.findUnique({
          where: { id: slotId },
          include: {
            doctor: {
              select: { isActive: true },
            },
          },
        });

        if (!slot) {
          const error = new Error("Availability slot not found");
          error.status = 404;
          throw error;
        }

        if (!slot.doctor.isActive) {
          const error = new Error("Doctor is not active");
          error.status = 409;
          throw error;
        }

        if (slot.startAt <= new Date()) {
          const error = new Error("Cannot book a past slot");
          error.status = 400;
          throw error;
        }

        // Atomic conditional update prevents two patients from
        // successfully claiming the same slot.
        const claimed = await tx.availabilitySlot.updateMany({
          where: {
            id: slotId,
            status: "AVAILABLE",
            startAt: { gt: new Date() },
          },
          data: { status: "BOOKED" },
        });

        if (claimed.count !== 1) {
          const error = new Error("Slot is no longer available");
          error.status = 409;
          throw error;
        }

        return tx.consultation.create({
          data: {
            doctorId: slot.doctorId,
            patientId,
            slotId,
            status: "BOOKED",
            idempotencyKey,
          },
        });
      });
    } catch (error) {
      // Concurrent requests with the same idempotency key can race
      // on the unique constraint. Return the first result if present.
      if (error.code === "P2002") {
        const existing = await this.prisma.consultation.findUnique({
          where: { idempotencyKey },
        });

        if (
          existing &&
          existing.patientId === patientId &&
          existing.slotId === slotId
        ) {
          return existing;
        }
      }

      throw error;
    }
  }

  async cancelBooking(patientId, consultationId) {
    return this.prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.findFirst({
        where: {
          id: consultationId,
          patientId,
        },
      });

      if (!consultation) {
        const error = new Error("Booking not found");
        error.status = 404;
        throw error;
      }

      if (!["BOOKED", "CONFIRMED"].includes(consultation.status)) {
        const error = new Error(
          "This consultation cannot be cancelled"
        );
        error.status = 409;
        throw error;
      }

      const updated = await tx.consultation.updateMany({
        where: {
          id: consultationId,
          patientId,
          status: { in: ["BOOKED", "CONFIRMED"] },
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        const error = new Error(
          "Booking status changed; refresh and try again"
        );
        error.status = 409;
        throw error;
      }

      await tx.availabilitySlot.update({
        where: { id: consultation.slotId },
        data: { status: "AVAILABLE" },
      });

      return {
        id: consultationId,
        status: "CANCELLED",
      };
    });
  }
}

export default BookingService;