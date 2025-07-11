import { Sanitize } from "../utils/sanitize.js";

export const LoggingMiddleware = async (req, _, next) => {

  try {
    // Sanitize request body to exclude sensitive fields
    const newBody = await Sanitize.sanitizeObject(req.body);
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
