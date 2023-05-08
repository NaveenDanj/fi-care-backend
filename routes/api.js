const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/auth.controller.js");
const ServiceController = require("../controllers/service.controller.js");

router.get("/", (req, res) => {
  return res.json({ message: "finwin-care API v1.0.0" });
});

router.use("/auth", AuthController);
router.use("/service", ServiceController);

module.exports = router;
