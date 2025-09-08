const mongoose = require("mongoose");

mongoose.connect(`mongodb://127.0.0.1:27017/practice`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userAccountSchema = mongoose.Schema({
  username: String,
  password: String,
  email: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Data Schema
const dataSchema = mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  isCompleted: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create Models
const userModel = mongoose.model("userAccount", userAccountSchema);
const dataModel = mongoose.model("data", dataSchema);

module.exports = { userModel, dataModel };
