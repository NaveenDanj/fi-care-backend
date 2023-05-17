const express = require("express");
const router = express.Router();
const Joi = require("joi");

const Service = require("../models/service.model");
const AdminAuthRequired = require("../middlewares/AdminAuthRequired.middleware");
const ServiceProviderService = require("../models/ServiceProviderService.model");
const ServiceProvider = require("../models/serviceprovider.model");

router.post("/create", AdminAuthRequired("SuperAdmin"), async (req, res) => {
  const categorySchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
    available: Joi.boolean().required(),
  });

  let validator = Joi.object(
    {
      serviceName: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      serviceCategories: Joi.array().items(categorySchema),
    },
    {
      allowUnknown: true,
    }
  );

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });

    let service = new Service({
      serviceName: data.serviceName,
      description: data.description,
      price: data.price,
      serviceCategories: data.serviceCategories,
      available: true,
    });

    await service.save();

    return res.status(200).json({
      message: "New service created",
      service,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error in creating service.",
      error: err,
    });
  }
});

router.post("/set-service-availablity", async (req, res) => {
  let validator = Joi.object({
    available: Joi.boolean().required(),
    serviceId: Joi.string().required(),
  });

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });
    let service = await Service.findOne({ _id: data.serviceId });

    if (!service) {
      return res.status(404).json({
        message: "Service not found!",
      });
    }

    service.available = data.available;
    await service.save();

    return res.status(200).json({
      message: "Service availability changed!",
      service,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error in changing status of the service.",
      error: err,
    });
  }
});

router.put("/update-service", async (req, res) => {
  let validator = Joi.object({
    serviceId: Joi.string().required(),
    serviceName: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
  });

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });

    let service = await Service.findOne({ _id: data.serviceId });

    if (!service) {
      return res.status(404).json({
        message: "Service not found!",
      });
    }

    service.serviceName = data.serviceName;
    service.description = data.description;
    service.price = data.price;
    await service.save();

    return res.status(200).json({
      message: "Service updated successfully!",
      service,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error updating service.",
      error: err,
    });
  }
});

router.put("/add-service-subcategory", async (req, res) => {
  let validator = Joi.object({
    serviceId: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required(),
    available: Joi.boolean().required(),
  });

  try {
    let data = await validator.validateAsync(req.body, { abortEarly: false });

    let service = await Service.findOne({ _id: data.serviceId });

    if (!service) {
      return res.status(404).json({
        message: "Service not found!",
      });
    }

    let subCategory = {
      name: data.name,
      description: data.description,
      price: data.price,
      available: data.available,
    };

    await Service.updateOne(
      { _id: data.serviceId },
      { $push: { serviceCategories: subCategory } }
    );

    return res.status(200).json({
      message: "New service subcategory added successfully!",
      service,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error adding new sub category service.",
      error: err,
    });
  }
});

router.get("/get-all-services", async (req, res) => {
  let page = +req.query.page || 1;
  let limit = +req.query.limit || 20;
  let skip = (page - 1) * limit;

  let services = await Service.find().skip(skip).limit(limit);

  return res.status(200).json({
    services,
    paging: {
      count: await Service.countDocuments(),
      page: page,
      limit: limit,
    },
  });
});

router.get("/get-service-by-id", async (req, res) => {
  let _id = req.query.id;

  if (!_id) {
    return res.status(400).json({
      message: "Service id is required",
    });
  }

  try {
    let service = await Service.findOne({ _id: _id });

    if (!service) {
      return res.status(404).json({
        message: "Service not found!",
      });
    }

    return res.status(200).json({
      service,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error finding service.",
      error: err,
    });
  }
});

router.get("/search-service", async (req, res) => {
  let page = +req.query.page || 1;
  let limit = +req.query.limit || 20;
  let skip = (page - 1) * limit;

  let param = req.query.param;

  if (!param) {
    return res.status(400).json({
      message: "Provide query parameter",
    });
  }

  let services = await Service.find({
    serviceName: { $regex: param, $options: "i" },
  })
    .skip(skip)
    .limit(limit);

  return res.status(200).json({
    services,
    paging: {
      // count: await Service.countDocuments(),
      page: page,
      limit: limit,
    },
  });
});

router.get("/get-service-providers-by-category", async (req, res) => {
  let page = +req.query.page || 1;
  let limit = +req.query.limit || 20;
  let skip = (page - 1) * limit;

  let serviceId = req.query.serviceId;
  let categoryName = req.query.categoryName;

  if (!serviceId) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  let service = await Service.findOne({ _id: serviceId });

  if (!service) {
    return res.status(404).json({
      message: "Service not found!",
    });
  }

  if (categoryName) {
    // check category name exists
    let found = false;
    service.serviceCategories.forEach((element) => {
      if (element.name == categoryName) {
        found = true;
      }
    });

    if (!found) {
      return res.status(404).json({
        message: "Service sub category not found!",
      });
    }

    let serviceProviders = await ServiceProviderService.find({
      serviceId: serviceId,
      categoryName: categoryName,
    })
      .skip(skip)
      .limit(limit);

    let out_array = [];

    for (let i = 0; i < serviceProviders.length; i++) {
      let serviceProvider = await ServiceProvider.findOne({
        _id: serviceProviders[i].userId,
      });

      out_array.push({
        serviceProfile: serviceProviders,
        serviceProviderProfile: serviceProvider,
      });
    }

    return res.status(200).json({
      serviceProviders: out_array,
      paging: {
        // count: await Service.countDocuments(),
        page: page,
        limit: limit,
      },
    });
  } else {
    let serviceProviders = await ServiceProviderService.find({
      serviceId: serviceId,
    })
      .skip(skip)
      .limit(limit);

    let out_array = [];

    for (let i = 0; i < serviceProviders.length; i++) {
      let serviceProvider = await ServiceProvider.findOne({
        _id: serviceProviders[i].userId,
      });

      out_array.push({
        serviceProfile: serviceProviders,
        serviceProviderProfile: serviceProvider,
      });
    }

    return res.status(200).json({
      serviceProviders: out_array,
      paging: {
        // count: await Service.countDocuments(),
        page: page,
        limit: limit,
      },
    });
  }
});

module.exports = router;
