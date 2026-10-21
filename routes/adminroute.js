import { Router } from "express";
import { doc_application } from "../service/container.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth_middleware.js";

const router = Router();

// GET /admin/doctor-applications
router.get(
  "/doctor-applications",
  authenticate,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const applications =
        await doc_application.listPendingApplications();

      return res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /admin/doctor-applications/:id/approve
router.patch(
  "/doctor-applications/:id/approve",
  authenticate,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const doctor =
        await doc_application.approveApplication(
          req.params.id,
          req.auth.userId
        );

      return res.status(200).json({
        success: true,
        message: "Doctor application approved",
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /admin/doctor-applications/:id/reject
router.patch(
  "/doctor-applications/:id/reject",
  authenticate,
  authorize("ADMIN"),
  async (req, res, next) => {
    try {
      const result =
        await doc_application.rejectApplication(
          req.params.id,
          req.auth.userId,
          req.body.reason
        );

      return res.status(200).json({
        success: true,
        message: "Doctor application rejected",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;