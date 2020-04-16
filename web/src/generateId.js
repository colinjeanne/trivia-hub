const crypto = require("crypto");

const generateId = () => crypto.randomBytes(16).toString("hex");

module.exports = {
  generateId,
};
