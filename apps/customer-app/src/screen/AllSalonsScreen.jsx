// src/screen/AllSalonsScreen.jsx
import React, { useState, useEffect, useCallback, memo } from "react";
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
import { browseService } from "../services/browseService";
import { cleanCityName } from "../services/locationService";

const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "hair", label: "Haircut", icon: "✂️" },
  { id: "facial", label: "Facials", icon: "🧴" },
  { id: "nails", label: "Nails", icon: "💅" },
  { id: "spa", label: "Spa", icon: "🌿" },
];

export default function AllSalonsScreen({ navigate, goBack, routeParams, onScroll }) {
  const { isDark } = useTheme();
  const initialCity = routeParams?.city || "Brahmapur";
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
      setSalons(list);
    } catch (err) {
      setError(err.message || "Failed to load salons");
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
        <View style={styles.navTitleBox}>
          <Text style={styles.navEyebrow}>PARTNER STUDIOS</Text>
          <Text style={styles.navTitle}>Salons in {selectedCity}</Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={C.dustTaupe} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search studio name or service..."
            placeholderTextColor={C.dustTaupe}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={C.dustTaupe} />
            </TouchableOpacity>
          ) : null}
        </View>

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
            <Text style={styles.loadingText}>Loading partner studios...</Text>
          </View>
        ) : error && salons.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="alert-circle-outline" size={28} color={C.muted} />
            <Text style={styles.emptyTitle}>Unable to load salons</Text>
            <Text style={styles.emptySub}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSalons(false)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : salons.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="storefront-outline" size={28} color={C.muted} />
            <Text style={styles.emptyTitle}>No studios in {selectedCity}</Text>
            <Text style={styles.emptySub}>Try searching for a different name or clearing filters.</Text>
          </View>
        ) : (
          <View style={styles.salonsList}>
            <Text style={styles.resultCountText}>
              Showing {salons.length} {salons.length === 1 ? "studio" : "studios"} in {selectedCity}
            </Text>
            {salons.map((salon, idx) => (
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
      paddingBottom: S.sm,
      backgroundColor: C.bg,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
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
      borderColor: C.border,
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
      paddingBottom: 60,
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
