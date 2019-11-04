const mongoose = require('mongoose');

let commentSchema = mongoose.Schema({
  comment: {
    type: String,
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
let Comment = module.exports = mongoose.model('Comment', commentSchema);