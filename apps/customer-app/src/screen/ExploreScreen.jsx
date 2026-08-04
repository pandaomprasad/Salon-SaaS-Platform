// src/screen/ExploreScreen.jsx
import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { C, S, FS, FW, R, TYPO } from "../theme";
import SalonCard from "../components/SalonCard";
import FloatingSearchCapsule from "../components/FloatingSearchCapsule";
import { browseService } from "../services/browseService";

const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "hair", label: "Haircut", icon: "✂️" },
  { id: "facial", label: "Facials", icon: "🧴" },
  { id: "nails", label: "Nails", icon: "💅" },
  { id: "spa", label: "Spa", icon: "🌿" },
  { id: "bridal", label: "Bridal", icon: "👑" },
];

const DEBOUNCE_MS = 350;

function ExploreScreen({ navigate, routeParams, onScroll }) {
  const [search, setSearch] = useState(routeParams?.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(routeParams?.search || "");
  const [selectedCategory, setSelectedCategory] = useState(routeParams?.category || "all");
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

  return (
    <View style={styles.container}>
      {/* Aesthetic Light Header */}
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
          onChangeText={handleSearchChange}
          placeholder="Search by salon name or service..."
        />

        {/* Category Filter Pill Chips per cursor/DESIGN.md */}
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
                onPress={() => setSelectedCategory(cat.id)}
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

      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={C.main} />
          </View>
        ) : salons.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyTitle}>No salons found</Text>
            <Text style={styles.emptySub}>Try adjusting your search query or category filter.</Text>
          </View>
        ) : (
          salons.map((salon, idx) => (
            <SalonCard
              key={salon._id || salon.id}
              salon={salon}
              index={idx}
              onPress={handleSalonPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default memo(ExploreScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg, // Canvas warm cream #f7f7f4
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
    fontWeight: "400", // Display 400
    color: C.ink,
    letterSpacing: -0.72,
  },
  subtitle: {
    fontSize: FS.bodySm,
    color: C.body,
    marginTop: 2,
  },

  // Category Filter Row
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
    borderRadius: R.md, // 8px radius per cursor/DESIGN.md
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
    marginTop: 4,
  },
});
