const Booking = require("../models/Booking.model");
const Order = require("../models/Order.model");
const instance = require("../services/axios.service");

const checkTransaction = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let orders = await Order.find({ status: "PENDING" });

      for (let i = 0; i < orders.length; i++) {
        let data = await instance.get(`/checkout/${orders[i].data.result.id}`, {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            "X-Paymennt-Api-Key": process.env.PAYMENT_GATEWAY_KEY,
            "X-Paymennt-Api-Secret": process.env.PAYMENT_GATEWAY_SECRET,
          },
        });

        orders[i].data = data.data;
        orders[i].status = data.data.result.status;
        await orders[i].save();

        if (data.data.result.status == "PAID") {
          let booking = await Booking.findOne({ _id: orders[i].bookingId });
          booking.paid = true;
          booking.orderId = orders[i]._id;
          await booking.save();
        } else if (
          data.data.result.status == "EXPIRED" ||
          data.data.result.status == "CANCELLED" ||
          data.data.result.status == "FAILED"
        ) {
          await Order.deleteOne({ _id: orders[i]._id });
        }
      }
      resolve(true);
    } catch (err) {
      reject(false);
    }
  });
};

module.exports = checkTransaction;
