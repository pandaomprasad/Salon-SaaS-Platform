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
import { SalonCardSkeleton } from "../components/SkeletonLoader";
import { browseService } from "../services/browseService";
import { customerService } from "../services/customerService";
import { storage } from "../services/storage";

const IS_IOS = Platform.OS === "ios";

const CATEGORIES = [
  { id: "all", label: "All", iconName: "sparkles-outline" },
  { id: "hair", label: "Haircut", iconName: "scissors-outline", color: "#C48B36" },
  { id: "facial", label: "Facials", iconName: "water-outline", color: "#3B82F6" },
  { id: "nails", label: "Nails", iconName: "color-fill-outline", color: "#EC4899" },
  { id: "spa", label: "Spa", iconName: "flower-outline", color: "#10B981" },
  { id: "bridal", label: "Bridal", iconName: "ribbon-outline", color: "#8B5CF6" },
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
  selectedCategory,
  onSelectCategory,
  navigate,
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
      {/* Top Bar: Location Selector & Action Buttons (Theme Toggle + Notifications) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.locationChip, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
          onPress={onLocationClick}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={14} color={theme.primary} />
          <Text style={[styles.locationCity, { color: theme.ink }]} numberOfLines={1}>
            {selectedCity || "Brahmapur"}
          </Text>
          <Ionicons name="chevron-down" size={12} color={theme.muted} />
        </TouchableOpacity>

        <View style={styles.topBarActions}>
          {/* Theme Mode Switcher */}
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
            accessibilityRole="button"
          >
            {toggleAnim ? (
              <>
                <Animated.View style={{ opacity: sunOpacity, position: "absolute" }}>
                  <Ionicons name="sunny-outline" size={17} color={theme.primary} />
                </Animated.View>
                <Animated.View style={{ opacity: moonOpacity }}>
                  <Ionicons name="moon-outline" size={17} color={theme.primary} />
                </Animated.View>
              </>
            ) : (
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={17} color={theme.primary} />
            )}
          </TouchableOpacity>

          {/* Notification Bell Button */}
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
            onPress={() => navigate && navigate("NotificationCenter")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={18} color={theme.ink} />
            {hasUnread && <View style={[styles.notifBadgeDot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Header Title Row */}
      <View style={styles.headerTitleRow}>
        <View style={{ flex: 1, paddingRight: S.sm }}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>SEARCH &amp; EXPLORE</Text>
          <Text style={[styles.title, { color: theme.ink, fontFamily: FONT_FAMILY.serif }]}>
            Search Salons
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Find luxury hair, beauty &amp; spa studios near you
          </Text>
        </View>
      </View>

      {/* Search Input Bar with Integrated Gold Filter Button */}
      <View style={{ marginBottom: S.md }}>
        <FloatingSearchCapsule
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search by salon name or service..."
          onFilterPress={() => {}}
        />
      </View>

      {/* Category Filter Chips (Horizontal Scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catPill,
                isSelected
                  ? [styles.catPillSelected, { backgroundColor: theme.primary }]
                  : [styles.catPillUnselected, { backgroundColor: theme.surface, borderColor: theme.hairline }],
              ]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.iconName}
                size={14}
                color={isSelected ? "#FFFFFF" : (cat.color || theme.primary)}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.catLabel,
                  { color: isSelected ? "#FFFFFF" : theme.ink, fontWeight: isSelected ? "700" : "600" },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ═════════════════ ExploreScreen ═════════════════ */

function ExploreScreen({ navigate, routeParams, onScroll }) {
  const { theme, isDark, toggleTheme, toggleAnim } = useTheme();
  const [selectedCity, setSelectedCity] = useState("Brahmapur");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [search, setSearch] = useState(routeParams?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(routeParams?.search || "");
  const [selectedCategory, setSelectedCategory] = useState(routeParams?.category || "all");
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const loadSavedCity = async () => {
      try {
        const saved = await storage.getItem("@user_selected_city");
        if (saved && saved.trim()) setSelectedCity(saved);
      } catch (e) {}
    };
    loadSavedCity();
  }, []);

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
    storage.setItem("@user_selected_city", city);
    setLocationModalVisible(false);
  }, []);

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
        } catch (e) {}
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
    };
  }, []);

  const fetchSalons = useCallback(async (silent = false) => {
    if (!silent && salons.length === 0) {
      setLoading(true);
    }
    try {
      const params = {};
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
  }, [debouncedSearch, selectedCategory, salons.length]);

  useEffect(() => {
    fetchSalons(salons.length > 0);
  }, [fetchSalons]);

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
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        navigate={navigate}
      />

      <LocationPickerModal
        visible={locationModalVisible}
        selectedCity={selectedCity}
        onSelectCity={handleCitySelect}
        onClose={() => setLocationModalVisible(false)}
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
          <View style={{ gap: S.sm }}>
            <SalonCardSkeleton />
            <SalonCardSkeleton />
            <SalonCardSkeleton />
          </View>
        ) : salons.length === 0 ? (
          <View style={[styles.centerContainer, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
            <Ionicons name="sparkles-outline" size={24} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>No studios found</Text>
            <Text style={[styles.emptySub, { color: theme.muted }]}>Try adjusting your search or category filter.</Text>
          </View>
        ) : (
          salons.map((salon, idx) => (
            <SalonCard key={salon._id || salon.id} salon={salon} index={idx} onPress={handleSalonPress} />
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
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 14,
      marginRight: 8,
    },
    catPillSelected: {
      // Solid Primary Gold fill
    },
    catPillUnselected: {
      borderWidth: 1,
    },
    catLabel: {
      fontSize: 13,
    },

    listContainer: {
      paddingHorizontal: S.md,
      paddingTop: S.xs,
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