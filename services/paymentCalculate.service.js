const Booking = require("../models/Booking.model");
const ServiceProviderService = require("../models/ServiceProviderService.model");
const ServiceProvider = require("../models/serviceprovider");

const calculatePaymentAmount = (booking) => {
  return new Promise(async (resolve, reject) => {
    let servceProvider = await ServiceProvider.findOne({
      _id: booking.serviceProviderId,
    });

    let serviceProviderService = await ServiceProviderService.findOne({
      userId: servceProvider._id,
      serviceId: booking.serviceId,
    });

    let hourseWorked =
      booking.jobCompletedDateTime - booking.jobStartedDateTime;

    hourseWorked = hourseWorked / (1000 * 3600);
    let amount = hourseWorked * 100;
    resolve(amount);
  });
};

module.exports = calculatePaymentAmount;
