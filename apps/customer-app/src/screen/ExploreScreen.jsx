// src/screen/ExploreScreen.jsx
import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SalonCard from "../components/SalonCard";
import FloatingSearchCapsule from "../components/FloatingSearchCapsule";
import LocationPickerModal from "../components/LocationPickerModal";
import FilterModal from "../components/FilterModal";
import ComingSoonLocation from "../components/ComingSoonLocation";
import { SalonCardSkeleton } from "../components/SkeletonLoader";
import { browseService } from "../services/browseService";
import { customerService } from "../services/customerService";
import { storage } from "../services/storage";
import { useLocationStore } from "../store/useLocationStore";

const IS_IOS = Platform.OS === "ios";

const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "combo", label: "Combos", icon: "🎁" },
  { id: "hair", label: "Haircut", icon: "✂️" },
  { id: "facial", label: "Facials", icon: "🧴" },
  { id: "nails", label: "Nails", icon: "💅" },
  { id: "spa", label: "Spa", icon: "🌿" },
];

const SUGGESTIONS = [
  { icon: "💇", label: "Haircut & Styling" },
  { icon: "🌿", label: "Spa & Massage" },
  { icon: "💅", label: "Manicure & Pedicure" },
  { icon: "🎀", label: "Bridal Makeup" },
  { icon: "✨", label: "Hair Spa & Detox" },
];

const DEBOUNCE_MS = 350;

