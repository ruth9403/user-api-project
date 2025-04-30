module.exports = function errorHanlder(req, res, next) {
    try {
      // Sanitize request body to exclude sensitive fields
      const newBody = await sanitize.sanitizeBody(req.sanitizedBody);
      console.log(
        `[${new Date(Date.now()).toISOString()}] ${req.method} ${
          req.path
        } body: ${JSON.stringify(newBody) || {}} params: ${JSON.stringify(
          req.params
        )}`
      );
    } catch (e) {
      console.log("Logging error: ", e);
    }
    next();
  };
  