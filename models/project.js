const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  discordUsername: {
    type: String,
    required: true,
  },
  twitterUsername: {
    type: String,
    required: true,
  },
  marketplaces: {
    type: Array,
    required: false,
  },
  activeDiscord: {
    type: Boolean,
    required: true,
  },
  creatorAddress1: {
    type: String,
    required: false,
  },
  creatorAddress2: {
    type: String,
    required: false,
  },
  creatorAddress3: {
    type: String,
    required: false,
  },
  creatorAddress4: {
    type: String,
    required: false,
  },
  creatorAddress5: {
    type: String,
    required: false,
  },
  discordWebhookUrl: {
    type: String,
    required: false,
  },
  activeTwitter: {
    type: Boolean,
    required: true,
  },
  twitterUserScreenName: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  activate: {
    type: Boolean,
    required: true,
  }
})

module.exports = mongoose.model('project', schema);