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

    categoryName: {
      type: String,
      required: false,
    },

    jobTitle: {
      type: String,
      required: false,
    },

    charges: {
      type: Number,
      required: false,
    },

    jobsCompleted: {
      type: Number,
      required: false,
      default: 0,
    },

    description: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, strict: false }
);

const ServiceProviderService = mongoose.model(
  "ServiceProviderService",
  ServiceProviderServiceSchema
);
module.exports = ServiceProviderService;
