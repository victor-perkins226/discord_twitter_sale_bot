const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  screen_name: {
    type: String,
    required: true,
  },
  oauth_token: {
    type: String,
    required: false,
  },
  oauth_token_secret: {
    type: String,
    required: false,
  }
})

module.exports = mongoose.model('user', schema);