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
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SalonCard from "../components/SalonCard";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";
import FilterModal from "../components/FilterModal";
import { browseService } from "../services/browseService";
import { cleanCityName } from "../services/locationService";
import { storage } from "../services/storage";
import { useLocationStore } from "../store/useLocationStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 7;

const CATEGORIES = [
  { id: "all", label: "All", iconName: "grid" },
  { id: "haircut", label: "Haircut", iconName: "cut-outline" },
  { id: "facials", label: "Facials", iconName: "water-outline" },
  { id: "spa", label: "Spa", iconName: "flower-outline" },
  { id: "makeup", label: "Makeup", iconName: "rose-outline" },
  { id: "combos", label: "Combos", iconName: "gift-outline" },
];
export default function AllSalonsScreen({ navigate, goBack, routeParams }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const initLocation = useLocationStore((state) => state.initLocation);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state: load 7 initially, load 7 more on scroll
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: "all",
    priceRange: "all",
    sortBy: "recommended",
    serviceType: "all",
  });

  // Filter salons
  const filteredSalons = useMemo(() => {
    let list = [...salons];

    if (filters.minRating && filters.minRating !== "all") {
      const minVal = parseFloat(filters.minRating);
      list = list.filter((s) => {
        const raw = typeof s.rating === "number" ? s.rating : (s.rating?.avgScore || s.rating?.score || s.avgScore || 4.5);
        const r = typeof raw === "number" ? raw : (parseFloat(raw) || 4.5);
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
        const rawA = typeof a.rating === "number" ? a.rating : (a.rating?.avgScore || a.rating?.score || a.avgScore || 0);
        const rawB = typeof b.rating === "number" ? b.rating : (b.rating?.avgScore || b.rating?.score || b.avgScore || 0);
        const rA = typeof rawA === "number" ? rawA : (parseFloat(rawA) || 0);
        const rB = typeof rawB === "number" ? rawB : (parseFloat(rawB) || 0);
        return rB - rA;
      });
    } else if (filters.sortBy === "price_low") {
      list.sort((a, b) => (a.startingPrice || 500) - (b.startingPrice || 500));
    } else if (filters.sortBy === "price_high") {
      list.sort((a, b) => (b.startingPrice || 500) - (a.startingPrice || 500));
    }

    return list;
  }, [salons, filters]);

  // Reset pagination count when search/category/city/filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCity, debouncedSearch, selectedCategory, filters]);

  // Slice list for pagination
  const displayedSalons = useMemo(() => {
    return filteredSalons.slice(0, visibleCount);
  }, [filteredSalons, visibleCount]);

  useEffect(() => {
    if (routeParams?.city) {
      setSelectedCity(routeParams.city);
    } else {
      initLocation();
    }
  }, [routeParams?.city, initLocation, setSelectedCity]);

  // Search Debounce
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
      let list = [];
      if (Array.isArray(res?.data?.data?.salons)) list = res.data.data.salons;
      else if (Array.isArray(res?.data?.salons)) list = res.data.salons;
      else if (Array.isArray(res?.data?.data)) list = res.data.data;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res)) list = res;

      setSalons(list);
    } catch (err) {
      console.log("AllSalonsScreen fetch error:", err.message);
      setError("Failed to load salons from server");
      setSalons([]);
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
    setVisibleCount(PAGE_SIZE);
    fetchSalons(true);
  }, [fetchSalons]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salon });
  }, [navigate]);

  // Infinite Scroll Handler: Load next 7 salons
  const handleLoadMore = useCallback(() => {
    if (loadingMore || visibleCount >= filteredSalons.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 400);
  }, [loadingMore, visibleCount, filteredSalons.length]);

  const hasActiveFilterOrSearch = Boolean(debouncedSearch.trim() || selectedCategory !== "all");
  const isCityEmpty = !loading && salons.length === 0 && !hasActiveFilterOrSearch;

  const styles = buildStyles(isDark, insets);

  // Header Component for FlatList
  const renderListHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Header Bar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (goBack ? goBack() : navigate && navigate("Home"))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? "#FFFFFF" : "#18181B"} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#9999A0" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search studio name or service..."
            placeholderTextColor="#9999A0"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#9999A0" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catPill,
                isSelected ? styles.catPillActive : styles.catPillInactive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.catIconWrap, isSelected && styles.catIconWrapActive]}>
                <Ionicons
                  name={cat.iconName}
                  size={15}
                  color={isSelected ? "#FFFFFF" : "#7A0026"}
                />
              </View>
              <Text style={[styles.catText, isSelected ? styles.catTextActive : styles.catTextInactive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results Bar */}
      {!isCityEmpty && (
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            Showing {displayedSalons.length} of {filteredSalons.length} {filteredSalons.length === 1 ? "studio" : "studios"} in {selectedCity || "Brahmapur"}
          </Text>

          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical-outline" size={14} color="#18181B" style={{ marginRight: 4 }} />
            <Text style={styles.sortBtnText}>Sort by</Text>
            <Ionicons name="chevron-down" size={14} color="#18181B" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Footer Loading Component for Pagination
  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#7A0026" />
          <Text style={styles.footerLoaderText}>Loading more studios...</Text>
        </View>
      );
    }
    if (visibleCount < filteredSalons.length) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.8}>
          <Text style={styles.loadMoreBtnText}>
            Load More Salons ({filteredSalons.length - visibleCount} remaining)
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ height: 24 }} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#FAFAFB"} />

      {loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color="#7A0026" />
          <Text style={styles.loadingText}>Loading partner studios in {selectedCity}...</Text>
        </View>
      ) : isCityEmpty ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderListHeader()}
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => {
              setSelectedCity(c);
              storage.setItem("@user_selected_city", c);
            }}
          />
        </ScrollView>
      ) : error && salons.length === 0 ? (
        <View style={styles.centerBlock}>
          <Ionicons name="alert-circle-outline" size={28} color="#71717A" />
          <Text style={styles.emptyTitle}>Unable to load salons</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSalons(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedSalons}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7A0026" />}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item, index }) => (
            <SalonCard
              salon={item}
              isHorizontal={false}
              index={index}
              onPress={handleSalonPress}
            />
          )}
        />
      )}

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

