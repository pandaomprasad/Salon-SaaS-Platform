// src/screen/MapScreen.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  Modal,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useLocationStore } from "../store/useLocationStore";
import { browseService } from "../services/browseService";
import { calculateDistance, getCurrentLocation } from "../services/locationService";
import FilterModal from "../components/FilterModal";
import LocationPickerModal from "../components/LocationPickerModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import mapService from "../services/mapService";
import { storage } from "../services/storage";
import ComingSoonLocation from "../components/ComingSoonLocation";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

const TOP_INSET = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ? StatusBar.currentHeight + 14 : 44);

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "combo", label: "Combos", icon: "🎁" },
  { id: "hair", label: "Haircut", icon: "✂️" },
  { id: "facial", label: "Facials", icon: "🧴" },
  { id: "nails", label: "Nails", icon: "💅" },
  { id: "spa", label: "Spa", icon: "🌿" },
];

// Default fallback location (Brahmapur, Odisha, India)
const DEFAULT_LAT = 19.3150;
const DEFAULT_LNG = 84.7941;

const CITY_COORDINATES = {
  brahmapur: { lat: 19.3150, lng: 84.7941 },
  berhampur: { lat: 19.3150, lng: 84.7941 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  cuttack: { lat: 20.4625, lng: 85.8828 },
  puri: { lat: 19.8135, lng: 85.8312 },
  janla: { lat: 20.2400, lng: 85.7700 },
};

const MOCK_SALONS = [
  {
    id: "m-1",
    name: "Royal Cut Luxury Salon & Spa",
    address: "Silk City Road, Near Old Bus Stand, Brahmapur",
    city: "Brahmapur",
    rating: 4.9,
    reviewsCount: 142,
    startingPrice: 500,
    latitude: 19.315,
    longitude: 84.7941,
    distanceKm: 0.8,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=500&q=80",
    categories: ["Haircut", "Styling", "Facial", "Spa"],
  },
  {
    id: "m-2",
    name: "Urban Edge Unisex Salon",
    address: "Engineering School Square, College Road, Brahmapur",
    city: "Brahmapur",
    rating: 4.8,
    reviewsCount: 98,
    startingPrice: 400,
    latitude: 19.32,
    longitude: 84.8,
    distanceKm: 1.5,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80",
    categories: ["Haircut", "Beard Trim", "Hair Color"],
  },
  {
    id: "m-3",
    name: "Luxe Studio & Spa",
    address: "Gandhi Nagar Main Rd, Brahmapur",
    city: "Brahmapur",
    rating: 4.7,
    reviewsCount: 86,
    startingPrice: 550,
    latitude: 19.312,
    longitude: 84.79,
    distanceKm: 2.1,
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=500&q=80",
    categories: ["Haircut", "Nails", "Pedicure"],
  },
];

export default function MapScreen({ navigate, onScroll }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(isDark, insets);
  const bottomBarInset = Math.max(insets.bottom, 10) + 68;

  const selectedCity = useLocationStore((state) => state.selectedCity);
  const locationDetails = useLocationStore((state) => state.locationDetails);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const detectCurrentLocation = useLocationStore((state) => state.detectCurrentLocation);

  const [salons, setSalons] = useState(MOCK_SALONS);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: "all",
    priceRange: "all",
    sortBy: "recommended",
    serviceType: "all",
  });

  const toggleSearch = (focused) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchFocused(focused);
  };

  const flatListRef = useRef(null);
  const webViewRef = useRef(null);

  // Determine current center coordinates matching selectedCity
  const cleanCurrentCity = (selectedCity || "Brahmapur").trim().toLowerCase();
  const isLocationMatching =
    locationDetails?.city &&
    locationDetails.city.trim().toLowerCase() === cleanCurrentCity;

  const cityCoords = CITY_COORDINATES[cleanCurrentCity] || { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
  const userLat = (isLocationMatching && locationDetails?.latitude) ? locationDetails.latitude : cityCoords.lat;
  const userLng = (isLocationMatching && locationDetails?.longitude) ? locationDetails.longitude : cityCoords.lng;
  const locationAddressText = isLocationMatching
    ? (locationDetails?.formattedAddress || locationDetails?.area || selectedCity)
    : (selectedCity || "Brahmapur");

  useEffect(() => {
    async function loadHistory() {
      try {
        const hist = await storage.getItem("map_search_history");
        if (hist) setRecentSearches(JSON.parse(hist));
      } catch(e) {}
    }
    loadHistory();
  }, []);

  const saveSearchHistory = async (salon) => {
    try {
      const existing = recentSearches.filter(s => s.id !== salon.id);
      const updated = [salon, ...existing].slice(0, 5);
      setRecentSearches(updated);
      await storage.setItem("map_search_history", JSON.stringify(updated));
    } catch(e) {}
  };

  const removeSearchHistory = async (salonId) => {
    try {
      const updated = recentSearches.filter(s => s.id !== salonId);
      setRecentSearches(updated);
      await storage.setItem("map_search_history", JSON.stringify(updated));
    } catch(e) {}
  };

  const clearAllHistory = async () => {
    try {
      setRecentSearches([]);
      await storage.setItem("map_search_history", JSON.stringify([]));
    } catch(e) {}
  };

  // Fetch salons or combine with fallback
  useEffect(() => {
    let isMounted = true;
    async function loadSalons() {
      try {
        setLoading(true);
        const res = await browseService.getSalons({ city: selectedCity });
        let fetchedList = [];
        if (Array.isArray(res?.data?.data?.salons)) fetchedList = res.data.data.salons;
        else if (Array.isArray(res?.data?.salons)) fetchedList = res.data.salons;
        else if (Array.isArray(res?.data?.data)) fetchedList = res.data.data;
        else if (Array.isArray(res?.data)) fetchedList = res.data;
        else if (Array.isArray(res)) fetchedList = res;

        if (isMounted) {
          if (fetchedList.length === 0) {
            const LIVE_CITIES = ["brahmapur", "bhubaneswar"];
            if (selectedCity && !LIVE_CITIES.includes(selectedCity.toLowerCase())) {
              setSalons([]);
            } else {
              setSalons(MOCK_SALONS);
            }
          } else {
            const mapped = fetchedList.map((item, idx) => {
              let lat = parseFloat(item.latitude || item.address?.latitude);
              let lng = parseFloat(item.longitude || item.address?.longitude);
              
              if (!lat || !lng) {
                 const angle = (idx * 137.5) * (Math.PI / 180);
                 const radius = 0.003 + (idx * 0.0015);
                 lat = userLat + radius * Math.cos(angle);
                 lng = userLng + radius * Math.sin(angle);
              }

              const dist = calculateDistance(userLat, userLng, lat, lng);
              return {
                id: item.id || item._id || `s-${idx}`,
                name: item.name || "Salon",
                address: item.address?.formattedAddress || item.address || item.city || "Nearby Address",
                city: item.city || selectedCity,
                rating: parseFloat(item.rating?.avgScore || item.rating || 5.0),
                reviewsCount: item.rating?.totalReviews ?? item.reviewsCount ?? item.totalReviews ?? 0,
                startingPrice: item.startingPrice || item.minPrice || 499,
                latitude: lat,
                longitude: lng,
                distanceKm: dist ? parseFloat(dist.toFixed(1)) : 2.0,
                image: item.coverImage || item.images?.[0] || MOCK_SALONS[idx % MOCK_SALONS.length].image,
                categories: item.categories || ["Hair", "Beauty"],
              };
            });
            setSalons(mapped);
          }
        }
      } catch (err) {
        console.warn("MapScreen fetch error:", err?.message);
        if (isMounted) {
          const LIVE_CITIES = ["brahmapur", "bhubaneswar"];
          if (selectedCity && !LIVE_CITIES.includes(selectedCity.toLowerCase())) {
            setSalons([]);
          } else {
            setSalons(MOCK_SALONS);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSalons();
    return () => { isMounted = false; };
  }, [selectedCity]);

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    return [
      filters.minRating !== "all",
      filters.priceRange !== "all",
      filters.sortBy !== "recommended",
      filters.serviceType !== "all",
    ].filter(Boolean).length;
  }, [filters]);

  // Filtered Salons list
  const filteredSalons = useMemo(() => {
    let list = [...salons];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) => (s.name || "").toLowerCase().includes(q)
      );
    }

    if (filters.serviceType && filters.serviceType !== "all") {
      const typeStr = filters.serviceType.toLowerCase();
      list = list.filter((s) => {
        const catList = s.categories || s.services || [];
        const summary = (s.servicesSummary || s.description || "").toLowerCase();
        const nameStr = (s.name || "").toLowerCase();
        return (
          nameStr.includes(typeStr) ||
          summary.includes(typeStr) ||
          catList.some((c) => (c?.name || c || "").toString().toLowerCase().includes(typeStr))
        );
      });
    }

    if (filters.minRating && filters.minRating !== "all") {
      const minVal = parseFloat(filters.minRating);
      list = list.filter((s) => s.rating >= minVal);
    }

    if (filters.priceRange && filters.priceRange !== "all") {
      list = list.filter((s) => {
        if (filters.priceRange === "budget") return s.startingPrice < 500;
        if (filters.priceRange === "moderate") return s.startingPrice >= 500 && s.startingPrice <= 1500;
        if (filters.priceRange === "luxury") return s.startingPrice > 1500;
        return true;
      });
    }

    if (filters.sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === "price_low") {
      list.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (filters.sortBy === "price_high") {
      list.sort((a, b) => b.startingPrice - a.startingPrice);
    }

    return list;
  }, [salons, searchQuery, filters]);

  // Currently selected salon object
  const selectedSalon = useMemo(() => {
    if (!selectedSalonId) return null;
    return filteredSalons.find((s) => s.id === selectedSalonId) || null;
  }, [filteredSalons, selectedSalonId]);

  // Center coordinates for map view
  const mapCenterLat = selectedSalon?.latitude || userLat;
  const mapCenterLng = selectedSalon?.longitude || userLng;

  // Handle marker tap from map
  const handleSelectSalon = useCallback((salonId) => {
    setSelectedSalonId(salonId);
    const index = filteredSalons.findIndex((s) => s.id === salonId);
    if (index >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  }, [filteredSalons]);

  // Handle carousel horizontal scroll end
  const handleScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index >= 0 && index < filteredSalons.length) {
      const salon = filteredSalons[index];
      if (salon && salon.id !== selectedSalonId) {
        setSelectedSalonId(salon.id);
      }
    }
  };

  // Generate Leaflet Map HTML content using mapService
  const mapHtml = useMemo(() => {
    return mapService.generateMapHtml({
      salons: filteredSalons,
      centerLat: userLat,
      centerLng: userLng,
      selectedSalonId: null,
      isDark,
      userLat,
      userLng,
    });
  }, [filteredSalons, isDark, userLat, userLng]);

  // Recenter to user's current GPS location via mapService
  const handleRecenterLocation = async () => {
    try {
      await detectCurrentLocation();
      const freshLoc = useLocationStore.getState().locationDetails;
      const targetLat = freshLoc?.latitude || userLat;
      const targetLng = freshLoc?.longitude || userLng;
      mapService.recenterMap({
        webViewRef,
        iframeId: "leaflet-map-iframe",
        lat: targetLat,
        lng: targetLng,
      });
    } catch (e) {
      console.warn("Recenter error:", e);
    }
  };

  // Render salon card in bottom horizontal carousel
  const renderSalonCard = ({ item }) => {
    const isSelected = item.id === (selectedSalon?.id || selectedSalonId);
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => {
          setSelectedSalonId(item.id);
          navigate("SalonDetail", { salonId: item.id, salonName: item.name });
        }}
        style={[
          styles.salonCard,
          isSelected && styles.selectedSalonCard,
        ]}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.salonName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <Text style={styles.salonAddress} numberOfLines={1}>
            {item.address}
          </Text>

          <View style={styles.cardFooterRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#FFB800" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewsCountText}>({item.reviewsCount})</Text>
            </View>

            <View style={styles.distancePill}>
              <Ionicons name="location" size={12} color="#6C5CE7" />
              <Text style={styles.distanceText}>{item.distanceKm} km</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isCityEmpty = !loading && salons.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER OVERLAY */}
      <View style={[styles.headerOverlay, { paddingTop: Math.max(insets?.top || 20, 20) + 12 }]} pointerEvents="box-none">
        {/* Top Row: Location & Notification */}
        <View style={styles.topRow} pointerEvents="box-none">
          <TouchableOpacity activeOpacity={0.8} onPress={() => setLocationModalVisible(true)} style={styles.locationPill}>
            <Ionicons name="location" size={16} color="#762237" style={{ marginRight: 6 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.locationCityText}>{locationAddressText.split(',')[0] || selectedCity || "Brahmapur"}</Text>
                <Ionicons name="chevron-down" size={12} color="#18181B" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.locationAreaText} numberOfLines={1}>{locationAddressText.substring(locationAddressText.indexOf(',') + 1).trim() || selectedCity || "Gandhi Nagar, Dharma Nagar"}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={20} color="#18181B" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {!isCityEmpty && (
          <>
            {/* Search Pill */}
            <View style={styles.searchPill}>
              <Ionicons name="search-outline" size={18} color="#9999A0" style={{ marginRight: 8 }} />
              <TouchableOpacity activeOpacity={1} onPress={() => navigate("Explore")} style={{ flex: 1, paddingVertical: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: "400", color: "#9999A0" }}>
                  Search by salon name, area...
                </Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setFilterModalVisible(true)} style={styles.filterIconButton}>
                <Ionicons name="options-outline" size={18} color="#18181B" />
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 10 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = filters.serviceType === cat.id;
                return (
                  <TouchableOpacity key={cat.id} onPress={() => setFilters({ ...filters, serviceType: cat.id })} activeOpacity={0.85} style={[styles.catPill, isSelected ? styles.catPillActive : styles.catPillInactive]}>
                    <Text style={{ fontSize: 13, marginRight: 5 }}>{cat.icon}</Text>
                    <Text style={[styles.catText, isSelected ? styles.catTextActive : styles.catTextInactive]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
          <ActivityIndicator size="small" color="#762237" />
          <Text style={{ fontSize: 13, color: isDark ? "#A1A1AA" : "#71717A", marginTop: 10 }}>
            Loading salons in {selectedCity}…
          </Text>
        </View>
      ) : isCityEmpty ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: Math.max(insets?.top || 20, 20) + 70,
            paddingBottom: bottomBarInset + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(city) => {
              setSelectedCity(city);
            }}
          />
        </ScrollView>
      ) : (
        /* INTERACTIVE MAP ENGINE */
        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            <iframe
              id="leaflet-map-iframe"
              title="Salon Interactive Map"
              srcDoc={mapHtml}
              style={{ width: "100%", height: "100%", border: "none" }}
              onLoad={() => {
                const handleMessage = (e) => {
                  const data = mapService.parseMapMessage(e);
                  if (data?.type === "SELECT_SALON" && data?.id) {
                    handleSelectSalon(data.id);
                  } else if (data?.type === "NAVIGATE_SALON" && data?.id) {
                    const salonItem = filteredSalons.find(s => s.id === data.id) || { id: data.id, name: data.name };
                    navigate("SalonDetail", { salon: salonItem });
                  }
                };
                window.addEventListener("message", handleMessage);
              }}
            />
          ) : (
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: mapHtml, baseUrl: "https://localhost" }}
              style={{ flex: 1, width: "100%", height: "100%", backgroundColor: isDark ? "#121216" : "#EAEAEA" }}
              onMessage={(event) => {
                const data = mapService.parseMapMessage(event);
                if (data?.type === "SELECT_SALON" && data?.id) {
                  handleSelectSalon(data.id);
                } else if (data?.type === "NAVIGATE_SALON" && data?.id) {
                  const salonItem = filteredSalons.find(s => s.id === data.id) || { id: data.id, name: data.name };
                  navigate("SalonDetail", { salon: salonItem });
                }
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={false}
              mixedContentMode="always"
            />
          )}

          {/* Floating Map Controls */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleRecenterLocation} style={[styles.mapControlButton, { top: Math.max(insets?.top || 20, 20) + 160 }]}>
            <Ionicons name="locate-outline" size={20} color="#18181B" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={[styles.mapControlButton, { bottom: bottomBarInset + 20, width: 50, height: 50, borderRadius: 25 }]}>
            <Ionicons name="navigate-sharp" size={24} color="#18181B" style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        </View>
      )}

      {/* MODALS */}
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        onClose={() => setFilterModalVisible(false)}
      />

      <LocationPickerModal
        visible={locationModalVisible}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setLocationModalVisible(false);
        }}
        onClose={() => setLocationModalVisible(false)}
      />
    </View>
  );
}

