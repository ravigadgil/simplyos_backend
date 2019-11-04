const mongoose = require('mongoose');

let reviewSchema = mongoose.Schema({
  review: {
    type: Number,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  post_id: {
    type: String,
    required: true
  }
});
let Review = module.exports = mongoose.model('Review', reviewSchema);