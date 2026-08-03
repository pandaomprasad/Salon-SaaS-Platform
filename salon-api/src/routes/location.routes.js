// salon-api/src/routes/location.routes.js
const express = require("express");
const router = express.Router();
const { reverseGeocode, searchLocations } = require("../controllers/location.controller");

// Reverse geocode latitude & longitude to address/city
router.post("/reverse-geocode", reverseGeocode);

// Search locations by name/query
router.get("/search", searchLocations);

module.exports = router;
