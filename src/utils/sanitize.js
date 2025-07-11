export class Sanitize {
  /**
   * Sanitizes an object by removing sensitive fields.
   * @param {Object} obj - The object to sanitize.
   * @returns {Object} - The sanitized object.
   */
  
  static sanitizeObject(obj = {}) {
    const { password, ...rest } = obj;
    return {
      ...rest,
      ...(password && { password: "[REDACTED]" }),
    };
  }
}
