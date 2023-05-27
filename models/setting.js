const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  }
})

module.exports = mongoose.model('setting', schema);