function EditorialHeader({
  styles,
  theme,
  isDark,
  toggleTheme,
  toggleAnim,
  selectedCity,
  onLocationClick,
  hasUnread,
  search,
  onSearchChange,
  onFilterPress,
  selectedCategory,
  onSelectCategory,
  navigate,
  hasSalons = true,
}) {
  const sunOpacity = toggleAnim
    ? toggleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    })
    : isDark ? 0 : 1;

  const moonOpacity = toggleAnim
    ? toggleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    })
    : isDark ? 1 : 0;

  return (
    <View style={[styles.header, { backgroundColor: theme.canvas }]}>
      {/* Search Input Bar with Integrated Filter Button & Category Pills */}
      {hasSalons ? (
        <View style={{ marginBottom: 4 }}>
          <FloatingSearchCapsule
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search by salon name or service..."
            showDropdown={false}
            onFilterPress={onFilterPress}
            selectedCity={selectedCity}
            onLocationClick={onLocationClick}
          />

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 6 }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => onSelectCategory && onSelectCategory(cat.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.catPill,
                    isSelected ? styles.catPillActive : styles.catPillInactive,
                  ]}
                >
                  <Text style={{ fontSize: 13, marginRight: 5 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.catText,
                      isSelected ? styles.catTextActive : styles.catTextInactive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

/* ═════════════════ ExploreScreen ═════════════════ */

function ExploreScreen({ navigate, routeParams, onScroll }) {
  const { theme, isDark, toggleTheme, toggleAnim } = useTheme();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const initLocation = useLocationStore((state) => state.initLocation);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: "all",
    priceRange: "all",
    sortBy: "recommended",
    serviceType: "all",
  });
  const [hasUnread, setHasUnread] = useState(false);
  const [search, setSearch] = useState(routeParams?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(routeParams?.search || "");
  const [selectedCategory, setSelectedCategory] = useState(routeParams?.category || "all");
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    initLocation();
  }, [initLocation]);

  useEffect(() => {
    setSearch(routeParams?.search || "");
    setDebouncedSearch(routeParams?.search || "");
    setSelectedCategory(routeParams?.category || "all");
    setFilters({
      minRating: "all",
      priceRange: "all",
      sortBy: "recommended",
      serviceType: "all",
    });
    if (routeParams?.openFilter) {
      setFilterModalVisible(true);
    }
  }, [routeParams]);

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
    setLocationModalVisible(false);
  }, [setSelectedCity]);

  useEffect(() => {
    let active = true;
    const checkUnread = async () => {
      try {
        const res = await customerService.getUnreadCount();
        const count = typeof res?.data?.count === "number" ? res.data.count : (res?.data?.unreadCount || 0);
        if (active) setHasUnread(count > 0);
      } catch (err) {
        try {
          const res = await customerService.getNotifications();
          const list = res?.data?.notifications || (Array.isArray(res?.data) ? res.data : []);
          const unread = list.some((n) => !n.isRead);
          if (active) setHasUnread(unread);
        } catch (e) { }
      }
    };
    checkUnread();
    return () => { active = false; };
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setFilters({
        minRating: "all",
        priceRange: "all",
        sortBy: "recommended",
        serviceType: "all",
      });
      setSearch("");
      setDebouncedSearch("");
      setSelectedCategory("all");
    };
  }, []);

  const fetchSalons = useCallback(async (silent = false) => {
    if (!silent && salons.length === 0) {
      setLoading(true);
    }
    try {
      const cleanCity = cleanCityName(selectedCity);
      const params = { city: cleanCity };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      } else if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      const res = await browseService.getSalons(params);
      const salonList = res.data?.salons || (Array.isArray(res.data) ? res.data : []);
      setSalons(salonList);
    } catch (err) {
      console.log("Failed to fetch salons:", err.message);
      if (salons.length === 0) setSalons([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchSalons(false);
  }, [fetchSalons]);

  // Apply Price, Rating, Sort & Service Filters
  const filteredSalons = useMemo(() => {
    let list = [...salons];

    // 1. Min Rating Filter
    if (filters.minRating && filters.minRating !== "all") {
      const minVal = parseFloat(filters.minRating);
      list = list.filter((s) => {
        const r = parseFloat(s.rating || s.branches?.[0]?.rating?.avgScore || 4.5);
        return r >= minVal;
      });
    }

    // 2. Price Range Filter
    if (filters.priceRange && filters.priceRange !== "all") {
      list = list.filter((s) => {
        const startingPrice = s.startingPrice || s.minPrice || 600;
        if (filters.priceRange === "budget") return startingPrice < 500;
        if (filters.priceRange === "moderate") return startingPrice >= 500 && startingPrice <= 1500;
        if (filters.priceRange === "luxury") return startingPrice > 1500;
        return true;
      });
    }

    // 3. Service Type Filter
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

    // 4. Sort By
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

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salon });
  }, [navigate]);

  const styles = buildEditorialStyles(isDark);

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <EditorialHeader
        styles={styles}
        theme={theme}
        isDark={isDark}
        toggleTheme={toggleTheme}
        toggleAnim={toggleAnim}
        selectedCity={selectedCity}
        onLocationClick={() => setLocationModalVisible(true)}
        hasUnread={hasUnread}
        search={search}
        onSearchChange={handleSearchChange}
        onFilterPress={() => setFilterModalVisible(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        navigate={navigate}
        hasSalons={loading || salons.length > 0}
      />

      <LocationPickerModal
        visible={locationModalVisible}
        selectedCity={selectedCity}
        onSelectCity={handleCitySelect}
        onClose={() => setLocationModalVisible(false)}
      />

      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApplyFilters={setFilters}
        onClose={() => setFilterModalVisible(false)}
      />

      {/* Salon Results List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {loading ? (
          <View>
            <SalonCardSkeleton variant="compact" />
            <SalonCardSkeleton variant="compact" />
            <SalonCardSkeleton variant="compact" />
          </View>
        ) : salons.length === 0 ? (
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={handleCitySelect}
          />
        ) : filteredSalons.length === 0 ? (
          <View style={[styles.centerContainer, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
            <Ionicons name="sparkles-outline" size={24} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>No studios found</Text>
            <Text style={[styles.emptySub, { color: theme.muted }]}>Try adjusting your search, rating, or price filter.</Text>
          </View>
        ) : (
          filteredSalons.map((salon, idx) => (
            <SalonCard key={salon._id || salon.id} salon={salon} index={idx} onPress={handleSalonPress} variant="compact" />
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default memo(ExploreScreen);

function buildEditorialStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: Platform.OS === "ios" ? 54 : 44,
      paddingHorizontal: S.md,
      paddingBottom: S.sm,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: S.sm + 2,
    },
    locationChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: S.sm,
      paddingVertical: 6,
      borderRadius: R.md,
      borderWidth: 1,
    },
    locationCity: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    topBarActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    themeBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    notifBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      position: "relative",
    },
    notifBadgeDot: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    headerTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: S.sm + 2,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: FW.bold,
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    title: {
      fontSize: 30,
      fontWeight: FW.bold,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 13,
      marginTop: 2,
    },
    notifBadgeDot: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    categoryRow: {
      marginTop: S.xs,
    },
    categoryContent: {
      paddingRight: S.sm,
    },
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
    },
    catPillActive: {
      backgroundColor: C.blue,
    },
    catPillInactive: {
      backgroundColor: isDark ? "#1F1F28" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#2C2C38" : "#EBECEF",
    },
    catText: {
      fontSize: 13,
      fontWeight: "600",
    },
    catTextActive: {
      color: "#FFFFFF",
    },
    catTextInactive: {
      color: isDark ? "#D1D1D6" : "#2C2C34",
    },

    listContainer: {
      paddingHorizontal: S.md,
      paddingTop: 2,
      paddingBottom: 130,
    },
    centerContainer: {
      padding: S.xl,
      alignItems: "center",
      borderRadius: R.lg,
      marginHorizontal: S.md,
      borderWidth: 1,
      marginTop: S.md,
      gap: 8,
    },
    emptyTitle: {
      fontSize: FS.titleSm,
      fontWeight: FW.bold,
    },
    emptySub: {
      fontSize: FS.bodySm,
      textAlign: "center",
    },
  });
}
