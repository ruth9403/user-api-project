module.exports = {
  async sanitizeBody(body = {}) {
    const { password, ...rest } = body;
    return {
      ...rest,
      ...(password && { password: "[REDACTED]" }),
    };
  },
};
