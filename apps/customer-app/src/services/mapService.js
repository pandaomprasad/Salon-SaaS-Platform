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

  // Premium CartoDB/Esri basemaps (no API key needed)
  return isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
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
  const isFallbackMap = tileUrl.includes("openstreetmap.org");
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
        ${isDark && isFallbackMap ? `
        .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        ` : ""}
        .leaflet-control-container .leaflet-routing-container-hide { display: none; }
        .leaflet-control-attribution { display: none !important; }

        /* Custom Popup Tooltip */
        @keyframes popupSpring {
          0% {
            opacity: 0;
            transform: translateY(15px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .leaflet-popup-content-wrapper, .leaflet-popup-tip-container, .leaflet-container a.leaflet-popup-close-button {
          animation: popupSpring 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform-origin: bottom center;
        }

        .leaflet-popup-content-wrapper {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0;
          width: 250px !important;
        }
        .leaflet-popup-tip {
          background: #FFFFFF;
        }
        .custom-leaflet-popup {
          display: flex;
          flex-direction: row;
          align-items: center;
          cursor: pointer;
          padding: 8px;
        }
        .popup-img {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          background-color: #EFEFF4;
        }
        .popup-content {
          flex: 1;
          padding-left: 12px;
          justify-content: center;
        }
        .popup-title {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #18181B;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .popup-subtitle {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #71717A;
          display: flex;
          align-items: center;
        }
        .popup-chevron-btn {
          width: 24px;
          height: 24px;
          border-radius: 12px;
          background: #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
        }

        /* Custom Close Button for Tooltip */
        .leaflet-container a.leaflet-popup-close-button {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: rgba(0, 0, 0, 0.4);
          color: #FFF !important;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          text-decoration: none;
          padding: 0;
          line-height: 1;
          z-index: 100;
          transition: background 0.2s ease;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          background: rgba(0, 0, 0, 0.6);
        }

        /* Modern Shop Pin */
        .salon-pin-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .salon-pin-wrapper:hover {
          transform: scale(1.1);
          z-index: 999 !important;
        }
        .salon-pin-bubble {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #762237;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
          box-sizing: border-box;
          transition: all 0.2s ease;
          position: relative;
        }
        .salon-pin-bubble::after {
          content: "";
          position: absolute;
          bottom: -6px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #FFFFFF;
        }
        .salon-pin-bubble::before {
          content: "";
          position: absolute;
          bottom: -4px;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #762237;
          z-index: 2;
        }
        .salon-pin-wrapper.active {
          z-index: 1000 !important;
          transform: scale(1.15);
        }
        .salon-pin-wrapper.active::before {
          content: "";
          position: absolute;
          width: 64px;
          height: 64px;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0) 70%);
          border-radius: 50%;
          z-index: -1;
          animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
        .shop-icon {
          width: 14px;
          height: 14px;
          fill: #FFFFFF;
        }

        /* User Current GPS Location Dot Marker */
        .user-gps-dot {
          width: 14px;
          height: 14px;
          background: #3B82F6;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2), 0 0 0 16px rgba(59, 130, 246, 0.1);
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
                      '<svg class="shop-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M21.9 8.89l-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02-.02 2.06.62 2.88.08.11.19.19.28.29V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6.94c.09-.09.2-.18.28-.28.64-.82.87-1.86.62-2.89zM5.05 5h13.9l.85 3.5c.05.21.02.43-.1.62-.12.19-.34.33-.56.33-.41 0-.75-.34-.75-.75V7h-2v1.75c0 .41-.34.75-.75.75s-.75-.34-.75-.75V7h-2v1.75c0 .41-.34.75-.75.75s-.75-.34-.75-.75V7h-2v1.75c0 .28-.15.53-.39.66-.24.13-.53.11-.75-.05-.18-.13-.29-.33-.29-.55L4.2 8.5c-.05-.21-.02-.43.1-.62.12-.19.34-.33.56-.33h.19zM19 19H5v-6.03c.16.03.33.03.5 0 .76 0 1.45-.33 1.94-.85.49.52 1.18.85 1.94.85.76 0 1.45-.33 1.94-.85.49.52 1.18.85 1.94.85.76 0 1.45-.33 1.94-.85.49.52 1.18.85 1.94.85.17.03.34.03.5 0V19z"/>' +
                      '</svg>' +
                    '</div>' +
                  '</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          var marker = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(map);

          var popupHtml = '<div class="custom-leaflet-popup" onclick="sendNavMessage(&apos;' + s.id + '&apos;)">' +
                            '<div class="popup-img" style="background-image: url(' + s.image + ')"></div>' +
                            '<div class="popup-content">' +
                              '<div class="popup-title">' + (s.name || 'Salon') + '</div>' +
                              '<div class="popup-subtitle">' +
                                '<span style="color: #F59E0B; margin-right: 3px;">★</span> ' + 
                                '<span style="font-weight: 700; color: #18181B; margin-right: 2px;">' + (s.rating || '4.8') + '</span> ' +
                                '<span>(' + (s.reviewsCount > 999 ? (s.reviewsCount/1000).toFixed(1) + 'k' : (s.reviewsCount || 45)) + ')</span>' +
                                '<span style="margin: 0 4px; color: #D1D5DB">•</span>' +
                                '<span>' + (s.distanceKm || '2.0') + ' km</span>' +
                              '</div>' +
                            '</div>' +
                            '<div class="popup-chevron-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#18181B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>' +
                          '</div>';

          marker.bindPopup(popupHtml, {
            closeButton: true,
            className: 'custom-popup-container',
            offset: [0, -20],
            minWidth: 220
          });

          marker.on('click', function() {
            marker.openPopup();
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_SALON', id: s.id }));
            } else if (window.parent) {
              window.parent.postMessage(JSON.stringify({ type: 'SELECT_SALON', id: s.id }), '*');
            }
          });


        });

        // Function to send navigation message to React Native when popup is clicked
        window.sendNavMessage = function(id) {
          var msg = JSON.stringify({ type: 'NAVIGATE_SALON', id: id });
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(msg);
          } else if (window.parent) {
            window.parent.postMessage(msg, '*');
          }
        };

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
