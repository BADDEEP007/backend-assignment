import { Router } from "express";
import BookingService from "../service/bookingservice.js";
import {
  authenticate,
  authorize,
} from "../middleware/auth_middleware.js";
import { bookingservice } from "../service/container.js";

const router = Router();

// POST /bookings
// Headers: Authorization: Bearer <token>
//          Idempotency-Key: <unique-key>
// Body: { "slotId": "..." }

router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  async (req, res, next) => {
    try {
      const { slotId } = req.body;
      const patientId = req.auth.userId;
      const idempotencyKey = req.get("Idempotency-Key");

      if (!slotId) {
        return res.status(400).json({
          success: false,
          message: "slotId is required",
        });
      }

      if (!idempotencyKey?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Idempotency-Key header is required",
        });
      }

      const booking = await BookingService.bookSlot(
        patientId,
        slotId,
        idempotencyKey
      );

      return res.status(201).json({
        success: true,
        message: "Consultation booked successfully",
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /bookings/:consultationId/cancel

router.patch(
  "/:consultationId/cancel",
  authenticate,
  authorize("PATIENT"),
  async (req, res, next) => {
    try {
      const { consultationId } = req.params;
      const patientId = req.auth.userId;

      const result = await BookingService.cancelBooking(
        patientId,
        consultationId
      );

      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;