const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
    },

    fullname: {
      type: String,
      required: false,
    },

    email: {
      type: String,
      required: false,
    },

    phone: {
      type: String,
      required: false,
    },

    photoUrl: {
      type: String,
      required: false,
    },

    password: {
      type: String,
      required: false,
    },

    homeAddress: {
      type: String,
      required: false,
    },

    workAddress: {
      type: String,
      required: false,
    },

    phoneVerified: {
      type: Boolean,
      required: false,
    },

    walletAmount: {
      type: Number,
      default: 0.0,
      required: false,
    },
  },
  { timestamps: true, strict: false }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
