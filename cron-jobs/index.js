const cron = require("node-cron");
const checkTransaction = require("./CheckTransaction.script");

cron.schedule("* * * * *", () => {
  checkTransaction();
});

module.exports = cron;
