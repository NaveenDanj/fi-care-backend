const cron = require("node-cron");
const checkTransaction = require("./CheckTransaction.script");

cron.schedule("* * * * *", async () => {
  await checkTransaction();
});

module.exports = cron;
