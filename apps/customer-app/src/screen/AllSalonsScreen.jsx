// src/screen/AllSalonsScreen.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SalonCard from "../components/SalonCard";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";
import FloatingSearchCapsule from "../components/FloatingSearchCapsule";
import FilterModal from "../components/FilterModal";
import { browseService } from "../services/browseService";
import { cleanCityName, getCurrentLocation } from "../services/locationService";
import { storage } from "../services/storage";
import { useLocationStore } from "../store/useLocationStore";

const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "combo", label: "Combos", icon: "🎁" },
  { id: "hair", label: "Haircut", icon: "✂️" },
  { id: "facial", label: "Facials", icon: "🧴" },
  { id: "nails", label: "Nails", icon: "💅" },
  { id: "spa", label: "Spa", icon: "🌿" },
];

const BRAHMAPUR_FALLBACK_SALONS = [
  {
    id: "b-1",
    _id: "b-1",
    name: "Royal Cut Luxury Salon & Spa",
    description: "Premier luxury styling, hair treatment & wellness sanctuary in Brahmapur.",
    address: { formattedAddress: "Silk City Road, Near Old Bus Stand, Brahmapur", street: "Silk City Road", city: "Brahmapur" },
    city: "Brahmapur",
    rating: { avgScore: 4.9, totalReviews: 142 },
    startingPrice: 500,
    minPrice: 500,
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"],
    categories: ["Haircut", "Styling", "Facial", "Spa"],
  },
  {
    id: "b-2",
    _id: "b-2",
    name: "Urban Edge Unisex Salon",
    description: "Modern trendsetting salon for precision haircuts, hair coloring & grooming.",
    address: { formattedAddress: "Engineering School Square, College Road, Brahmapur", street: "Engineering School Square", city: "Brahmapur" },
    city: "Brahmapur",
    rating: { avgScore: 4.8, totalReviews: 98 },
    startingPrice: 400,
    minPrice: 400,
    coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"],
    categories: ["Haircut", "Beard Trim", "Hair Color"],
  },
];

