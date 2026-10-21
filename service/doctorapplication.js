class DoctorApplicationService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async submitApplication(userId, data) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (user.role !== "PATIENT") {
      const error = new Error("Only patients can apply");
      error.status = 403;
      throw error;
    }

    const existing = await this.prisma.doctorApplication.findFirst({
      where: {
        applicantId: userId,
        status: "PENDING",
      },
    });

    if (existing) {
      const error = new Error("You already have a pending application");
      error.status = 409;
      throw error;
    }

    if (
      !data.specialty?.trim() ||
      !data.qualification?.trim() ||
      !data.licenseNumber?.trim() ||
      !Number.isInteger(data.experienceYears) ||
      data.experienceYears < 0 ||
      !Number.isFinite(Number(data.consultationFee)) ||
      Number(data.consultationFee) < 0
    ) {
      const error = new Error("Invalid or missing application fields");
      error.status = 400;
      throw error;
    }

    return this.prisma.doctorApplication.create({
      data: {
        applicantId: userId,
        specialty: data.specialty.trim(),
        qualification: data.qualification.trim(),
        licenseNumber: data.licenseNumber.trim(),
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        bio: data.bio?.trim() || null,
      },
    });
  }

  async listPendingApplications() {
    return this.prisma.doctorApplication.findMany({
      where: { status: "PENDING" },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async approveApplication(applicationId, adminId) {
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.doctorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        const error = new Error("Application not found");
        error.status = 404;
        throw error;
      }

      if (application.status !== "PENDING") {
        const error = new Error("Application has already been reviewed");
        error.status = 409;
        throw error;
      }

      const user = await tx.user.findUnique({
        where: { id: application.applicantId },
      });

      if (!user || user.role !== "PATIENT") {
        const error = new Error("Applicant is not eligible for approval");
        error.status = 409;
        throw error;
      }

      const duplicateLicense = await tx.doctor.findUnique({
        where: { licenseNumber: application.licenseNumber },
      });

      if (duplicateLicense) {
        const error = new Error("This medical license is already registered");
        error.status = 409;
        throw error;
      }

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialty: application.specialty,
          qualification: application.qualification,
          licenseNumber: application.licenseNumber,
          experienceYears: application.experienceYears,
          consultationFee: application.consultationFee,
          bio: application.bio,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { role: "DOCTOR" },
      });

      await tx.doctorApplication.update({
        where: { id: application.id },
        data: {
          status: "APPROVED",
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: "DOCTOR_APPLICATION_APPROVED",
          entityType: "DoctorApplication",
          entityId: application.id,
          metadata: { doctorId: doctor.id, applicantId: user.id },
        },
      });

      return doctor;
    });
  }

  async rejectApplication(applicationId, adminId, reason) {
    if (!reason?.trim()) {
      const error = new Error("A rejection reason is required");
      error.status = 400;
      throw error;
    }

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.doctorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        const error = new Error("Application not found");
        error.status = 404;
        throw error;
      }

      if (application.status !== "PENDING") {
        const error = new Error("Application has already been reviewed");
        error.status = 409;
        throw error;
      }

      const updated = await tx.doctorApplication.updateMany({
        where: {
          id: applicationId,
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          reviewedById: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason.trim(),
        },
      });

      if (updated.count !== 1) {
        const error = new Error("Application was already reviewed");
        error.status = 409;
        throw error;
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminId,
          action: "DOCTOR_APPLICATION_REJECTED",
          entityType: "DoctorApplication",
          entityId: applicationId,
          metadata: { reason: reason.trim() },
        },
      });

      return { id: applicationId, status: "REJECTED" };
    });
  }
}

export default DoctorApplicationService;