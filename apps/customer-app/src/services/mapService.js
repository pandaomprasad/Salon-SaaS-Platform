// src/services/mapService.js
import { Platform } from "react-native";

/**
 * Get map tile layer URL based on environment keys and theme.
 * Supports Ola Maps (Krutrim Cloud) & OpenStreetMap fallback.
 */
export function getTileUrl(isDark = false) {
  const olaApiKey = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;

  if (olaApiKey && olaApiKey.trim() && !olaApiKey.includes("placeholder")) {
    return `https://api.olakrutrim.com/tiles/v1/styles/${
      isDark ? "ola-dark" : "ola-light"
    }/{z}/{x}/{y}.png?api_key=${olaApiKey.trim()}`;
  }

  // Standard clean OpenStreetMap tile URL
  return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}

/**
 * Generate full Leaflet HTML content string for WebView & iframe rendering
 */
export function generateMapHtml({
  salons = [],
  centerLat = 19.3150,
  centerLng = 84.7941,
  selectedSalonId,
  isDark = false,
  userLat = 19.3150,
  userLng = 84.7941,
}) {
  const tileUrl = getTileUrl(isDark);
  const bgColor = isDark ? "#121216" : "#EAEAEA";

  // Sanitize coordinates to guarantee valid finite numbers for Leaflet
  const validLat = Number.isFinite(Number(centerLat)) ? Number(centerLat) : 19.3150;
  const validLng = Number.isFinite(Number(centerLng)) ? Number(centerLng) : 84.7941;
  const validUserLat = Number.isFinite(Number(userLat)) ? Number(userLat) : validLat;
  const validUserLng = Number.isFinite(Number(userLng)) ? Number(userLng) : validLng;

  const sanitizedSalons = salons
    .filter((s) => s && Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)))
    .map((s) => ({
      id: s.id,
      name: s.name || "Salon",
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      image: s.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=500&q=80",
      isSelected: s.id === selectedSalonId,
    }));

  const markersJson = JSON.stringify(sanitizedSalons);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background: ${bgColor};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .leaflet-control-container .leaflet-routing-container-hide { display: none; }
        .leaflet-control-attribution { display: none !important; }

        /* Custom Teardrop Pin Marker */
        .salon-pin-wrapper {
          position: relative;
          width: 44px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .salon-pin-wrapper:hover {
          transform: scale(1.15);
        }
        .salon-pin-bubble {
          width: 42px;
          height: 42px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: #FFFFFF;
          box-shadow: 0 6px 16px rgba(0,0,0,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
          box-sizing: border-box;
        }
        .salon-pin-wrapper.active .salon-pin-bubble {
          background: #6C5CE7;
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 8px 24px rgba(108, 92, 231, 0.45);
        }
        .salon-pin-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transform: rotate(45deg);
          object-fit: cover;
        }

        /* User Current GPS Location Dot Marker */
        .user-gps-dot {
          width: 16px;
          height: 16px;
          background: #3B82F6;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${validLat}, ${validLng}], 14);
        var tileLayer = L.tileLayer('${tileUrl}', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          errorTileUrl: 'https://tile.openstreetmap.org/14/8395/7093.png'
        }).addTo(map);

        tileLayer.on('tileerror', function(error) {
          if (error.tile && error.coords) {
            error.tile.src = 'https://tile.openstreetmap.org/' + error.coords.z + '/' + error.coords.x + '/' + error.coords.y + '.png';
          }
        });

        var markersData = ${markersJson};
        var currentCircle = null;

        // Render User Location Dot
        if (${Boolean(validUserLat && validUserLng)}) {
          var userIcon = L.divIcon({
            className: 'user-pin-container',
            html: '<div class="user-gps-dot"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          L.marker([${validUserLat}, ${validUserLng}], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        }

        // Render Salon Teardrop Markers
        markersData.forEach(function(s) {
          var isSelected = s.isSelected;
          var customIcon = L.divIcon({
            className: 'custom-pin-container',
            html: '<div class="salon-pin-wrapper ' + (isSelected ? 'active' : '') + '">' +
                    '<div class="salon-pin-bubble">' +
                      '<img class="salon-pin-img" src="' + s.image + '" alt="' + s.name + '" />' +
                    '</div>' +
                  '</div>',
            iconSize: [44, 52],
            iconAnchor: [22, 52]
          });

          var marker = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(map);

          marker.on('click', function() {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_SALON', id: s.id }));
            } else if (window.parent) {
              window.parent.postMessage(JSON.stringify({ type: 'SELECT_SALON', id: s.id }), '*');
            }
          });

          if (isSelected) {
            currentCircle = L.circle([s.lat, s.lng], {
              color: '#6C5CE7',
              fillColor: '#6C5CE7',
              fillOpacity: 0.18,
              weight: 1.5,
              radius: 700
            }).addTo(map);
          }
        });

        // Listen for messages from React Native to animate/pan camera
        window.addEventListener('message', function(event) {
          try {
            var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data && data.type === 'PAN_TO') {
              map.flyTo([data.lat, data.lng], 14, { duration: 1.2 });
            }
          } catch(e) {}
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Re-center map to given latitude and longitude coordinates
 */
export function recenterMap({ webViewRef, iframeId = "leaflet-map-iframe", lat, lng }) {
  if (!lat || !lng) return;

  const msg = JSON.stringify({
    type: "PAN_TO",
    lat,
    lng,
  });

  if (Platform.OS === "web") {
    const iframe = typeof document !== "undefined" ? document.getElementById(iframeId) : null;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, "*");
    }
  } else if (webViewRef?.current) {
    webViewRef.current.postMessage(msg);
  }
}

/**
 * Parse postMessage events sent from WebView or iframe
 */
export function parseMapMessage(event) {
  try {
    const raw = event?.nativeEvent?.data || event?.data;
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}

export const mapService = {
  getTileUrl,
  generateMapHtml,
  recenterMap,
  parseMapMessage,
};

export default mapService;
