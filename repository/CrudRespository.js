class Crudoperationdb{
    constructor(model){
        if(!model){
            throw new Error('Database model is missing')

        }
        this.model = model;
    }

    create(data){
        return this.model.create({data})
    }

    findById(id){
        return this.model.findUnique({
            where:{id}
        })
    }

    findAll(options = {}){
        return this.model.findMany(options)
    }
    update(id , data){
        return this.model.update({
            where :{id},
            data
        })
    }
    delete(id){
        return this.model.delete({
            where:{id}
        })
    }
}

export default Crudoperationdb