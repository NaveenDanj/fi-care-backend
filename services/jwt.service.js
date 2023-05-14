const jwt = require("jsonwebtoken");

module.exports = {
  generateToken(email) {
    return jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
  },

  generateAdminToken(email){
    return jwt.sign({ email: email , type : 'admin' }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
  }

};
