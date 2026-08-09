const {
  registerPushToken,
  unregisterPushToken,
} = require("../services/push.service");
const AppError = require("../utils/AppError");

// POST /api/v1/customers/me/push-token
// body: { token: "ExponentPushToken[...]" }
// register (or re-register, idempotent) this device's push token
const registerMyPushToken = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { token } = req.body || {};

    if (!token || !/^ExponentPushToken\[.+\]$/.test(token)) {
      return next(new AppError("A valid Expo push token is required", 400));
    }

    await registerPushToken({ userId, token });

    res.status(200).json({
      success: true,
      message: "Push token registered",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/customers/me/push-token/:token
// remove a specific device token (or all if no token given)
const removeMyPushToken = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const token = req.params.token
      ? decodeURIComponent(req.params.token)
      : undefined;

    await unregisterPushToken({ userId, token });

    res.status(200).json({
      success: true,
      message: token ? "Push token removed" : "All push tokens removed",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerMyPushToken, removeMyPushToken };