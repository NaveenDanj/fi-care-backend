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

    phoneVerified: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true, strict: false }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
