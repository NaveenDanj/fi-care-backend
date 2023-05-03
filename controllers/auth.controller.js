const express = require("express");
const router = express.Router();
const Joi = require("joi");

const {
  hashPasswod,
  comparePassword,
} = require("../services/password.service");

const { generateUUIDToken } = require("../services/token.service");
const { generateToken } = require("../services/jwt.service");

// @ts-ignore
const User = require("../models/user.model");
const AuthToken = require("../models/authtoken.model");
const OTP = require("../models/otp.model");

router.post("/login", async (req, res) => {
  return res.json({
    hello: "world",
  });
});

router.post("/register-with-social-account", async (req, res) => {
  let validator = Joi.object({
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
      .regex(/^[0-9]{10}$/)
      .messages({ "string.pattern.base": `Phone number must have 10 digits.` })
      .required(),
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

    // send otp to the phone number later
    _handle_otp(user);

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
      phoneVerified: false,
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

    // send otp to the phone number later
    _handle_otp(_user);

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

router.post("/verify-phone", async (req, res) => {
  let validator = Joi.object({
    phone: Joi.string()
      .regex(/^[0-9]{10}$/)
      .messages({ "string.pattern.base": `Phone number must have 10 digits.` })
      .required(),
    token: Joi.string().required(),
    otp: Joi.number().required(),
  });

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });

    let user = await User.findOne({ phone: data.phone });

    let otp = await OTP.findOne({ phone: data.phone, token: data.token });

    if (!otp) {
      return res.status(400).json({
        message: "Phone verification failed",
      });
    }

    if (!user) {
      return res.status(400).json({
        message: "User account not found",
      });
    }

    if (user.phoneVerified == true) {
      return res.status(400).json({
        message: "Phone number already verified",
      });
    }

    if (otp.token == data.token && otp.otp == data.otp) {
      await user.updateOne({
        phoneVerified: true,
      });

      let jwt_token = await _handle_jwt(user);

      await OTP.deleteOne({ phone: data.phone, token: data.token });

      return res.status(200).json({
        message: "Phone verified successfully",
        token: jwt_token,
      });
    } else {
      return res.status(400).json({
        message: "Phone verification failed",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error validating phone number",
      error: err,
    });
  }
});

router.post("/verify-phone-resend-otp", async (req, res) => {
  let validator = Joi.object({
    phone: Joi.string()
      .regex(/^[0-9]{10}$/)
      .messages({ "string.pattern.base": `Phone number must have 10 digits.` })
      .required(),
  });

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });

    let user = await User.findOne({ phone: data.phone });

    let otp_exits = await OTP.findOne({ phone: data.phone });

    if (otp_exits) {
      return res.status(400).json({
        message: "Previouse OTP is not expired yet",
      });
    }

    if (!user) {
      return res.status(400).json({
        message: "Phone number not valid",
      });
    }

    if (user.phoneVerified == true) {
      return res.status(400).json({
        message: "User account already verified",
      });
    }

    let token = await _handle_otp(user);

    return res.status(200).json({
      message: "Otp sent successfully",
      token: token,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error sending otp",
      error: err,
    });
  }
});

const _handle_otp = async (user) => {
  return new Promise(async (resolve, reject) => {
    let token = generateUUIDToken();
    let otp = new OTP({
      phone: user.phone,
      token: token,
      otp: Math.floor(Math.random() * (999999 - 100000 + 1) + 100000),
    });
    await otp.save();
    resolve(token);
  });
};

const _handle_jwt = async (user) => {
  return new Promise(async (resolve, reject) => {
    let token = generateToken(user.email);

    console.log("token is : ", token);

    let tokenObj = new AuthToken({
      userId: user._id,
      token: token,
    });

    await tokenObj.save();

    resolve(token);
  });
};

module.exports = router;
