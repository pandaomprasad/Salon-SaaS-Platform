const User = require("../models/user.model");
const Salon = require("../models/salon.model");
const AppError = require("../utils/AppError");

// ================================
// GET /api/v1/customers/me/favorites
// customer only — list saved favorite salons
// ================================
const getMyFavorites = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;

    const user = await User.findById(userId)
      .populate({
        path: "favoriteSalons",
        select: "name description logo contactEmail contactPhone isActive",
        populate: {
          path: "branches",
          select: "name address contactPhone rating citySlug isActive",
        },
      })
      .lean();

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: {
        favorites: user.favoriteSalons || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// POST /api/v1/customers/me/favorites/:salonId
// customer only — add salon to favorites
// ================================
const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { salonId } = req.params;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return next(new AppError("Salon not found", 404));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteSalons: salonId } },
      { new: true }
    ).select("favoriteSalons");

    res.status(200).json({
      success: true,
      message: "Salon saved to favorites",
      data: {
        favorites: updatedUser.favoriteSalons,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// DELETE /api/v1/customers/me/favorites/:salonId
// customer only — remove salon from favorites
// ================================
const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { salonId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteSalons: salonId } },
      { new: true }
    ).select("favoriteSalons");

    res.status(200).json({
      success: true,
      message: "Salon removed from favorites",
      data: {
        favorites: updatedUser.favoriteSalons,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyFavorites,
  addFavorite,
  removeFavorite,
};
