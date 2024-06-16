const mongoose = require("mongoose");

const ModelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    isPresent: {
      type: Boolean,
      default: true,
    },
    inTime: {
      type: Date,
    },
    outTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

const attendacneModel = mongoose.model("attendance", ModelSchema);

module.exports = attendacneModel;
