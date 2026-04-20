const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/course_registration';

function getMongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGO_URI;
}

module.exports = {
  DEFAULT_MONGO_URI,
  getMongoUri,
};