
import crypto from "node:crypto";
class doctorservice {
    constructor(doctorrepo, availab_repo){
        this.doctor_repo = doctorrepo
         this.availab_repo = availab_repo;



    }

      async getDoctorProfile(doctorId) {
       
    const doctor = await this.doctor_repo.findById(doctorId);

    if (!doctor) {
      const error = new Error("Doctor not found");
      error.status = 404;
      throw error;
    }

    return doctor;}
  async searchDoctors({ specialty, page = 1, limit = 10 } = {}) {
    if (!Number.isInteger(page) || page < 1) {
      const error = new Error("Page must be a positive integer");
      error.status = 400;
      throw error;
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      const error = new Error("Limit must be between 1 and 100");
      error.status = 400;
      throw error;
    }

    const options = {
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { experienceYears: "desc" },
    };

    if (specialty?.trim()) {
      return this.doctor_repo.findBySpecialty(
        specialty.trim(),
        options
      );
    }

    return this.doctor_repo.findActiveDoctors(options);
  }
async getDoctorAvailability(doctorId, from, end) {
  await this.getDoctorProfile(doctorId);

  const fromDate = from ? new Date(from) : new Date();
  const toDate = end
    ? new Date(end)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    console.log({
  from,
  end,
  fromTimestamp: new Date(from).getTime(),
  endTimestamp: new Date(end).getTime(),
});
  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime()) ||
    fromDate >= toDate
  ) {
    const error = new Error("Invalid availability date range");
    error.status = 400;
    throw error;
  }

  return this.availab_repo.findAvailableSlots(
    doctorId,
    fromDate,
    toDate
  );
}

  async updateDoctorProfile(doctorId, data) {
    await this.getDoctorProfile(doctorId);

    const allowedFields = [
      "specialty",
      "qualification",
      "experienceYears",
      "consultationFee",
      "bio",
    ];

    const updates = Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

    if (Object.keys(updates).length === 0) {
      const error = new Error("No valid profile fields provided");
      error.status = 400;
      throw error;
    }

    return this.doctor_repo.update(doctorId, updates);
  }
  async createAvailabilitySlots(doctorId, {
  startAt,
  endAt,
  slotDurationMinutes = 30,
}) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start <= new Date() ||
    start >= end
  ) {
    throw new Error("Invalid availability date range");
  }

  if (
    !Number.isInteger(slotDurationMinutes) ||
    slotDurationMinutes <= 0
  ) {
    throw new Error("Invalid slot duration");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor || !doctor.isActive) {
    throw new Error("Active doctor not found");
  }

  const durationMs = slotDurationMinutes * 60 * 1000;
  const totalDuration = end.getTime() - start.getTime();

  if (totalDuration % durationMs !== 0) {
    throw new Error(
      "Availability window must be divisible by slot duration"
    );
  }

  const slots = [];

  for (
    let current = start.getTime();
    current < end.getTime();
    current += durationMs
  ) {
    slots.push({
      doctorId,
      startAt: new Date(current),
      endAt: new Date(current + durationMs),
      idempotencyKey: crypto.randomUUID(),
    });
  }

  return prisma.$transaction(async (tx) => {
    const overlap = await tx.availabilitySlot.findFirst({
      where: {
        doctorId,
        startAt: { lt: end },
        endAt: { gt: start },
      },
    });

    if (overlap) {
      throw new Error("Availability overlaps existing slots");
    }

    await tx.availabilitySlot.createMany({
      data: slots,
    });

    return tx.availabilitySlot.findMany({
      where: {
        doctorId,
        startAt: { gte: start, lt: end },
      },
      orderBy: { startAt: "asc" },
    });
  });
}
}

export default doctorservice;