// salon-api/src/controllers/location.controller.js

/**
 * Controller to handle Reverse Geocoding & Place Search on the Backend
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

/**
 * POST /api/v1/location/reverse-geocode
 * Body: { latitude, longitude }
 */
const reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY;

    // 1. Try Google Maps Geocoding API if key exists and is configured
    if (apiKey && apiKey !== "your_key_here") {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
        const googleRes = await fetch(url);
        const googleData = await googleRes.json();

        if (googleData.status === "OK" && googleData.results.length > 0) {
          const result = googleData.results[0];
          let city = "";
          let suburb = "";
          let state = "";
          let country = "";

          for (const component of result.address_components) {
            if (component.types.includes("locality")) {
              city = component.long_name;
            } else if (component.types.includes("administrative_area_level_2") && !city) {
              city = component.long_name;
            } else if (
              component.types.includes("sublocality") ||
              component.types.includes("neighborhood")
            ) {
              suburb = component.long_name;
            } else if (component.types.includes("administrative_area_level_1")) {
              state = component.long_name;
            } else if (component.types.includes("country")) {
              country = component.long_name;
            }
          }

          const cityName = city || suburb || state || "Mumbai";
          const areaName = suburb ? `${suburb}, ${cityName}` : cityName;

          return res.status(200).json({
            success: true,
            data: {
              city: cityName,
              area: areaName,
              suburb: suburb || "",
              state: state || "",
              country: country || "",
              formattedAddress: result.formatted_address,
              latitude: Number(latitude),
              longitude: Number(longitude),
              source: "google_maps",
            },
          });
        }
      } catch (gErr) {
        console.warn("Backend Google Maps geocode error, falling back to Nominatim:", gErr.message);
      }
    }

    // 2. Server-side Fallback: OpenStreetMap Nominatim API
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const osmRes = await fetch(osmUrl, {
      headers: { "User-Agent": "SalonSaaSBackend/1.0" },
    });
    const osmData = await osmRes.json();

    if (osmData && osmData.address) {
      const addr = osmData.address;
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.state_district ||
        addr.county ||
        "Mumbai";
      const suburb =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdistrict ||
        "";
      const areaName = suburb ? `${suburb}, ${city}` : city;

      return res.status(200).json({
        success: true,
        data: {
          city: city,
          area: areaName,
          suburb: suburb,
          state: addr.state || "",
          country: addr.country || "",
          formattedAddress: osmData.display_name || `${areaName}, ${addr.state || ""}`,
          latitude: Number(latitude),
          longitude: Number(longitude),
          source: "nominatim",
        },
      });
    }

    // Default fallback if no data
    return res.status(200).json({
      success: true,
      data: {
        city: "Mumbai",
        area: "Mumbai Area",
        suburb: "Bandra",
        state: "Maharashtra",
        country: "India",
        formattedAddress: "Mumbai, Maharashtra, India",
        latitude: Number(latitude),
        longitude: Number(longitude),
        source: "default",
      },
    });
  } catch (error) {
    console.error("Reverse Geocode Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reverse geocode location",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/location/search?q=query
 */
const searchLocations = async (req, res) => {
  try {
    const query = req.query.q || req.query.query;

    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY;

    // 1. Try Google Maps Search if API key exists
    if (apiKey && apiKey !== "your_key_here") {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
        const googleRes = await fetch(url);
        const googleData = await googleRes.json();

        if (googleData.status === "OK" && googleData.results) {
          const results = googleData.results.map((item) => ({
            id: item.place_id,
            name: item.formatted_address.split(",")[0],
            area: item.formatted_address,
            lat: item.geometry.location.lat,
            lng: item.geometry.location.lng,
          }));

          return res.status(200).json({
            success: true,
            data: results,
          });
        }
      } catch (gErr) {
        console.warn("Backend Google Maps search error, falling back to Nominatim:", gErr.message);
      }
    }

    // 2. Server-side Fallback: Nominatim Search
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    const osmRes = await fetch(osmUrl, {
      headers: { "User-Agent": "SalonSaaSBackend/1.0" },
    });
    const osmData = await osmRes.json();

    if (Array.isArray(osmData)) {
      const results = osmData.map((item) => ({
        id: item.place_id.toString(),
        name: item.display_name.split(",")[0],
        area: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      return res.status(200).json({
        success: true,
        data: results,
      });
    }

    return res.status(200).json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error("Search Locations Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search locations",
      error: error.message,
    });
  }
};

module.exports = {
  reverseGeocode,
  searchLocations,
};
