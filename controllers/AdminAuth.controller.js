const express = require("express");
const router = express.Router();
const Joi = require("joi");

const Admin = require("../models/Admin.model");
const { generateToken } = require("../services/jwt.service");
const {
  comparePassword,
  hashPasswod,
} = require("../services/password.service");
const AuthToken = require("../models/authtoken.model");
const AdminAuthRequired = require("../middlewares/AdminAuthRequired.middleware");

router.post("/login", async (req, res) => {
  let validator = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });

    let admin = await Admin.findOne({ email: data.email });

    if (!admin) {
      return res.status(400).json({
        message: "Email or password is incorrect!",
      });
    }

    const isMatch = await comparePassword(data.password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Email or password is incorrect!",
      });
    }

    let _token = generateToken(admin.email);

    let accessToken = new AuthToken({
      userId: admin._id,
      token: _token,
      type: "Admin",
    });

    await accessToken.save();

    return res.status(200).json({
      admin,
      token: _token,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error in admin login.",
      error: err,
    });
  }
});

router.post(
  "/add-account",
  AdminAuthRequired("SuperAdmin"),
  async (req, res) => {
    let validator = Joi.object({
      email: Joi.string().email().required(),
      fullname: Joi.string().required(),
      password: Joi.string().required(),
      role: Joi.number().min(1).max(3).required(),
      phone: Joi.string()
        .regex(/^[0-9]{10}$/)
        .messages({
          "string.pattern.base": `Phone number must have 10 digits.`,
        })
        .required(),
    });

    try {
      let data;
      try {
        data = await validator.validateAsync(req.body, {
          abortEarly: false,
        });
      } catch (err) {
        return res.status(400).json({
          message: "Error in validating request!",
          error: err,
        });
      }

      let email_check = await Admin.findOne({ email: data.email });

      if (email_check) {
        return res.status(400).json({
          message: "Email is aleady taken!",
        });
      }

      let phone_check = await Admin.findOne({ phone: data.phone });

      if (phone_check) {
        return res.status(400).json({
          message: "Phone number is aleady taken!",
        });
      }

      let admin = new Admin({
        email: data.email,
        phone: data.phone,
        fullname: data.fullname,
        role: data.role,
        password: await hashPasswod(data.password),
      });

      await admin.save();

      delete admin.password;

      return res.status(200).json({
        message: "New Admin account created successfully!",
        admin,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error adding new admin account.",
        error: err,
      });
    }
  }
);

router.get("/me", AdminAuthRequired("noRoleRequired"), async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});

module.exports = router;
