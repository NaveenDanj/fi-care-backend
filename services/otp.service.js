const { v4 } = require("uuid");
const { generateUUIDToken } = require("./token.service");
const Otp = require("../models/otp.model");

module.exports = {
  // generate random token for reset password link
  handle_otp(user) {
    return new Promise(async (resolve, reject) => {
      let token = generateUUIDToken();
      let otp = new Otp({
        phone: user.phone,
        token: token,
        otp: Math.floor(Math.random() * (999999 - 100000 + 1) + 100000),
      });
      await otp.save();
      resolve(token);
    });
  },
};
