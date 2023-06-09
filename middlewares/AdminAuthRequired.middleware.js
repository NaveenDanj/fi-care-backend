const jwt = require("jsonwebtoken");
// @ts-ignore
const AuthToken = require("../models/authtoken.model");
const Admin = require("../models/Admin.model");

const AdminAuthRequired = (role) => {
  return async (req, res, next) => {
    const token = req.headers["authorization"];

    let roleMapper = {
      SuperAdmin: 3,
      Admin: 2,
      Moderater: 1,
    };

    if (!token) {
      return res.status(401).send({ error: "Unauthenticated" });
    }

    try {
      let checkExists = await AuthToken.findOne({ token: token });

      if (!checkExists) {
        return res.status(401).send({ error: "Unauthenticated" });
      }

      if (checkExists.type != "Admin") {
        return res.status(401).send({ error: "Unauthenticated" });
      }
    } catch (err) {
      return res.status(401).send({ error: "Unauthenticated" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, userObject) => {
      if (err) return res.status(403).json({ message: "Unauthenticated" });

      try {
        let admin = await Admin.findOne({ email: userObject.email }).select(
          "-password"
        );

        if (!admin.activated) {
          return res
            .status(403)
            .json({ error: "Your admin account has been deactivated!" });
        }

        if (role == "noRoleRequired") {
          req.user = admin;
          next();
        }

        if (admin.role < roleMapper[role]) {
          return res.status(403).send({ error: "You are not authorized" });
        }

        req.user = admin;

        next();
      } catch (err) {
        return res.status(401).send({ error: "Unauthenticated" });
      }
    });
  };
};

module.exports = AdminAuthRequired;
