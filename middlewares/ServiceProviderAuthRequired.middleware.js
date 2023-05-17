const jwt = require("jsonwebtoken");
// @ts-ignore
const AuthToken = require("../models/authtoken.model");
const ServiceProvider = require("../models/serviceprovider.model");

const ServiceProviderAuthRequired = () => {
  return async (req, res, next) => {
    const token = req.headers["authorization"];

    // let roleMapper = {
    //   SuperAdmin: 3,
    //   Admin: 2,
    //   Moderater: 1,
    // };

    if (!token) {
      return res.status(401).send({ error: "Unauthenticated" });
    }

    try {
      let checkExists = await AuthToken.findOne({ token: token });

      if (!checkExists) {
        return res.status(401).send({ error: "Unauthenticated" });
      }

      if (checkExists.type != "ServiceProvider") {
        return res.status(401).send({ error: "Unauthenticated" });
      }
    } catch (err) {
      return res.status(401).send({ error: "Unauthenticated" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, userObject) => {
      if (err) return res.status(403).json({ message: "Unauthenticated" });

      try {
        let user = await ServiceProvider.findOne({
          email: userObject.email,
        }).select("-password");

        if (!user.activated) {
          return res
            .status(403)
            .json({ error: "Your account has been deactivated!" });
        }

        // if (role == "noRoleRequired") {
        //   req.user = user;
        //   next();
        // }

        // if (user.role < roleMapper[role]) {
        //   return res.status(403).send({ error: "You are not authorized" });
        // }

        req.user = user;

        next();
      } catch (err) {
        return res.status(401).send({ error: "Unauthenticated" });
      }
    });
  };
};

module.exports = ServiceProviderAuthRequired;
