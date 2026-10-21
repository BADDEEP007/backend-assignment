import Crudoperationdb from "./CrudRespository.js";


class doctorrepository extends Crudoperationdb{
    constructor(model){
        super(model)
    }

    finduserId(userId){
        return this.model.findUnique({
            where:{userId},

        })
    }

    findbyLicenseNumber (LicenseNumber){
        return this.model.findUnique({
            where : {LicenseNumber}
        })
    }

    findActiveDoc(options= {}){
        return this.model.findMany({
            ...options,
            where:{
                ...options.where,
                isActive :true
            },

        })
    }
    findbyspeciality (speciality , options = {}){
        return this.model.findMany({
            ...options,
            where: {
                ...options.where,
                speciality:{
                    equals:speciality,
                    mode:"insensitive"
                },
                isActive:true
            },
        })
    }

    findDoctorWIthSchedules(doctorID){
        return this.model.findUnique({
            where:{id:doctorID},
            include:{
                schedules:true,
                availabilitySlots:{
                    where:{status:"AVAILABLE"},
                    OrderBy:{
                        startAt:'asc'
                    }
                }
            }
        })
    }
    findAvailableSlots(doctorId, from, to) {
  return this.model.findUnique({
    where: { id: doctorId },
    select: { id: true },
  }).then(async (doctor) => {
    if (!doctor) return [];

    return this.model.findUnique({
      where: { id: doctorId },
      select: {
        availabilitySlots: {
          where: {
            status: "AVAILABLE",
            startAt: {
              gte: from,
              lt: to,
            },
          },
          orderBy: { startAt: "asc" },
        },
      },
    }).then((result) => result.availabilitySlots);
  });
}

}


export default doctorrepository