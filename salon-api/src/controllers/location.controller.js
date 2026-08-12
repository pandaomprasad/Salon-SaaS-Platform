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

    // 1. Try Google Places Autocomplete API if key exists
    if (apiKey && apiKey !== "your_key_here") {
      try {
        const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&components=country:in`;
        const autoRes = await fetch(autocompleteUrl);
        const autoData = await autoRes.json();

        if (autoData.status === "OK" && autoData.predictions && autoData.predictions.length > 0) {
          const results = autoData.predictions.map((item) => ({
            id: item.place_id,
            place_id: item.place_id,
            name: item.structured_formatting?.main_text || item.description.split(",")[0],
            area: item.description,
            main_text: item.structured_formatting?.main_text || item.description.split(",")[0],
            secondary_text: item.structured_formatting?.secondary_text || "",
            lat: null,
            lng: null,
          }));

          return res.status(200).json({
            success: true,
            data: results,
          });
        }
      } catch (autoErr) {
        console.warn("Backend Google Places autocomplete error, trying geocode fallback:", autoErr.message);
      }

      // Geocoding Fallback if Autocomplete API isn't enabled or returned empty
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
        const googleRes = await fetch(url);
        const googleData = await googleRes.json();

        if (googleData.status === "OK" && googleData.results) {
          const results = googleData.results.map((item) => ({
            id: item.place_id,
            place_id: item.place_id,
            name: item.formatted_address.split(",")[0],
            area: item.formatted_address,
            main_text: item.formatted_address.split(",")[0],
            secondary_text: item.formatted_address.split(",").slice(1).join(",").trim(),
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
        place_id: item.place_id.toString(),
        name: item.display_name.split(",")[0],
        area: item.display_name,
        main_text: item.display_name.split(",")[0],
        secondary_text: item.display_name.split(",").slice(1).join(",").trim(),
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

/**
 * Helper to parse address strings when external APIs are unbilled or offline
 */
function parseAddressString(addressStr) {
  if (!addressStr) {
    return {
      street: "",
      city: "Brahmapur",
      state: "Odisha",
      pincode: "",
      country: "India",
      latitude: null,
      longitude: null,
    };
  }

  const pincodeMatch = addressStr.match(/\b([1-9][0-9]{5})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : "";

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Orissa", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh"
  ];

  let state = "";
  for (const s of states) {
    if (new RegExp(`\\b${s}\\b`, "i").test(addressStr)) {
      state = s === "Orissa" ? "Odisha" : s;
      break;
    }
  }

  const cleanStr = addressStr
    .replace(/\b[1-9][0-9]{5}\b/g, "")
    .replace(/\bIndia\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleanStr.split(",").map((p) => p.trim()).filter(Boolean);

  let street = "";
  let city = "";

  if (parts.length >= 3) {
    street = parts[0];
    city = parts[1];
  } else if (parts.length === 2) {
    street = parts[0];
    city = parts[1];
  } else if (parts.length === 1) {
    street = parts[0];
    city = parts[0];
  }

  return {
    street: street || parts[0] || addressStr.split(",")[0],
    city: city || "Brahmapur",
    state: state || "Odisha",
    pincode: pincode,
    country: "India",
    latitude: null,
    longitude: null,
  };
}

/**
 * GET /api/v1/location/details?place_id=...&q=...
 */
const getPlaceDetails = async (req, res) => {
  try {
    const { place_id } = req.query;
    const queryText = req.query.q || req.query.query || req.query.address || place_id;

    if (!place_id && !queryText) {
      return res.status(400).json({
        success: false,
        message: "place_id or query string is required",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY;

    // 1. Try Google Place Details if key exists and place_id looks like a Google place_id
    if (apiKey && apiKey !== "your_key_here" && place_id && place_id.length > 10 && !/^\d+$/.test(place_id)) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&key=${apiKey}`;
        const detailRes = await fetch(detailsUrl);
        const detailData = await detailRes.json();

        if (detailData.status === "OK" && detailData.result) {
          const result = detailData.result;
          let streetNumber = "";
          let route = "";
          let sublocality = "";
          let locality = "";
          let city = "";
          let state = "";
          let pincode = "";
          let country = "";

          for (const component of result.address_components || []) {
            const types = component.types;
            if (types.includes("street_number")) streetNumber = component.long_name;
            else if (types.includes("route")) route = component.long_name;
            else if (types.includes("sublocality") || types.includes("neighborhood") || types.includes("sublocality_level_1")) {
              sublocality = component.long_name;
            } else if (types.includes("locality")) {
              locality = component.long_name;
            } else if (types.includes("administrative_area_level_2") && !locality) {
              city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state = component.long_name;
            } else if (types.includes("postal_code")) {
              pincode = component.long_name;
            } else if (types.includes("country")) {
              country = component.long_name;
            }
          }

          const street = [streetNumber, route, sublocality].filter(Boolean).join(", ") || result.name || result.formatted_address.split(",")[0];
          const finalCity = locality || city || sublocality || "Brahmapur";

          return res.status(200).json({
            success: true,
            data: {
              placeId: place_id,
              name: result.name || "",
              formattedAddress: result.formatted_address || "",
              street: street,
              suburb: sublocality || "",
              city: finalCity,
              state: state || "",
              pincode: pincode || "",
              country: country || "India",
              latitude: result.geometry?.location?.lat || null,
              longitude: result.geometry?.location?.lng || null,
              source: "google_maps",
            },
          });
        }
      } catch (gErr) {
        console.warn("Backend Google Place Details error:", gErr.message);
      }
    }

    // 2. Try OpenStreetMap Nominatim Search by query string/address text
    if (queryText) {
      try {
        const osmSearchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&limit=1&addressdetails=1`;
        const osmRes = await fetch(osmSearchUrl, {
          headers: { "User-Agent": "SalonSaaSBackend/1.0" },
        });
        const osmData = await osmRes.json();

        if (Array.isArray(osmData) && osmData.length > 0) {
          const item = osmData[0];
          const addr = item.address || {};

          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.state_district ||
            addr.county ||
            "Brahmapur";

          const street =
            addr.neighbourhood ||
            addr.suburb ||
            addr.road ||
            addr.residential ||
            addr.amenity ||
            item.display_name.split(",")[0];

          return res.status(200).json({
            success: true,
            data: {
              placeId: item.place_id ? item.place_id.toString() : place_id,
              name: item.name || street || "Selected Location",
              formattedAddress: item.display_name,
              street: street,
              suburb: addr.suburb || addr.neighbourhood || "",
              city: city,
              state: addr.state || "Odisha",
              pincode: addr.postcode || parseAddressString(queryText).pincode || "",
              country: addr.country || "India",
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              source: "nominatim_search",
            },
          });
        }
      } catch (osmErr) {
        console.warn("Backend Nominatim query search error:", osmErr.message);
      }
    }

    // 3. Fallback: Parse query text dynamically
    const parsed = parseAddressString(queryText);
    return res.status(200).json({
      success: true,
      data: {
        placeId: place_id,
        name: parsed.street || "Location",
        formattedAddress: queryText || "Location, India",
        street: parsed.street,
        suburb: "",
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        country: parsed.country,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        source: "parsed_query",
      },
    });

  } catch (error) {
    console.error("Get Place Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch place details",
      error: error.message,
    });
  }
};

module.exports = {
  reverseGeocode,
  searchLocations,
  getPlaceDetails,
};


