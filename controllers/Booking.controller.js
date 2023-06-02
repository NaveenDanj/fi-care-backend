const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Service = require("../models/service.model");
const ServiceProvider = require("../models/ServiceProvider.model.js");
const Booking = require("../models/Booking.model");
const ServiceProviderService = require("../models/ServiceProviderService.model");
const AuthRequired = require("../middlewares/userauthrequired.middleware");
const AdminAuthRequired = require("../middlewares/AdminAuthRequired.middleware");
const ServiceProviderAuthRequired = require("../middlewares/ServiceProviderAuthRequired.middleware");
const upload = require("../services/imageUpload.service");
const fs = require("fs");

router.post("/create-booking", AuthRequired(), async (req, res) => {
  const validator = Joi.object({
    serviceId: Joi.string().required(),
    serviceProviderId: Joi.string().required(),
    categoryName: Joi.string().required(),
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
      });
    }

    if (!service.serviceCategories) {
      return res.status(400).json({
        message: "Category not found",
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
        });
      }
    }

    let serviceProvider = await ServiceProvider.findOne({
      _id: data.serviceProviderId,
    });

    if (!serviceProvider) {
      return res.status(404).json({
        message: "Service provider not found",
      });
    }

    let serviceProviderService = await ServiceProviderService.findOne({
      userId: serviceProvider._id,
      serviceId: data.serviceId,
    });

    if (!serviceProviderService) {
      return res.status(400).json({
        message: "Service provider not providing this service",
      });
    }

    if (data.categoryName != "Not-Set") {
      if (serviceProviderService.categoryName != data.categoryName) {
        return res.status(400).json({
          message: "Service provider not providing this service category",
        });
      }
    }

    const enteredDate = new Date(data.bookingDateTime);
    const currentDate = new Date();

    if (enteredDate < currentDate) {
      return res.status(400).json({
        message: "Cannot choose previouse date",
      });
    }

    let task = data.categoryName;

    task =
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
      bookingLocationAddress: "req.user.address",
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

router.put(
  "/update-booking-status-by-admin",
  AdminAuthRequired("SuperAdmin"),
  async (req, res) => {
    const validator = Joi.object({
      bookingId: Joi.string().required(),
      status: Joi.string()
        .valid(
          "Booking-Confirmed",
          "Started-Job",
          "Completed-Job",
          "Booking-Cancelled",
          "Rejected"
        )
        .required(),
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

      let booking = await Booking.findOne({ _id: data.bookingId });

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      if (booking.status == "Completed-Job") {
        return res.status(400).json({
          message: "Job is already completed",
        });
      }

      if (booking.status == "Booking-Cancelled") {
        return res.status(400).json({
          message: "Job is already cancelled",
        });
      }

      if (booking.status == data.status) {
        return res.status(400).json({
          message: "Cannot be change to previous status",
        });
      }

      booking.status = data.status;

      if (data.status == "Completed-Job") {
        booking.jobCompletedDateTime = new Date();
      }

      await booking.save();

      return res.status(200).json({
        message: "Status updated successfully",
        booking,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error in updating status of booking.",
        error: err,
      });
    }
  }
);

router.put(
  "/update-booking-status-by-service-provider",
  ServiceProviderAuthRequired(),
  async (req, res) => {
    const validator = Joi.object({
      bookingId: Joi.string().required(),
      status: Joi.string()
        .valid("Started-Job", "Completed-Job", "Booking-Cancelled")
        .required(),
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

      let booking = await Booking.findOne({ _id: data.bookingId });

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      if (booking.status == "Completed-Job") {
        return res.status(400).json({
          message: "Job is already completed",
        });
      }

      if (booking.status == "Booking-Cancelled") {
        return res.status(400).json({
          message: "Job is already cancelled",
        });
      }

      if (booking.status == data.status) {
        return res.status(400).json({
          message: "Cannot be change to previous status",
        });
      }

      booking.status = data.status;
      await booking.save();

      return res.status(200).json({
        message: "Status updated successfully",
        booking,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error in updating status of booking.",
        error: err,
      });
    }
  }
);

router.post(
  "/rate-booking-and-continue",
  AuthRequired(),
  upload.single("image"),
  async (req, res) => {
    const acceptedImageTypes = ["image/png", "image/jpg", "image/jpeg"];

    const validator = Joi.object({
      bookingId: Joi.string().required(),
      feedback: Joi.string(),
      rating: Joi.number().min(0).max(5),
    });

    try {
      let data;

      try {
        data = await validator.validateAsync(req.body, {
          abortEarly: false,
        });
      } catch (err) {
        return res.status(400).json({
          message: "Error in validating request!",
          error: err,
        });
      }

      let booking = await Booking.findOne({ _id: data.bookingId });

      if (!booking) {
        return res.status(404).json({
          message: "Booking details not found!",
        });
      }

      if (booking.userId != req.user._id) {
        return res.status(403).json({
          message:
            "Authorization error. You dont have proper permission to review this booking",
        });
      }

      if (booking.reviewed) {
        return res.status(400).json({
          message: "Booking is already reviewed",
        });
      }

      if (booking.status == "Completed-Job") {
        return res.status(400).json({
          message: "Booking is not completed yet",
        });
      }

      if (req.file) {
        if (req.file.fieldname != "image") {
          _image_upload_roleback(req.file.path);
          return res.status(400).json({
            message: "Invalid image field name",
          });
        }

        // check if image type acceptable
        let check = false;

        for (let i = 0; i < acceptedImageTypes.length; i++) {
          if (acceptedImageTypes[i] == req.file.mimetype) {
            check = true;
          }
        }

        if (!check) {
          _image_upload_roleback(req.file.path);
          return res.status(400).json({
            message: "Invalid image mimetype",
          });
        }

        // 733520 = 720KB
        if (req.file.size > 5000000) {
          _image_upload_roleback(req.file.path);
          return res.status(400).json({
            message: "Image file size too large",
          });
        }

        booking.rating = data.rating;
        booking.feedback = data.feedback;
        booking.image = req.file.path.replaceAll("\\", "/");
        booking.reviewed = true;
        await booking.save();
      }

      booking.rating = data.rating;
      booking.feedback = data.feedback;
      booking.reviewed = true;
      await booking.save();

      return res.status(200).json({
        message: "Your review has been submitted",
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error in processing payment",
        error: err,
      });
    }
  }
);

const _image_upload_roleback = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      return false;
    } else {
      return true;
    }
  });
};

module.exports = router;
