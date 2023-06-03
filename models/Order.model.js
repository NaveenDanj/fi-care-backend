const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dataSchema = new Schema(
  {
    success: {
      type: Boolean,
    },
    elapsed: {
      type: Number,
    },
  },
  { strict: false }
);

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Booking",
    },

    orderId: {
      type: String,
      required: true,
    },

    requestId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    data: {
      type: dataSchema,
      required: false,
      default: null,
    },
  },
  { timestamps: true, strict: false }
);

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
