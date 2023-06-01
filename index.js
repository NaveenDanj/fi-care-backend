const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

// const cron = require("node-cron");
const mongoose = require("mongoose");

require("dotenv").config();

const api = require("./routes/api.js");

mongoose
  .connect(process.env.MONGODB_CONNECTION_URL, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", api);

let PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
