const { default: axios } = require("axios");

const baseURL = process.env.PAYMENT_GATEWAY_BASE_URL;

const instance = axios.create({
  baseURL: `${baseURL}`,
});

module.exports = instance;
