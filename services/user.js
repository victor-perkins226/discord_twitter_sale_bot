const schema = require('../models/user')

const findOne = async (filter) => {
  try {
    const result = await schema.findOne(filter);
    return {
      success: true,
      data: result,
      message: 'Success'
    };
  } catch (err) {
    return {
      success: false,
      data: err,
      message: 'Failed'
    };
  }
}

const findByFilter = async (filter) => {
  try {
    const total = await schema.count({
      $or: [
        { user_id: { $regex: `.*${filter.searchValue}.*` } },
        { screen_name: { $regex: `.*${filter.searchValue}.*` } }
      ]
    })

    const rows = await schema.find({
      $or: [
        { user_id: { $regex: `.*${filter.searchValue}.*` } },
        { screen_name: { $regex: `.*${filter.searchValue}.*` } }
      ]
    })
      .sort({
        [filter.column]: filter.direction === "asc" ? 1 : -1
      })
      .limit(filter.rowsPerPage)
      .skip((filter.currentPage - 1) * filter.rowsPerPage)

    return {
      success: true,
      data: { rows, total },
      message: 'Success'
    };
  } catch (err) {
    return {
      success: false,
      data: err,
      message: 'Failed'
    };
  }

}

const findMany = async (filter) => {
  try {
    const result = await schema.find(filter);
    return {
      success: true,
      data: result,
      message: 'Success'
    };
  } catch (err) {
    return {
      success: false,
      data: err,
      message: 'Failed'
    };
  }
}

const createOne = async (data) => {
  try {
    const user = await schema.findOne({ user_id: data.user_id });
    if (user === null) {
      const result = await schema.create(data);
      return { success: true, data: result, message: 'Successfully Created!' };
    } else {
      const result = await schema.findOneAndUpdate({ user_id: data.user_id }, data, { new: true })
      return { success: true, data: result, message: 'Successfully Created!' };
    }
  } catch (err) {
    return { success: false, data: err, message: 'User Create Failed!' };
  }
}

const updateOne = async (data) => {
  try {
    const filter = { user_id: data.user_id }
    const result = await schema.findOneAndUpdate(filter, data, { new: true })

    return { success: true, data: result, message: 'Success' };
  } catch (err) {
    return { success: false, data: err, message: 'Failed' };
  }
}

const deleteMany = async (filter) => {
  try {
    const result = await schema.deleteMany(filter);

    return { success: true, data: result, message: 'Success' };
  } catch (err) {
    return { success: false, data: err, message: 'Failed' };
  }
}

const deleteOne = async (filter) => {
  try {
    const result = await schema.deleteOne(filter)

    return { success: true, data: result, message: 'Success' };
  } catch (err) {
    return { success: false, ata: err, message: 'Failed' };
  }
}

module.exports = {
  findOne,
  findByFilter,
  findMany,
  createOne,
  updateOne,
  deleteOne,
  deleteMany
}