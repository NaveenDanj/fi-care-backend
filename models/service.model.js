const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceSchema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
    },

    serviceName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    available: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true, strict: false }
);

const Service = mongoose.model("Service", ServiceSchema);
module.exports = Service;
