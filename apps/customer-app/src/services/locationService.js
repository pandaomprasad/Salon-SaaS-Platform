// src/services/locationService.js
import { apiClient } from "./apiClient";
import * as Location from "expo-location";

/**
 * Haversine distance between two lat/lng points in kilometers.
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Clean & sanitize city names by stripping official/administrative suffixes
 * e.g. "Bhubaneswar Municipal Corporation" -> "Bhubaneswar"
 *      "Greater Mumbai Corporation" -> "Mumbai"
 */
export function cleanCityName(rawName) {
  if (!rawName) return "Brahmapur";

  let name = rawName.trim();

  // Remove common administrative prefixes & suffixes
  const patterns = [
    /Municipal Corporation/gi,
    /Municipal Council/gi,
    /Mahanagara Palike/gi,
    /Bruhat Bengaluru Mahanagara Palike/gi,
    /Corporation/gi,
    /District/gi,
    /Tehsil/gi,
    /Taluka/gi,
    /Sub-Division/gi,
    /Division/gi,
    /Urban/gi,
    /Rural/gi,
    /Council/gi,
  ];

  patterns.forEach((regex) => {
    name = name.replace(regex, "");
  });

  // Take the first part if separated by commas
  name = name.split(",")[0].trim();

  // Handle special cases like "Greater Mumbai" -> "Mumbai"
  if (name.toLowerCase().includes("mumbai")) return "Mumbai";
  if (name.toLowerCase().includes("bengaluru") || name.toLowerCase().includes("bangalore")) return "Bangalore";
  if (name.toLowerCase().includes("delhi")) return "Delhi";
  if (name.toLowerCase().includes("berhampur") || name.toLowerCase().includes("brahmapur")) return "Brahmapur";

  // If still very long (> 15 chars) and has multiple words, pick the first main word
  if (name.length > 15 && name.includes(" ")) {
    name = name.split(" ")[0].trim();
  }

  return name || rawName.split(",")[0].trim();
}

/**
 * Reverse Geocode latitude & longitude to City and State
 */
export async function reverseGeocode(latitude, longitude) {
  // 1. Try Direct Reverse Geocoding for instant client-side resolution
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "SalonSaaSApp/1.0" },
    });
    const osmData = await res.json();

    if (osmData && osmData.address) {
      const addr = osmData.address;
      const rawCity =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.state_district ||
        addr.county ||
        addr.state ||
        "Delhi";
      
      const city = cleanCityName(rawCity);
      const suburb =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdistrict ||
        "";
      const areaName = suburb ? `${suburb}, ${city}` : city;

      return {
        formattedAddress: osmData.display_name || `${areaName}, ${addr.state || ""}`,
        city: city,
        rawCity: rawCity,
        area: areaName,
        suburb: suburb,
        state: addr.state || addr.state_district || "Odisha",
        country: addr.country || "India",
        latitude,
        longitude,
        source: "nominatim_direct",
      };
    }
  } catch (osmErr) {
    console.warn("📍 [LOCATION SERVICE] Direct reverse geocode error:", osmErr.message);
  }

  // 2. Try Backend API endpoint if available
  try {
    const response = await apiClient.post("/location/reverse-geocode", {
      latitude,
      longitude,
    });

    if (response && response.success && response.data) {
      return {
        ...response.data,
        city: cleanCityName(response.data.city),
      };
    }
  } catch (err) {
    // Silent fail if backend route not deployed on Railway yet
  }

  // 3. Fallback
  return {
    formattedAddress: "Delhi, India",
    city: "Delhi",
    area: "Delhi NCR",
    suburb: "Connaught Place",
    state: "Delhi",
    country: "India",
    latitude,
    longitude,
    source: "default",
  };
}

/**
 * Get current user location.
 * Tries Device Geolocation (Web / Native) first, then falls back to IP-based Location.
 */
export async function getCurrentLocation() {
  // 1. Try Native Expo Location API (High Accuracy GPS)
  const getExpoLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Foreground location permission not granted");
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (position?.coords) {
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
    } catch (err) {
      throw err;
    }
  };

  // 2. Try Browser / Web Navigator Geolocation
  const getNavLocation = () =>
    new Promise((resolve, reject) => {
      const geo = typeof navigator !== "undefined" ? navigator.geolocation : null;
      if (!geo) {
        return reject(new Error("navigator.geolocation is undefined on this device"));
      }

      geo.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
      );
    });

  // 3. Try IP-based Geolocation as fallback
  const getIpLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          ipCity: cleanCityName(data.city),
        };
      }
    } catch (ipErr) {
    }

    try {
      const res2 = await fetch("http://ip-api.com/json/");
      const data2 = await res2.json();
      if (data2 && data2.lat && data2.lon) {
        return {
          latitude: data2.lat,
          longitude: data2.lon,
          ipCity: cleanCityName(data2.city),
        };
      }
    } catch (e2) {
    }

    throw new Error("Unable to acquire location from GPS or IP network");
  };

  let coords;
  try {
    coords = await getExpoLocation();
  } catch (expoErr) {
    try {
      coords = await getNavLocation();
    } catch (navError) {
      coords = await getIpLocation();
    }
  }

  const geoResult = await reverseGeocode(coords.latitude, coords.longitude);
  return geoResult;
}

/**
 * Search locations by name/query
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "SalonSaaSApp/1.0" },
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item) => {
        const rawName = item.display_name.split(",")[0];
        return {
          id: item.place_id.toString(),
          name: cleanCityName(rawName),
          area: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      });
    }
  } catch (err) {
    console.warn("📍 [LOCATION SERVICE] Direct search error:", err.message);
  }

  try {
    const response = await apiClient.get(`/location/search?q=${encodeURIComponent(query)}`);
    if (response && response.success && Array.isArray(response.data)) {
      return response.data.map((item) => ({
        ...item,
        name: cleanCityName(item.name),
      }));
    }
  } catch (err) {
    // Silent fail
  }

  return [];
}