function buildStyles(isDark, insets) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#FAFAFB",
    },
    flatListContent: {
      paddingTop: Math.max(insets?.top || 20, 20) + 12,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    scrollContent: {
      paddingTop: Math.max(insets?.top || 20, 20) + 12,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    headerWrapper: {
      marginBottom: 8,
    },
    headerContainer: {
      marginBottom: 0,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "#1E1E24" : "#F4F4F6",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    titleCol: {
      flex: 1,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 13,
      color: isDark ? "#A1A1AA" : "#71717A",
      marginTop: 2,
    },
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FDF0F2",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 18,
      maxWidth: 160,
    },
    locationPillText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#7A0026",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1E1E24" : "#F4F4F6",
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 16,
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#18181B",
      paddingVertical: 0,
    },
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#7A0026",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#7A0026",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    catScroll: {
      marginBottom: 20,
    },
    catScrollContent: {
      paddingRight: 20,
    },
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    catPillActive: {
      backgroundColor: "#7A0026",
    },
    catPillInactive: {
      backgroundColor: isDark ? "#18181B" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#27272A" : "#E4E4E7",
    },
    catIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#FDF0F2",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    catIconWrapActive: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    catText: {
      fontSize: 14,
      fontWeight: "600",
    },
    catTextActive: {
      color: "#FFFFFF",
    },
    catTextInactive: {
      color: isDark ? "#FAFAFA" : "#3F3F46",
    },
    resultsHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    resultsCountText: {
      fontSize: 13,
      color: isDark ? "#A1A1AA" : "#71717A",
      fontWeight: "500",
    },
    sortBtn: {
      flexDirection: "row",
      alignItems: "center",
    },
    sortBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    centerBlock: {
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: "#71717A",
      marginTop: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    emptySub: {
      fontSize: 13,
      color: "#71717A",
      textAlign: "center",
    },
    retryBtn: {
      backgroundColor: "#7A0026",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      marginTop: 8,
    },
    retryText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 14,
    },
    footerLoader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
    },
    footerLoaderText: {
      fontSize: 13,
      color: "#7A0026",
      fontWeight: "600",
      marginLeft: 8,
    },
    loadMoreBtn: {
      alignSelf: "center",
      backgroundColor: isDark ? "#1E1E24" : "#F4F4F6",
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      marginVertical: 12,
    },
    loadMoreBtnText: {
      fontSize: 13,
      color: "#7A0026",
      fontWeight: "700",
    },
  });
}


