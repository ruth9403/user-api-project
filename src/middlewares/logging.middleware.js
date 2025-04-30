const sanitize = require('../utils/sanitize');

module.exports = async function LoggingMiddleware(req, res, next) {
  try {
    // Sanitize request body to exclude sensitive fields
    const newBody = await sanitize.sanitizeBody(req.body);
    console.log(
      `[${new Date(Date.now()).toISOString()}] ${req.method} ${
        req.originalUrl
      } body: ${JSON.stringify(newBody) || {}} params: ${JSON.stringify(
        req.params
      )}`
    );
  } catch (e) {
    console.log("Logging error: ", e);
  }
  next();
};
