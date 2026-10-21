import { Router } from "express";
import { doc_application } from "../service/container.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth_middleware.js";

const router = Router();

// POST /doctor-applications
router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  async (req, res, next) => {
    try {
      const application =
        await doc_application.submitApplication(
          req.auth.userId,
          req.body
        );

      return res.status(201).json({
        success: true,
        message: "Doctor application submitted",
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;