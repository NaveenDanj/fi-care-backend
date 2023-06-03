const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    serviceId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Service",
    },

    serviceProviderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ServiceProvider",
    },

    categoryName: {
      type: String,
      required: true,
    },

    task: {
      type: String,
      required: true,
    },

    bookingDateTime: {
      type: Date,
      required: true,
      default: 0,
    },

    bookingLocationAddress: {
      type: String,
      required: true,
    },

    jobStartedDateTime: {
      type: Date,
      required: false,
      default: null,
    },

    jobCompletedDateTime: {
      type: Date,
      required: false,
      default: null,
    },

    paid: {
      type: Boolean,
      required: true,
      default: false,
    },

    orderId: {
      type: String,
      required: false,
    },

    status: {
      type: String,
      enum: [
        "Request-Sent",
        "Booking-Confirmed",
        "Started-Job",
        "Completed-Job",
        "Booking-Cancelled",
        "Rejected",
      ],
      default: "Request-Sent",
    },

    reviewed: {
      type: Boolean,
      required: false,
      default: false,
    },

    rating: {
      type: Number,
      required: false,
    },

    feedback: {
      type: String,
      required: false,
    },

    image: {
      type: String,
      required: false,
    },

    description: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, strict: false }
);

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
