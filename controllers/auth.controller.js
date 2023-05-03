const express = require("express");
const router = express.Router();
const Joi = require("joi");

const {
  hashPasswod,
  comparePassword,
} = require("../services/password.service");

const { generateUUIDToken } = require("../services/token.service");

// @ts-ignore
const User = require("../models/user.model");

router.post("/login", async (req, res) => {
  return res.json({
    hello: "world",
  });
});

router.post("/register-with-social-account", async (req, res) => {
  let validator = Joi.object({
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().required(),
  });

  try {
    await validator.validateAsync(req.body, { abortEarly: false });
    const hashedPassword = await hashPasswod(req.body.password);
    let user = new User({
      fullname: req.body.fullname,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      photoUrl: "not setup",
    });

    // check of user email
    let email_check = await User.findOne({ email: req.body.email });
    if (email_check) {
      return res.status(400).json({
        message: "Email already user in another account!",
      });
    }

    // check for user phone
    let phone_check = await User.findOne({ phone: req.body.phone });
    if (phone_check) {
      return res.status(400).json({
        message: "Phone number already user in another account!",
      });
    }

    let userObject = await user.save();

    return res.status(201).json({
      message: "New user created",
      user: userObject,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error creating user",
      error: err,
    });
  }
});

router.post("/register-with-phone-enter-phone", async (req, res) => {
  let validator = Joi.object({
    phone: Joi.string()
      .regex(/^[0-9]{10}$/)
      .messages({ "string.pattern.base": `Phone number must have 10 digits.` })
      .required(),
  });

  try {
    await validator.validateAsync(req.body, { abortEarly: false });

    // check for user phone
    let phone_check = await User.findOne({ phone: req.body.phone });
    if (phone_check) {
      return res.status(400).json({
        message: "Phone number already use in another account!",
      });
    }

    let user = new User({
      phone: req.body.phone,
      isNewAccount: true,
      signUpToken: generateUUIDToken(),
    });

    let userObject = await user.save();

    return res.status(201).json({
      message: "Phone number added",
      user: userObject,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error creating user",
      error: err,
    });
  }
});

router.post("/register-with-phone-enter-account-info", async (req, res) => {
  let validator = Joi.object({
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    signUpToken: Joi.string().required(),
    userId: Joi.string().required(),
  });

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });

    let _user = await User.findOne({
      signUpToken: req.body.signUpToken,
      _id: data.userId,
    });

    if (!_user) {
      return res.status(400).json({
        message: "Account not found!",
      });
    }

    let email_check = await User.findOne({ email: data.email });
    if (email_check) {
      return res.status(400).json({
        message: "Email already user in another account!",
      });
    }

    await _user.updateOne({
      fullname: data.fullname,
      password: await hashPasswod(data.password),
      email: data.email,
      isNewAccount: false,
      signUpToken: null,
    });

    return res.status(201).json({
      message: "Account created successfully",
      user: _user,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error creating user",
      error: err,
    });
  }
});

module.exports = router;
