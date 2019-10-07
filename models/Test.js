const mongoose = require('mongoose');

let testSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  questions: {
    type: Array,
    required: true
  },
  answers: {
    type: Array,
    required: true
  },
  category_id: {
    type: String,
    required: true
  }
});
let Test = module.exports = mongoose.model('Test', testSchema);