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
import { LinearGradient } from "expo-linear-gradient";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SalonCard from "../components/SalonCard";
import FloatingSearchCapsule from "../components/FloatingSearchCapsule";
import { SalonCardSkeleton } from "../components/SkeletonLoader";
import { browseService } from "../services/browseService";

const IS_IOS = Platform.OS === "ios";

const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "hair", label: "Haircut", icon: "✂️" },
  { id: "facial", label: "Facials", icon: "🧴" },
  { id: "nails", label: "Nails", icon: "💅" },
  { id: "spa", label: "Spa", icon: "🌿" },
  { id: "bridal", label: "Bridal", icon: "👑" },
];

const SUGGESTIONS = [
  { icon: "💇", label: "Haircut & Styling" },
  { icon: "🌿", label: "Spa & Massage" },
  { icon: "💅", label: "Manicure & Pedicure" },
  { icon: "🎀", label: "Bridal Makeup" },
  { icon: "✨", label: "Hair Spa & Detox" },
];

const DEBOUNCE_MS = 350;

/* ═════════════════════ iOS 26 liquid-glass design (iOS only) ═════════════════════ */

function glassTokens(isDark) {
  return {
    glassBgDeep: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.42)",
    glassBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.60)",
    orbA: isDark ? "rgba(192, 138, 110, 0.32)" : "rgba(223, 168, 143, 0.55)",
    orbB: isDark ? "rgba(122, 170, 128, 0.32)" : "rgba(159, 201, 162, 0.50)",
    orbC: isDark ? "rgba(122, 157, 192, 0.32)" : "rgba(159, 187, 224, 0.55)",
  };
}

