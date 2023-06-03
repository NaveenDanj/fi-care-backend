const express = require("express");
const router = express.Router();
const Joi = require("joi");
const AuthRequired = require("../middlewares/userauthrequired.middleware");
const Booking = require("../models/Booking.model");
const instance = require("../services/axios.service");
const { generateUUIDToken } = require("../services/token.service");
const Order = require("../models/Order.model");

router.post("/make-payment", AuthRequired(), async (req, res) => {
  const validator = Joi.object({
    bookingId: Joi.string().required(),
  });

  try {
    let data;

    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({
        message: "Error in validating request!",
        error: err,
      });
    }

    let booking = await Booking.findOne({
      _id: data.bookingId,
      userId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status != "Completed-Job") {
      return res.status(404).json({
        message: "Job is not completed for continue on payment",
      });
    }

    if (booking.paid) {
      return res.status(404).json({
        message: "Payment is already completed for this booking",
      });
    }

    let _order = await Order.findOne({ bookingId: booking._id });

    if (_order) {
      return res.status(200).json({
        message: "Payment processing",
        _order,
      });
    }

    const requestId = generateUUIDToken();

    let payload = {
      requestId,
      orderId: booking._id,
      currency: "AED",
      amount: 100,
      totals: {
        subtotal: 100,
        tax: 5,
        shipping: 3,
        handling: 2,
        discount: 10,
        skipTotalsValidation: false,
      },
      items: [
        {
          name: "Dark grey sunglasses",
          sku: "1116521",
          unitprice: 50,
          quantity: 2,
          linetotal: 100,
        },
      ],
      customer: {
        id: "123456",
        firstName: "[First name]",
        lastName: "[Last name]",
        email: "[CUSTOMER EMAIL]",
        phone: "[CUSTOMER PHONE]",
      },
      billingAddress: {
        name: "[NAME]",
        address1: "[ADDRESS 1]",
        address2: "[ADDRESS 2]",
        city: "[CITY]",
        state: "[STATE]",
        zip: "12345",
        country: "AE",
        set: true,
      },
      deliveryAddress: {
        name: "[NAME]",
        address1: "[ADDRESS 1]",
        address2: "[ADDRESS 2]",
        city: "[CITY]",
        state: "[STATE]",
        zip: "12345",
        country: "AE",
        set: true,
      },
      returnUrl: "https://shop.example.com/payment-redirect/",
      branchId: 0,
      allowedPaymentMethods: ["CARD"],
      defaultPaymentMethod: "CARD",
      language: "EN",
    };

    let results;

    try {
      results = await instance.post("/checkout/web", payload, {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          "X-Paymennt-Api-Key": process.env.PAYMENT_GATEWAY_KEY,
          "X-Paymennt-Api-Secret": process.env.PAYMENT_GATEWAY_SECRET,
        },
      });
    } catch (er) {
      return res.status(400).json({
        message: "Error in validating request 2!",
        er,
      });
    }

    let order = new Order({
      userId: req.user._id,
      bookingId: booking._id,
      orderId: booking._id,
      requestId,
      amount: 100,
      data: results.data,
      status: "PENDING",
    });

    await order.save();

    return res.status(200).json({
      message: "Payment processing",
      order,
    });
  } catch (err) {
    console.log("err : ", err);
    return res.status(500).json({
      message: "Error in processing transaction",
      error: err,
    });
  }
});

router.get("/check-payment-status", async (req, res) => {
  let id = req.query.id;

  if (!id) {
    return res.status(400).json({
      message: "Payment id required",
    });
  }

  try {
    let order = await Order.findOne({ _id: id });

    if (!order) {
      return res.status(404).json({
        message: "Order not found!",
      });
    }

    if (!order.data) {
      return res.status(409).json({
        message: "Order data missing!",
      });
    }

    let data = await instance.get(`/checkout/${order.data.result.id}`, {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        "X-Paymennt-Api-Key": process.env.PAYMENT_GATEWAY_KEY,
        "X-Paymennt-Api-Secret": process.env.PAYMENT_GATEWAY_SECRET,
      },
    });
    order.data = data.data;
    order.status = data.data.result.status;
    await order.save();

    return res.status(200).json({
      message: "Payment fetched successfully!",
      order,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error in fetching payment status",
      error: err,
    });
  }
});

module.exports = router;
