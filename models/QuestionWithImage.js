const mongoose = require('mongoose');

let questionSchema = mongoose.Schema({
  test_id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
    },
    answer: {
        type: String,
        required: true
    },
    href: {
        type: String,
        required: true
    },

});
let Category = module.exports = mongoose.model('QuestionWithImage', questionSchema);