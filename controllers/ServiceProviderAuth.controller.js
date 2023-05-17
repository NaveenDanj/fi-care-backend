const express = require("express");
const router = express.Router();
const Joi = require("joi");

const {
  hashPasswod,
  comparePassword,
} = require("../services/password.service");
const { generateUUIDToken } = require("../services/token.service");
const { generateToken, handle_jwt } = require("../services/jwt.service");

const AuthRequired = require("../middlewares/userauthrequired.middleware");

// @ts-ignore
const AuthToken = require("../models/authtoken.model");
const OTP = require("../models/otp.model");
const ServiceProvider = require("../models/serviceprovider.model");
const { handle_otp } = require("../services/otp.service");

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
      return res.status(400).json({
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
    let data;
    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({
        message: "Request validation error.",
        error: err,
      });
    }

    const hashedPassword = await hashPasswod(data.password);
    let user = new ServiceProvider({
      fullname: data.fullname,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      photoUrl: "not setup",
    });

    // check of user email
    let email_check = await ServiceProvider.findOne({ email: data.email });
    if (email_check) {
      return res.status(400).json({
        message: "Email already used in another account!",
      });
    }

    // check for user phone
    let phone_check = await ServiceProvider.findOne({ phone: data.phone });
    if (phone_check) {
      return res.status(400).json({
        message: "Phone number already user in another account!",
      });
    }

    let userObject = await user.save();

    // send otp to the phone number later
    handle_otp(user);

    return res.status(201).json({
      message: "New service provider account created",
      user: userObject,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error creating service provider.",
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
    let data;
    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({
        message: "Request validation error.",
        error: err,
      });
    }

    // check for user phone
    let phone_check = await ServiceProvider.findOne({ phone: data.phone });
    if (phone_check) {
      return res.status(400).json({
        message: "Phone number already use in another account!",
      });
    }

    let user = new ServiceProvider({
      phone: data.phone,
      isNewAccount: true,
      signUpToken: generateUUIDToken(),
      phoneVerified: false,
    });

    let userObject = await ServiceProvider.save();

    return res.status(201).json({
      message: "Phone number added",
      user: userObject,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error creating service provider.",
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
    let data;
    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({
        message: "Request validation error.",
        error: err,
      });
    }

    let _user = await ServiceProvider.findOne({
      signUpToken: data.signUpToken,
      _id: data.userId,
    });

    if (!_user) {
      return res.status(400).json({
        message: "Account not found!",
      });
    }

    let email_check = await ServiceProvider.findOne({ email: data.email });
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
    handle_otp(_user);

    return res.status(201).json({
      message: "Account created successfully",
      user: _user,
    });
  } catch (err) {
    return res.status(500).json({
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
    let data;
    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({
        message: "Request validation error.",
        error: err,
      });
    }

    let user = await ServiceProvider.findOne({ phone: data.phone });

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

      let jwt_token = await handle_jwt(user);

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
    let data;
    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({
        message: "Request validation error.",
        error: err,
      });
    }

    let user = await ServiceProvider.findOne({ phone: data.phone });

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

    let token = await handle_otp(user);

    return res.status(200).json({
      message: "Otp sent successfully",
      token: token,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error sending otp",
      error: err,
    });
  }
});

module.exports = router;
