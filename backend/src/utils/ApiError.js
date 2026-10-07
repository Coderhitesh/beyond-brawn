class ApiError extends Error {
  constructor(status, message, details = null, code = null) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
    this.isOperational = true;
  }
}
module.exports = ApiError;
