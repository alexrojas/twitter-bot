const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

// const nodemailer = require('nodemailer');

const userSchema = new Schema({
  username: String,
  password: String,
  twitterUsername: String,
  twitterId: String,
  displayName: String,
  description: String,
  image: String,
  token: String,
  tokenSec: String,
  phone: Number,
  botFollowing: Array

}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
