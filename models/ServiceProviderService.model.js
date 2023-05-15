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
      required: true,
    },

    charges: {
      type: Number,
      required: true,
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
