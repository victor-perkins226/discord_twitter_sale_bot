const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  }
})

module.exports = mongoose.model('marketplace', schema);