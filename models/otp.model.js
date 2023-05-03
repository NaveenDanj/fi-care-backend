const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OtpSchema = new Schema(
  {
    id: {
      type: Schema.Types.ObjectId,
    },

    phone: {
      type: String,
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    otp: {
      type: Number,
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: "1m",
    },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", OtpSchema);
module.exports = Otp;
