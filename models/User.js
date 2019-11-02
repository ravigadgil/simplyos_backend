const mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    certifications: {
        type: String,
        required: true
    },
    qualifications: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    tests: {
        type: Array,
        required: true
    }
  });
  let User = module.exports = mongoose.model('User', userSchema);