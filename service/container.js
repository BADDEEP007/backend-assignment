import prisma from "../lib/prisma.js";
import UserRespository from "../repository/UserRespository.js";
import doctorrepository from "../repository/doctorrepository.js";
import AvailabilitySlotRepository from "../repository/AvailabiltyRepository.js";


import AuthService from "./authservice.js";
import DoctorService from "./doctorservice.js";
import BookingService from "./bookingservice.js";
import DoctorApplicationService from "./doctorapplication.js";


const user_repo = new UserRespository(prisma.user)
const doctorrepo = new doctorrepository(prisma.doctor)
const avai_repo = new AvailabilitySlotRepository(prisma.AvailabilitySlot)

const authservice = new AuthService(user_repo)
const doctorservice = new DoctorService(doctorrepo ,avai_repo)
const bookingservice = new  BookingService(prisma)
const doc_application = new DoctorApplicationService(prisma)
export  {user_repo, prisma ,authservice , doctorservice , bookingservice , doc_application}