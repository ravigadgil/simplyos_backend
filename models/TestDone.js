const mongoose = require('mongoose');

let categorySchema = mongoose.Schema({
    user_id: {
        type: String,
        required: true
      },
      test_id: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true
      },
});
let TestDone = module.exports = mongoose.model('TestDone', categorySchema);