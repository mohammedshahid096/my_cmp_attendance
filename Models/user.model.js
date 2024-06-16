const mongoose = require("mongoose");

const ModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model("user", ModelSchema);

module.exports = userModel;
