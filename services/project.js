const schema = require('../models/project')

const findOneByID = async (_id) => {
    try{
        const result = await schema.find({
            _id : _id
        });
        return {
            success: true,
            data: result,
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }
}

const findByFilter = async (filter) => {
    try{
        const total = await schema.count({
            $or: [
                {projectName:{$regex:`.*${filter.searchValue}.*`}},
                {clientName:{$regex:`.*${filter.searchValue}.*`}},
                {discordUsername:{$regex:`.*${filter.searchValue}.*`}},
                {twitterUsername:{$regex:`.*${filter.searchValue}.*`}}
            ]
        })
    
        const rows = await schema.find({
            $or: [
                {projectName:{$regex:`.*${filter.searchValue}.*`}},
                {clientName:{$regex:`.*${filter.searchValue}.*`}},
                {discordUsername:{$regex:`.*${filter.searchValue}.*`}},
                {twitterUsername:{$regex:`.*${filter.searchValue}.*`}}
            ]
        })
        .sort({
            [filter.column] : filter.direction === "asc" ? 1 : -1
        })
        .limit(filter.rowsPerPage)
        .skip((filter.currentPage - 1) * filter.rowsPerPage)
    
        return {
            success: true,
            data: { rows, total },
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }

}

const findAll = async () => {
    try{
        const result = await schema.find({});
        return {
            success: true,
            data: result,
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }
}

const createOne = async (data) => {
    try{
        const result = await schema.create(data);
        result.save();
        return {
            success: true,
            data: result,
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }
}

const updateOne = async (data) => {
    try{
        const filter = { _id: data._id }
        delete data._id
        const result = await schema.findOneAndUpdate(filter, data, {new: true})

        return {
            success: true,
            data: result,
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }
}

const deleteAll = async () => {
    try{
        const result = await schema.deleteMany({});

        return {
            success: true,
            data: result,
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }
}

const deleteOne = async (_id) => {
    try{
        const result = await schema.deleteOne({
            _id: _id
        })

        return {
            success: true,
            data: result,
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }
}

const findAllActivated = async () => {
    try{
        const result = await schema.find({
            activate: true
        })
    
        return {
            success: true,
            data: result,
            message: 'Success'
        };
    } catch(err) {
        return {
            success: false,
            data: err,
            message: 'Failed'
        };
    }

}

module.exports = {
    findOneByID,
    findByFilter,
    findAllActivated,
    findAll,
    createOne,
    updateOne,
    deleteOne,
    deleteAll
}