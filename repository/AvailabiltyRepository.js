// repositories/AvailabilitySlotRepository.js

import Crudoperationdb from "./CrudRespository.js";

class AvailabilitySlotRepository extends Crudoperationdb {
  constructor(model) {
    super(model)
  }

  findAvailableSlots(doctorId, from, to) {
    return this.model.findMany({
      where: {
        doctorId,
        status: "AVAILABLE",
        startAt: {
          gte: from,
          lt: to,
        },
      },
      orderBy: { startAt: "asc" },
    });
  }
}

export default AvailabilitySlotRepository