export default function AllSalonsScreen({ navigate, goBack, routeParams, onScroll }) {
  const { isDark } = useTheme();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const initLocation = useLocationStore((state) => state.initLocation);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [salons, setSalons] = useState(BRAHMAPUR_FALLBACK_SALONS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: "all",
    priceRange: "all",
    sortBy: "recommended",
    serviceType: "all",
  });

  const filteredSalons = useMemo(() => {
    let list = [...salons];

    if (filters.minRating && filters.minRating !== "all") {
      const minVal = parseFloat(filters.minRating);
      list = list.filter((s) => {
        const r = parseFloat(s.rating || s.branches?.[0]?.rating?.avgScore || 4.5);
        return r >= minVal;
      });
    }

    if (filters.priceRange && filters.priceRange !== "all") {
      list = list.filter((s) => {
        const startingPrice = s.startingPrice || s.minPrice || 600;
        if (filters.priceRange === "budget") return startingPrice < 500;
        if (filters.priceRange === "moderate") return startingPrice >= 500 && startingPrice <= 1500;
        if (filters.priceRange === "luxury") return startingPrice > 1500;
        return true;
      });
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
          catList.some((c) => (c.name || c).toString().toLowerCase().includes(typeStr))
        );
      });
    }

    if (filters.sortBy === "rating") {
      list.sort((a, b) => {
        const rA = parseFloat(a.rating || a.branches?.[0]?.rating?.avgScore || 0);
        const rB = parseFloat(b.rating || b.branches?.[0]?.rating?.avgScore || 0);
        return rB - rA;
      });
    } else if (filters.sortBy === "price_low") {
      list.sort((a, b) => (a.startingPrice || 500) - (b.startingPrice || 500));
    } else if (filters.sortBy === "price_high") {
      list.sort((a, b) => (b.startingPrice || 500) - (a.startingPrice || 500));
    }

    return list;
  }, [salons, filters]);

  useEffect(() => {
    if (routeParams?.city) {
      setSelectedCity(routeParams.city);
    } else {
      initLocation();
    }
  }, [routeParams?.city, initLocation, setSelectedCity]);

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSalons = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const cleanCity = cleanCityName(selectedCity);
      const params = { city: cleanCity };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      } else if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      const res = await browseService.getSalons(params);
      const list = res.data?.salons || (Array.isArray(res.data) ? res.data : []);
      if (list.length > 0) {
        setSalons(list);
      } else if (cleanCity.toLowerCase().includes("brahmapur") || cleanCity.toLowerCase().includes("berhampur")) {
        setSalons([
          {
            id: "b-1",
            name: "Royal Cut Luxury Salon & Spa",
            description: "Premier luxury styling, hair treatment & wellness sanctuary in Brahmapur.",
            address: { formattedAddress: "Silk City Road, Near Old Bus Stand, Brahmapur", street: "Silk City Road", city: "Brahmapur" },
            city: "Brahmapur",
            rating: { avgScore: 4.9, totalReviews: 142 },
            startingPrice: 500,
            minPrice: 500,
            coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
            images: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"],
            categories: ["Haircut", "Styling", "Facial", "Spa"],
          },
          {
            id: "b-2",
            name: "Urban Edge Unisex Salon",
            description: "Modern trendsetting salon for precision haircuts, hair coloring & grooming.",
            address: { formattedAddress: "Engineering School Square, College Road, Brahmapur", street: "Engineering School Square", city: "Brahmapur" },
            city: "Brahmapur",
            rating: { avgScore: 4.8, totalReviews: 98 },
            startingPrice: 400,
            minPrice: 400,
            coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
            images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"],
            categories: ["Haircut", "Beard Trim", "Hair Color"],
          },
        ]);
      } else {
        setSalons([]);
      }
    } catch (err) {
      console.log("AllSalonsScreen fetch error:", err.message);
      const cleanCity = cleanCityName(selectedCity);
      if (cleanCity.toLowerCase().includes("brahmapur") || cleanCity.toLowerCase().includes("berhampur")) {
        setSalons([
          {
            id: "b-1",
            name: "Royal Cut Luxury Salon & Spa",
            description: "Premier luxury styling, hair treatment & wellness sanctuary in Brahmapur.",
            address: { formattedAddress: "Silk City Road, Near Old Bus Stand, Brahmapur" },
            city: "Brahmapur",
            rating: { avgScore: 4.9, totalReviews: 142 },
            startingPrice: 500,
            coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
          },
          {
            id: "b-2",
            name: "Urban Edge Unisex Salon",
            description: "Modern trendsetting salon for precision haircuts, hair coloring & grooming.",
            address: { formattedAddress: "Engineering School Square, College Road, Brahmapur" },
            city: "Brahmapur",
            rating: { avgScore: 4.8, totalReviews: 98 },
            startingPrice: 400,
            coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
          },
        ]);
      } else {
        setError(err.message || "Failed to load salons");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchSalons(false);
  }, [fetchSalons]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSalons(true);
  }, [fetchSalons]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salon });
  }, [navigate]);

  const hasActiveFilterOrSearch = Boolean(debouncedSearch.trim() || selectedCategory !== "all");
  const isCityEmpty = !loading && salons.length === 0 && !hasActiveFilterOrSearch;

  const styles = buildStyles(isDark);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (goBack ? goBack() : navigate && navigate("Home"))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>

      </View>

      {/* Search & Filter Bar - only shown if city has salons or user is searching */}
      {!isCityEmpty && (
        <View style={styles.filterSection}>
          <FloatingSearchCapsule
            value={search}
            onChangeText={setSearch}
            onSelectSuggestion={(q) => setSearch(q)}
            onSearchSubmit={(q) => setSearch(q)}
            selectedCity={selectedCity}
            placeholder="Search studio name or service..."
            showDropdown={true}
            onLocationClick={() => setLocationModalVisible(true)}
            onFilterPress={() => setFilterModalVisible(true)}
          />

          <View style={{ height: 10 }} />

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={{ paddingRight: S.sm }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.85}
                >
                  {isSelected ? (
                    <View style={styles.catPillActiveGradient}>
                      <Text style={{ fontSize: 12, marginRight: 4 }}>{cat.icon}</Text>
                      <Text style={styles.catTextActive}>{cat.label}</Text>
                    </View>
                  ) : (
                    <View style={styles.catPillInactive}>
                      <Text style={{ fontSize: 12, marginRight: 4 }}>{cat.icon}</Text>
                      <Text style={styles.catTextInactive}>{cat.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.main} />}
      >
        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="small" color={C.main} />
            <Text style={styles.loadingText}>Loading partner studios in {selectedCity}...</Text>
          </View>
        ) : isCityEmpty ? (
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => {
              setSelectedCity(c);
              storage.setItem("@user_selected_city", c);
            }}
          />
        ) : error && salons.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="alert-circle-outline" size={28} color={C.muted} />
            <Text style={styles.emptyTitle}>Unable to load salons</Text>
            <Text style={styles.emptySub}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSalons(false)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSalons.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="search-outline" size={28} color={C.muted} />
            <Text style={styles.emptyTitle}>No matching studios found</Text>
            <Text style={styles.emptySub}>Try searching for a different name, adjusting price/rating filter, or clearing search.</Text>
          </View>
        ) : (
          <View style={styles.salonsList}>
            <Text style={styles.resultCountText}>
              Showing {filteredSalons.length} {filteredSalons.length === 1 ? "studio" : "studios"} in {selectedCity}
            </Text>
            {filteredSalons.map((salon, idx) => (
              <SalonCard
                key={salon._id || salon.id}
                salon={salon}
                isHorizontal={false}
                index={idx}
                onPress={handleSalonPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <LocationPickerModal
        visible={locationModalVisible}
        selectedCity={selectedCity}
        onSelectCity={(c) => setSelectedCity(c)}
        onClose={() => setLocationModalVisible(false)}
      />

      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApplyFilters={setFilters}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
}

function buildStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    topNav: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: Platform.OS === "android" ? 44 : 52,
      paddingHorizontal: S.md,
      // paddingBottom: S.sm,
      backgroundColor: C.bg,
      // borderBottomWidth: 1,
      // borderBottomColor: C.border,
      gap: S.xs,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.blue,
    },
    navTitleBox: {
      flex: 1,
    },
    navEyebrow: {
      ...TYPO.eyebrow,
      color: C.main,
      fontSize: 10,
    },
    navTitle: {
      fontSize: FS.titleSm,
      fontWeight: FW.bold,
      color: C.ink,
    },
    filterSection: {
      paddingHorizontal: S.md,
      paddingTop: S.sm,
      paddingBottom: S.xs,
      backgroundColor: C.bg,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      height: 42,
      borderRadius: R.md,
      paddingHorizontal: S.sm,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: S.xs,
    },
    searchInput: {
      flex: 1,
      fontSize: FS.bodySm,
      color: C.ink,
    },
    catScroll: {
      marginTop: 2,
    },
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.sm + 2,
      paddingVertical: 6,
      borderRadius: R.pill,
      marginRight: 6,
    },
    catPillActiveGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.sm + 2,
      paddingVertical: 6,
      borderRadius: R.pill,
      marginRight: 6,
      backgroundColor: C.main,
    },
    catPillInactive: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.sm + 2,
      paddingVertical: 6,
      borderRadius: R.pill,
      marginRight: 6,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    catText: {
      fontSize: FS.caption,
      fontWeight: FW.medium,
    },
    catTextActive: {
      color: C.bg,
    },
    catTextInactive: {
      color: C.ink,
    },
    listContainer: {
      paddingHorizontal: S.md,
      paddingTop: S.sm,
      paddingBottom: 84,
    },
    salonsList: {
      gap: S.sm,
    },
    resultCountText: {
      fontSize: FS.caption,
      color: C.muted,
      marginBottom: S.xs,
      fontWeight: FW.medium,
    },
    centerBlock: {
      padding: S.xl,
      alignItems: "center",
      justifyContent: "center",
      marginTop: S.lg,
      gap: 8,
    },
    loadingText: {
      fontSize: FS.bodySm,
      color: C.body,
      marginTop: S.xs,
    },
    emptyTitle: {
      fontSize: FS.titleSm,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    emptySub: {
      fontSize: FS.bodySm,
      color: C.body,
      textAlign: "center",
    },
    retryBtn: {
      backgroundColor: C.main,
      paddingHorizontal: S.md,
      paddingVertical: 8,
      borderRadius: R.md,
      marginTop: S.xs,
    },
    retryText: {
      color: C.bg,
      fontWeight: FW.medium,
      fontSize: FS.bodySm,
    },
  });
}
