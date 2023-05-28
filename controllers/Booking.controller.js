const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Service = require("../models/service.model");
const ServiceProvider = require("../models/serviceprovider.model");
const Booking = require("../models/Booking.model");

router.post("/create-booking", async (req, res) => {
  const validator = Joi.object({
    serviceId: Joi.string().required(),
    serviceProviderId: Joi.string().required(),
    categoryName: Joi.string().required(),
    task: Joi.string().required(),
    bookingDateTime: Joi.string().required(),
    description: Joi.string().required(),
  });

  try {
    let data;

    try {
      data = await validator.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
      return res.status(400).json({
        message: "Error in validating request!",
        error: err,
      });
    }

    let service = await Service.findOne({ _id: data.serviceId });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
        error: err,
      });
    }

    if (!service.serviceCategories) {
      return res.status(400).json({
        message: "Category not found",
        error: err,
      });
    }

    if (data.categoryName != "Not-Set") {
      let found = false;

      service.serviceCategories.forEach((element) => {
        if (element.name == data.categoryName) {
          found = true;
        }
      });

      if (!found) {
        return res.status(404).json({
          message: "Category not found",
          error: err,
        });
      }
    }

    let serviceProvider = await ServiceProvider.findOne({
      _id: data.serviceProviderId,
    });

    if (!serviceProvider) {
      return res.status(404).json({
        message: "Service provider not found",
        error: err,
      });
    }

    if (serviceProvider.serviceId != data.serviceId) {
      return res.status(400).json({
        message: "Service provider not providing this service",
        error: err,
      });
    }

    if (data.categoryName != "Not-Set") {
      if (serviceProvider.categoryName != data.categoryName) {
        return res.status(400).json({
          message: "Service provider not providing this service category",
          error: err,
        });
      }
    }

    const enteredDate = new Date(data.bookingDateTime);
    const currentDate = new Date();

    if (enteredDate < currentDate) {
      return res.status(400).json({
        message: "Cannot choose previouse date",
        error: err,
      });
    }

    let task = service.serviceName;
    task +=
      data.categoryName != "Not-Set"
        ? service.serviceName + " > " + data.categoryName
        : "";

    let booking = new Booking({
      userId: req.user._id,
      serviceId: data.serviceId,
      serviceProviderId: data.serviceProviderId,
      categoryName: data.categoryName,
      task,
      bookingDateTime: data.bookingDateTime,
      bookingLocationAddress: req.user.address,
      description: data.description,
    });

    await booking.save();

    return res.status(200).json({
      message: "New booking created",
      booking,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error in creating booking.",
      error: err,
    });
  }
});

module.exports = router;
