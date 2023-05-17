const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceProviderServiceSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    serviceId: {
      type: String,
      required: true,
    },

    categoryId: {
      type: String,
      required: false,
    },

    jobTitle: {
      type: String,
      required: false,
    },

    charges: {
      type: Number,
      required: true,
    },

    jobsCompleted: {
      type: Number,
      required: true,
      default: 0,
    },

    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, strict: false }
);

const ServiceProviderService = mongoose.model(
  "ServiceProviderService",
  ServiceProviderServiceSchema
);
module.exports = ServiceProviderService;
