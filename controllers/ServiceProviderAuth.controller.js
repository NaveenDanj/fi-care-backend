const express = require("express");
const router = express.Router();
const Joi = require("joi");

const {
  hashPasswod,
  comparePassword,
} = require("../services/password.service");
const { generateUUIDToken } = require("../services/token.service");
const { generateToken } = require("../services/jwt.service");

const AuthRequired = require("../middlewares/userauthrequired.middleware");

// @ts-ignore
const AuthToken = require("../models/authtoken.model");
const OTP = require("../models/otp.model");
const ServiceProvider = require("../models/serviceprovider.model");

router.post("/login", async (req, res) => {
  let validator = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  try {
    let data;

    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(500).json({
        message: "Request validation error.",
        error: err,
      });
    }

    let serviceProvider = await ServiceProvider.findOne({ email: data.email });

    if (!serviceProvider) {
      return res.status(400).json({
        message: "Email or password is incorrect!",
      });
    }

    const isMatch = await comparePassword(
      data.password,
      serviceProvider.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Email or password is incorrect!",
      });
    }

    let _token = generateToken(serviceProvider.email);

    let accessToken = new AuthToken({
      userId: serviceProvider._id,
      token: _token,
      type: "ServiceProvider",
    });

    await accessToken.save();

    return res.status(200).json({
      serviceProvider,
      token: _token,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error in service provider login.",
      error: err,
    });
  }
});

module.exports = router;
