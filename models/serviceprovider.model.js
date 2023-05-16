const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceProviderSchema = new Schema(
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

    photoUrl: {
      type: String,
      required: false,
    },

    phone: {
      type: String,
      required: false,
    },

    description: {
      type: String,
      required: false,
    },

    rate: {
      type: Number,
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

    activated: {
      type: Boolean,
      required: false,
    },
  },
  { timestamps: true, strict: false }
);

const ServiceProvider = mongoose.model(
  "ServiceProvider",
  ServiceProviderSchema
);
module.exports = ServiceProvider;
