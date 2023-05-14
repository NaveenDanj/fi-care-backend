const express = require("express");
const router = express.Router();
const Joi = require("joi");


const Admin = require("../models/Admin.model");
const { generateToken } = require("../services/jwt.service");
const { comparePassword } = require("../services/password.service");
const AuthToken = require("../models/authtoken.model");


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
        type: 'Admin'
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


module.exports = router;