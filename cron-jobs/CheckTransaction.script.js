const checkTransaction = async () => {
  return new Promise((resolve, reject) => {
    try {
      console.log("check transaction not implemented");
      resolve(true);
    } catch (err) {
      reject(false);
    }
  });
};

module.exports = checkTransaction;