function AuroraField({ isDark, styles }) {
  const t = glassTokens(isDark);
  const o1y = useRef(new Animated.Value(0)).current;
  const o1s = useRef(new Animated.Value(1)).current;
  const o2y = useRef(new Animated.Value(0)).current;
  const o2s = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(o1y, { toValue: -26, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(o1y, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(o1s, { toValue: 1.3, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(o1s, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(o2y, { toValue: 34, duration: 5600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(o2y, { toValue: 0, duration: 5600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(o2s, { toValue: 1.35, duration: 4800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(o2s, { toValue: 1, duration: 4800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [o1y, o1s, o2y, o2s]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.orb, styles.orbA, { backgroundColor: t.orbA, transform: [{ translateY: o1y }, { scale: o1s }] }]} />
      <Animated.View style={[styles.orb, styles.orbB, { backgroundColor: t.orbB, transform: [{ translateY: o2y }, { scale: o2s }] }]} />
      <Animated.View style={[styles.orb, styles.orbC, { backgroundColor: t.orbC }]} />

      {/* Bottom fade so result cards sit flat on the canvas */}
      <LinearGradient
        colors={["rgba(255,255,255,0)", C.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.fieldFade}
      />
    </View>
  );
}

function IosSearchHeader({
  styles,
  isDark,
  glass,
  search,
  searchFocused,
  onSearchChange,
  onFocus,
  onBlur,
  selectedCategory,
  onSelectCategory,
  onSuggestionPress,
}) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.eyebrow}>SEARCH & EXPLORE</Text>
        <Text style={styles.title}>Find your studio</Text>
        <Text style={styles.subtitle}>Luxury hair, beauty & spa, curated for you</Text>
      </View>

      <View style={styles.searchArea}>
        <View style={[styles.capsuleOuter, searchFocused ? styles.capsuleGlow : { borderColor: glass.glassBorder }]}>
          <BlurView
            intensity={isDark ? 34 : 82}
            tint={isDark ? "dark" : "light"}
            style={styles.capsuleBlur}
            experimentalBlurMethod="dimezis"
          >
            <Ionicons name="search" size={17} color={C.muted} style={styles.capsuleIcon} />
            <TextInput
              style={styles.capsuleInput}
              value={search}
              onChangeText={onSearchChange}
              placeholder="Search salons, services, studios…"
              placeholderTextColor={C.dustTaupe}
              autoCapitalize="none"
              selectionColor={C.main}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            {search ? (
              <TouchableOpacity onPress={() => onSearchChange("")} style={styles.clearBtn} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={17} color={C.muted} />
              </TouchableOpacity>
            ) : null}
          </BlurView>
          <View style={styles.sheenRing} pointerEvents="none">
            <LinearGradient
              colors={["rgba(255,255,255,0.85)", "rgba(255,255,255,0.03)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>

        {searchFocused && !search.trim() ? (
          <BlurView
            intensity={isDark ? 50 : 88}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.suggestPanel,
              { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.6)" },
            ]}
            experimentalBlurMethod="dimezis"
          >
            <Text style={styles.suggestLabel}>POPULAR SEARCHES</Text>
            {SUGGESTIONS.map((sug) => (
              <TouchableOpacity key={sug.label} style={styles.suggestRow} onPress={() => onSuggestionPress(sug.label)} activeOpacity={0.7}>
                <Text style={styles.suggestIcon}>{sug.icon}</Text>
                <Text style={styles.suggestText}>{sug.label}</Text>
                <Ionicons name="arrow-up" size={13} color={C.muted} style={styles.suggestArrow} />
              </TouchableOpacity>
            ))}
          </BlurView>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity key={cat.id} onPress={() => onSelectCategory(cat.id)} activeOpacity={0.8}>
              {isSelected ? (
                <LinearGradient
                  colors={[C.main, C.mainDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.catPill, styles.catPillSelected]}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={styles.catLabelSelected}>{cat.label}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.catPill,
                    styles.catPillUnselected,
                    { backgroundColor: glass.glassBgDeep, borderColor: glass.glassBorder },
                  ]}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ═════════════════ Default editorial design (Android / web) ═════════════════ */

function EditorialHeader({ styles, search, onSearchChange, selectedCategory, onSelectCategory }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitleRow}>
        <View style={{ flex: 1, paddingRight: S.sm }}>
          <Text style={styles.eyebrow}>SEARCH & EXPLORE</Text>
          <Text style={styles.title}>Search Salons</Text>
          <Text style={styles.subtitle}>Find luxury hair, beauty & spa studios near you</Text>
        </View>
      </View>

      <FloatingSearchCapsule
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search by salon name or service..."
      />

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
              style={[styles.catPill, isSelected ? styles.catPillSelected : styles.catPillUnselected]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, isSelected ? styles.catLabelSelected : styles.catLabelUnselected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ═════════════════ ExploreScreen (shared state + logic) ═════════════════ */

function ExploreScreen({ navigate, routeParams, onScroll }) {
  const { isDark } = useTheme();
  const glass = useMemo(() => glassTokens(isDark), [isDark]);
  const [search, setSearch] = useState(routeParams?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(routeParams?.search || "");
  const [selectedCategory, setSelectedCategory] = useState(routeParams?.category || "all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

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
        params.search = selectedCategory;
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

  const handleSuggestionPress = useCallback((label) => {
    handleSearchChange(label);
    setSearchFocused(false);
  }, [handleSearchChange]);

  const styles = IS_IOS ? buildIosStyles(isDark) : buildEditorialStyles(isDark);

  return (
    <View style={styles.container}>
      {IS_IOS && <AuroraField isDark={isDark} styles={styles} />}

      {IS_IOS ? (
        <IosSearchHeader
          styles={styles}
          isDark={isDark}
          glass={glass}
          search={search}
          searchFocused={searchFocused}
          onSearchChange={handleSearchChange}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSuggestionPress={handleSuggestionPress}
        />
      ) : (
        <EditorialHeader
          styles={styles}
          search={search}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {/* Results */}
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
          <View style={[styles.centerContainer, IS_IOS && { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)", borderColor: glass.glassBorder }]}>
            <Ionicons name="sparkles-outline" size={22} color={C.main} />
            <Text style={styles.emptyTitle}>No studios found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or category filter.</Text>
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

/* ── iOS 26 glass styles ─────────────────────────────────────────── */

function buildIosStyles(isDark) {
  return StyleSheet.create({
    orb: {
      position: "absolute",
      borderRadius: 999,
      opacity: 0.9,
      ...(Platform.OS === "web" ? { filter: "blur(60px)" } : {}),
    },
    orbA: {
      top: -50,
      right: -46,
      width: 280,
      height: 280,
      shadowColor: "#DFA88F",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 48,
    },
    orbB: {
      top: 210,
      left: -80,
      width: 320,
      height: 320,
      shadowColor: "#9FC9A2",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 52,
    },
    orbC: {
      top: 480,
      right: -70,
      width: 270,
      height: 270,
      shadowColor: "#9FBBE0",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.42,
      shadowRadius: 50,
    },
    fieldFade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 180,
    },

    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      paddingTop: 56,
      paddingHorizontal: S.md,
      paddingBottom: S.md,
      zIndex: 50,
    },
    titleBlock: {
      marginBottom: S.md,
    },
    eyebrow: {
      ...TYPO.eyebrow,
      color: C.main,
      marginBottom: 2,
    },
    title: {
      fontSize: FS.hero,
      fontWeight: "400",
      color: C.ink,
      letterSpacing: -0.72,
    },
    subtitle: {
      fontSize: FS.bodySm,
      color: C.body,
      marginTop: 2,
    },

    searchArea: {
      position: "relative",
      zIndex: 100,
    },
    capsuleOuter: {
      height: 46,
      borderRadius: R.lg,
      overflow: "hidden",
      borderWidth: 1,
    },
    capsuleGlow: {
      borderColor: C.main,
      shadowColor: C.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 6,
    },
    capsuleBlur: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.md,
      borderRadius: R.lg,
    },
    capsuleIcon: {
      marginRight: S.xs,
    },
    capsuleInput: {
      flex: 1,
      fontSize: FS.bodySm,
      color: C.ink,
      paddingVertical: 0,
    },
    clearBtn: {
      padding: 4,
    },
    sheenRing: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: R.lg,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.6)",
    },

    suggestPanel: {
      marginTop: S.xs,
      borderRadius: R.lg,
      paddingVertical: S.xs,
      paddingHorizontal: S.md,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
      overflow: "hidden",
    },
    suggestLabel: {
      fontSize: 10,
      fontWeight: FW.semiBold,
      color: C.textMuted,
      letterSpacing: 0.88,
      marginTop: S.xs,
      marginBottom: S.xxs,
    },
    suggestRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: S.sm,
    },
    suggestIcon: {
      fontSize: 14,
      width: 22,
    },
    suggestText: {
      flex: 1,
      fontSize: FS.bodySm,
      color: C.ink,
      fontWeight: FW.medium,
    },
    suggestArrow: {
      transform: [{ rotate: "45deg" }],
    },

    categoryRow: {
      marginTop: S.md,
      flexGrow: 0,
    },
    categoryContent: {
      paddingRight: S.sm,
    },
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.md,
      paddingVertical: 8,
      borderRadius: R.pill,
      marginRight: 8,
    },
    catPillSelected: {
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.7)",
      shadowColor: C.main,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    catPillUnselected: {
      borderWidth: 1,
    },
    catIcon: {
      fontSize: 13,
      marginRight: 6,
    },
    catLabel: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      color: C.ink,
    },
    catLabelSelected: {
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      color: "#FFFFFF",
    },

    listContainer: {
      paddingHorizontal: S.md,
      paddingTop: S.xs,
      paddingBottom: 110,
    },
    centerContainer: {
      padding: S.xl,
      alignItems: "center",
      borderRadius: R.lg,
      borderWidth: 1,
      marginTop: S.sm,
      gap: 8,
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
  });
}

/* ── Editorial (Cursor design system) styles for Android / web ──── */

function buildEditorialStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      backgroundColor: C.bg,
      paddingTop: 48,
      paddingHorizontal: S.md,
      paddingBottom: S.md,
    },
    headerTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: S.md,
    },
    eyebrow: {
      ...TYPO.eyebrow,
      color: C.main,
      marginBottom: 2,
    },
    title: {
      fontSize: FS.hero,
      fontWeight: "400",
      color: C.ink,
      letterSpacing: -0.72,
    },
    subtitle: {
      fontSize: FS.bodySm,
      color: C.body,
      marginTop: 2,
    },

    categoryRow: {
      marginTop: S.sm,
    },
    categoryContent: {
      paddingRight: S.sm,
    },
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.md,
      paddingVertical: 7,
      borderRadius: R.md,
      marginRight: 6,
    },
    catPillSelected: {
      backgroundColor: C.ink,
    },
    catPillUnselected: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
    },
    catIcon: {
      fontSize: 13,
      marginRight: 6,
    },
    catLabel: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
    catLabelSelected: {
      color: "#FFFFFF",
    },
    catLabelUnselected: {
      color: C.ink,
    },

    listContainer: {
      paddingHorizontal: S.md,
      paddingTop: S.xs,
      paddingBottom: 110,
    },
    centerContainer: {
      padding: S.xl,
      alignItems: "center",
      backgroundColor: C.surface,
      borderRadius: R.lg,
      marginHorizontal: S.md,
      borderWidth: 1,
      borderColor: C.border,
      gap: 8,
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
  });
}