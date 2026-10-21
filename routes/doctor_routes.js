import {  Router } from "express";
import { doctorservice } from "../service/container.js";
import { authenticate, authorize } from "../middleware/auth_middleware.js";
import crypto from "node:crypto";
import prisma from "../lib/prisma.js";
const route = Router()

route.get('/:id' ,authenticate, authorize('PATIENT'),async (req , res , next)=>{
    const id = req.params.id 
    console.log(id)
    if (!id ){
        res.status(400).json({
            mssg:'Id is missing'
        })
    }

    try {
        
        const response = await doctorservice.getDoctorProfile(id)
    
        
            res.status(200).json({
                mssg:"Data Fetch successfully",
                data: response
            })
        
    } catch (error) {
        next(error)

    }
})

route.get('/availability/:id', authenticate,authorize('PATIENT'), async(req , res , next)=>{
  const { id } = req.params;
const { from, end } = req.query;
 
   if (!id || !from || !end){
        res.status(400).json({
            mssg:'required fields are  missing'
        })
    }
    try {
        
        const response = await doctorservice.getDoctorAvailability(id, from , end)
        console.log(response)
       return res.status(200).json({
    success: true,
    message: "Doctor availability fetched successfully",
    data: response.slots,
       })
    } catch (error) {
        next(error)

    }


})


route.patch('/:id' , authenticate , authorize('ADMIN'),  async(req , res , next)=>{
try {
const { id } = req.params;

  const doctor = await doctorservice.updateDoctorProfile(
    id,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: "Doctor profile updated successfully",
    data: doctor,
  });
} catch (error) {
  next(error);
}
} )


route.post(
  "/availability",
  authenticate,
  authorize("DOCTOR"),
  async (req, res, next) => {
    try {
      const { startAt, endAt, slotDurationMinutes = 30 } = req.body;

      // Find the logged-in doctor's profile
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.auth.userId },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found",
        });
      }

      const start = new Date(startAt);
      const end = new Date(endAt);

      if (
        !startAt ||
        !endAt ||
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start <= new Date() ||
        start >= end ||
        !Number.isInteger(slotDurationMinutes) ||
        slotDurationMinutes <= 0 ||
        (end - start) % (slotDurationMinutes * 60 * 1000) !== 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid availability details",
        });
      }

      const durationMs = slotDurationMinutes * 60 * 1000;
      const slots = [];

      for (
        let time = start.getTime();
        time < end.getTime();
        time += durationMs
      ) {
        slots.push({
          doctorId: doctor.id,
          startAt: new Date(time),
          endAt: new Date(time + durationMs),
          idempotencyKey: crypto.randomUUID(),
        });
      }

      await prisma.availabilitySlot.createMany({
        data: slots,
      });

      return res.status(201).json({
        success: true,
        message: "Availability slots created",
        count: slots.length,
      });
    } catch (error) {
      next(error);
    }
  }
);
export default route