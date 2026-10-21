import Crudoperationdb from "./CrudRespository.js";


class UserRespository extends Crudoperationdb{
    constructor(model){
        super(model);
    }

    findbyEmail(email){
        return this.model.findUnique({
            where:{email}
        });
    }
}

export default UserRespository