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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

const TOP_INSET = Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ? StatusBar.currentHeight + 14 : 44);

// Default fallback location (Brahmapur, Odisha, India)
const DEFAULT_LAT = 19.3150;
const DEFAULT_LNG = 84.7941;

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
  const styles = getStyles(isDark);
  const insets = useSafeAreaInsets();
  const bottomBarInset = Math.max(insets.bottom, 10) + 68;

  const selectedCity = useLocationStore((state) => state.selectedCity);
  const locationDetails = useLocationStore((state) => state.locationDetails);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const detectCurrentLocation = useLocationStore((state) => state.detectCurrentLocation);

  const [salons, setSalons] = useState(MOCK_SALONS);
  const [selectedSalonId, setSelectedSalonId] = useState(MOCK_SALONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: "all",
    priceRange: "all",
    sortBy: "recommended",
    serviceType: "all",
  });

  const flatListRef = useRef(null);
  const webViewRef = useRef(null);

  // Determine current center coordinates
  const userLat = locationDetails?.latitude || DEFAULT_LAT;
  const userLng = locationDetails?.longitude || DEFAULT_LNG;
  const locationAddressText = locationDetails?.formattedAddress || locationDetails?.area || `${selectedCity || "6391 Elgin St. Celina, Delaware 10299"}`;

  useEffect(() => {
    detectCurrentLocation();
  }, [detectCurrentLocation]);

  // Fetch salons or combine with fallback
  useEffect(() => {
    let isMounted = true;
    async function loadSalons() {
      try {
        setLoading(true);
        const res = await browseService.getSalons({ city: selectedCity });
        const fetchedList = res?.data || res || [];
        if (isMounted && Array.isArray(fetchedList) && fetchedList.length > 0) {
          const mapped = fetchedList.map((item, idx) => {
            const lat = parseFloat(item.latitude || item.address?.latitude || userLat + (idx % 2 === 0 ? 0.005 * (idx + 1) : -0.005 * (idx + 1)));
            const lng = parseFloat(item.longitude || item.address?.longitude || userLng + (idx % 2 === 0 ? -0.005 * (idx + 1) : 0.005 * (idx + 1)));
            const dist = calculateDistance(userLat, userLng, lat, lng);
            return {
              id: item.id || item._id || `s-${idx}`,
              name: item.name || "Salon",
              address: item.address?.formattedAddress || item.address || item.city || "Nearby Address",
              city: item.city || selectedCity,
              rating: parseFloat(item.rating?.avgScore || item.rating || 4.8),
              reviewsCount: item.rating?.totalReviews || item.reviewsCount || 45,
              startingPrice: item.startingPrice || item.minPrice || 499,
              latitude: lat,
              longitude: lng,
              distanceKm: dist ? parseFloat(dist.toFixed(1)) : 2.0,
              image: item.coverImage || item.images?.[0] || MOCK_SALONS[idx % MOCK_SALONS.length].image,
              categories: item.categories || ["Hair", "Beauty"],
            };
          });
          setSalons(mapped);
          if (mapped.length > 0) setSelectedSalonId(mapped[0].id);
        }
      } catch (err) {
        console.warn("MapScreen fetch error, using fallback salons:", err?.message);
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
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.categories.some((c) => (c.name || c).toLowerCase().includes(q))
      );
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
    return filteredSalons.find((s) => s.id === selectedSalonId) || filteredSalons[0] || salons[0];
  }, [filteredSalons, selectedSalonId, salons]);

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
      centerLat: mapCenterLat,
      centerLng: mapCenterLng,
      selectedSalonId: selectedSalon?.id || selectedSalonId,
      isDark,
      userLat,
      userLng,
    });
  }, [filteredSalons, mapCenterLat, mapCenterLng, selectedSalon, selectedSalonId, isDark, userLat, userLng]);

  // Recenter to user's current GPS location via mapService
  const handleRecenterLocation = async () => {
    try {
      await detectCurrentLocation();
      const targetLat = locationDetails?.latitude || userLat;
      const targetLng = locationDetails?.longitude || userLng;
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* TOP FLOATING CARD HEADER */}
      <View style={styles.topFloatingCard}>
        {/* Location Row */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setLocationModalVisible(true)}
          style={styles.locationRow}
        >
          <Ionicons
            name="location-outline"
            size={18}
            color={isDark ? "#FFFFFF" : "#18181B"}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationAddressText}
          </Text>
        </TouchableOpacity>

        {/* Search Capsule with Filter Sliders Icon Inside */}
        <View style={styles.searchCapsule}>
          <Ionicons
            name="search-outline"
            size={18}
            color={isDark ? "#A1A1AA" : "#9999A0"}
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Salons..."
            placeholderTextColor={isDark ? "#66666E" : "#B0B0B8"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4, marginRight: 4 }}>
              <Ionicons name="close-circle" size={16} color={isDark ? "#888894" : "#9999A0"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterIconButton}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilterCount > 0 ? "#6C5CE7" : isDark ? "#A1A1AA" : "#2C2C2E"}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* INTERACTIVE MAP ENGINE */}
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
                }
              };
              window.addEventListener("message", handleMessage);
            }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            style={{ flex: 1, backgroundColor: isDark ? "#121216" : "#EAEAEA" }}
            onMessage={(event) => {
              const data = mapService.parseMapMessage(event);
              if (data?.type === "SELECT_SALON" && data?.id) {
                handleSelectSalon(data.id);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={false}
          />
        )}

        {/* Floating Map Controls (GPS Recenter Button) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRecenterLocation}
          style={[styles.recenterButton, { bottom: bottomBarInset + (selectedSalon ? 120 : 20) }]}
        >
          <Ionicons name="locate-outline" size={22} color="#6C5CE7" />
        </TouchableOpacity>

        {/* Single Floating Selected Salon Card */}
        {selectedSalon && (
          <View style={[styles.singleCardWrapper, { bottom: bottomBarInset + 12 }]}>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => {
                navigate("SalonDetail", { salonId: selectedSalon.id, salonName: selectedSalon.name });
              }}
              style={styles.singleSalonCard}
            >
              <Image source={{ uri: selectedSalon.image }} style={styles.singleCardImage} />

              <View style={styles.singleCardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.salonName} numberOfLines={1}>
                    {selectedSalon.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedSalonId(null)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.closeCardButton}
                  >
                    <Ionicons name="close-circle" size={20} color={isDark ? "#A1A1AA" : "#8E8E93"} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.salonAddress} numberOfLines={1}>
                  {selectedSalon.address}
                </Text>

                <View style={styles.cardFooterRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={13} color="#FFB800" />
                    <Text style={styles.ratingText}>{selectedSalon.rating}</Text>
                    <Text style={styles.reviewsCountText}>({selectedSalon.reviewsCount})</Text>
                  </View>

                  <View style={styles.rightFooterMeta}>
                    <View style={styles.distancePill}>
                      <Ionicons name="location" size={12} color="#6C5CE7" />
                      <Text style={styles.distanceText}>{selectedSalon.distanceKm} km</Text>
                    </View>
                    <Text style={styles.priceText}>From ₹{selectedSalon.startingPrice}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

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

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#F8F9FA",
    },

    // Top Docked Header Container
    topFloatingCard: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: isDark ? "#1C1C22" : "#FFFFFF",
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: TOP_INSET + 16,
      paddingBottom: 16,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 16,
      elevation: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
      paddingHorizontal: 2,
    },
    locationText: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: "700",
      color: isDark ? "#F4F4F5" : "#18181B",
      letterSpacing: -0.2,
    },
    searchCapsule: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#282830" : "#F6F6F9",
      borderRadius: 18,
      paddingHorizontal: 14,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: "400",
      color: isDark ? "#FFFFFF" : "#18181B",
      paddingVertical: 0,
    },
    filterIconButton: {
      padding: 4,
      marginLeft: 6,
      position: "relative",
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      width: 15,
      height: 15,
      borderRadius: 8,
      backgroundColor: "#FF3B30",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "#FFFFFF",
    },
    filterBadgeText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    // Map Area
    mapContainer: {
      flex: 1,
      position: "relative",
    },
    nativeMapCanvas: {
      flex: 1,
      backgroundColor: isDark ? "#1A1A22" : "#EAEAEA",
      alignItems: "center",
      justifyContent: "center",
    },
    mapOverlayGrid: {
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    nativeMapText: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginTop: 12,
    },
    nativeMapSubText: {
      fontSize: 12.5,
      fontWeight: "500",
      color: isDark ? "#A1A1AA" : "#71717A",
      marginTop: 4,
    },
    recenterButton: {
      position: "absolute",
      right: 18,
      bottom: 140,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(30, 30, 38, 0.95)" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 15,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
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

