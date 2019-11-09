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
  },
  reviews_length: {
    type: Number,
    required: true,
  },
  reviews_sum: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  updated: {
    type: Boolean
  }
});
let Test = module.exports = mongoose.model('Test', testSchema);