function getStyles(isDark, insets) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#F8F9FA",
    },

    // Header Overlay Styles
    headerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 24,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      maxWidth: "80%",
    },
    locationCityText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#18181B",
    },
    locationAreaText: {
      fontSize: 12,
      color: "#71717A",
      marginTop: 2,
    },
    notificationBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    notificationDot: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#EF4444",
      borderWidth: 1.5,
      borderColor: "#FFFFFF",
    },
    searchPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      height: 48,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: "400",
      color: "#18181B",
      paddingVertical: 0,
    },
    filterIconButton: {
      padding: 6,
      marginLeft: 6,
      backgroundColor: "#F3F4F6",
      borderRadius: 16,
      position: "relative",
    },
    filterBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#FFFFFF",
    },
    filterBadgeText: {
      fontSize: 8,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    // Category Filter Pills
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    catPillActive: {
      backgroundColor: "#762237",
    },
    catPillInactive: {
      backgroundColor: "#FFFFFF",
    },
    catText: {
      fontSize: 13,
      fontWeight: "600",
    },
    catTextActive: {
      color: "#FFFFFF",
    },
    catTextInactive: {
      color: "#4B5563",
    },

    // Map Area
    mapContainer: {
      flex: 1,
      position: "relative",
    },
    mapControlButton: {
      position: "absolute",
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 15,
    },

    // Single Selected Salon Floating Card Styles
    singleCardWrapper: {
      position: "absolute",
      left: 16,
      right: 16,
      zIndex: 30,
    },
    singleSalonCard: {
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      borderRadius: 20,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 14,
      elevation: 8,
      borderWidth: 1.5,
      borderColor: "#6C5CE7",
    },
    singleCardImage: {
      width: 72,
      height: 72,
      borderRadius: 14,
      backgroundColor: isDark ? "#2C2C36" : "#EFEFF4",
    },
    singleCardContent: {
      flex: 1,
      marginLeft: 12,
      justifyContent: "center",
    },
    closeCardButton: {
      padding: 2,
      marginLeft: 6,
    },
    rightFooterMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    priceText: {
      fontSize: 12,
      fontWeight: "800",
      color: isDark ? "#A78BFA" : "#6C5CE7",
      marginLeft: 4,
    },
    carouselContent: {
      paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_MARGIN,
    },
    salonCard: {
      width: CARD_WIDTH,
      marginHorizontal: CARD_MARGIN,
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      borderRadius: 20,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 14,
      elevation: 8,
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    selectedSalonCard: {
      borderColor: "#6C5CE7",
      backgroundColor: isDark ? "#242232" : "#FFFFFF",
    },
    cardImage: {
      width: 72,
      height: 72,
      borderRadius: 14,
      backgroundColor: isDark ? "#2C2C36" : "#EFEFF4",
    },
    cardContent: {
      flex: 1,
      marginLeft: 12,
      justifyContent: "center",
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    salonName: {
      fontSize: 15,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.2,
    },
    salonAddress: {
      fontSize: 12,
      fontWeight: "400",
      color: isDark ? "#A1A1AA" : "#71717A",
      marginBottom: 8,
    },
    cardFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
    },
    ratingText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginLeft: 3,
    },
    reviewsCountText: {
      fontSize: 11,
      fontWeight: "400",
      color: isDark ? "#888894" : "#8E8E93",
      marginLeft: 3,
    },
    distancePill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.18)" : "rgba(108, 92, 231, 0.08)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    distanceText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: "#6C5CE7",
      marginLeft: 3,
    },

    // Empty / Loading
    loadingContainer: {
      alignSelf: "center",
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: isDark ? "#A1A1AA" : "#71717A",
      marginLeft: 8,
    },
    emptyCard: {
      alignSelf: "center",
      width: CARD_WIDTH,
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    emptySub: {
      fontSize: 12,
      fontWeight: "400",
      color: isDark ? "#888894" : "#71717A",
      marginTop: 2,
    },
  });
}