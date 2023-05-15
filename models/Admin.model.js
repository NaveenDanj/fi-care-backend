const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
    },

    email: {
      type: String,
      required: true,
    },

    fullname: {
      type: String,
      required: true,
    },

    role: {
      type: Number,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    activated: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
