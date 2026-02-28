// utils/response.js – Standardised API response helpers

const sendSuccess = (res, data = {}, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const sendError = (res, message = "Internal server error", status = 500) =>
  res.status(status).json({ success: false, message });

const sendPaginated = (res, data, total, page, limit) =>
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  });

module.exports = { sendSuccess, sendError, sendPaginated };
