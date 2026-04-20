const mongoose = require("mongoose");
const { getMongoUri } = require("../utils/mongoUri");

module.exports = async function connectDB() {
  const uri = getMongoUri();

  await mongoose.connect(uri);
  console.log("MongoDB connected to:", uri);
};