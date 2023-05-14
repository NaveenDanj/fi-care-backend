const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
    },

    
    email: {
        type: String,
        required: false,
    },
    
    role : {
        type: Number,
        required : false
    },

    phone: {
      type: String,
      required: false,
    },

    password: {
      type: String,
      required: false,
    },

  },
  { timestamps: true, strict: false }
);

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
