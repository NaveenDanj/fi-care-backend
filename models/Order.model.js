const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
  },
  { timestamps: true, strict: false }
);

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
