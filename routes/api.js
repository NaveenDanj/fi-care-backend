const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/auth.controller.js");
const ServiceController = require("../controllers/service.controller.js");
const AdminAuthController = require("../controllers/AdminAuth.controller.js");
const ServiceProviderAuth = require("../controllers/ServiceProviderAuth.controller.js");

router.get("/", (req, res) => {
  return res.json({ message: "finwin-care API v1.0.0" });
});

router.use("/auth", AuthController);
router.use("/admin-auth", AdminAuthController);
router.use("/service", ServiceController);
router.use("/service-provider-auth", ServiceProviderAuth);

module.exports = router;
