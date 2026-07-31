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
import { C, S } from "../theme";
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

  // Debounce search input
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
      {/* Aesthetic Minimal Light Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1, paddingRight: S.sm }}>
            <Text style={styles.eyebrow}>SEARCH & EXPLORE</Text>
            <Text style={styles.title}>Search Salons</Text>
            <Text style={styles.subtitle}>Find luxury hair, beauty & spa studios near you</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeIcon}>✨</Text>
          </View>
        </View>

        <FloatingSearchCapsule
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search by salon name or service..."
        />

        {/* Category Filter Pill Chips */}
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
            <ActivityIndicator size="small" color={C.dark} />
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
    backgroundColor: "#F7F5F0",
  },
  header: {
    backgroundColor: "#F7F5F0",
    paddingTop: 54,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.lg,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1714",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: "#78716C",
    marginTop: 3,
    fontWeight: "500",
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(180, 148, 96, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerBadgeIcon: {
    fontSize: 18,
  },

  // Category Filter Row
  categoryRow: {
    marginTop: 14,
  },
  categoryContent: {
    paddingRight: S.sm,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    marginRight: 8,
  },
  catPillSelected: {
    backgroundColor: "#121016",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  catPillUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  catIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  catLabelSelected: {
    color: "#E6CA65",
    fontWeight: "800",
  },
  catLabelUnselected: {
    color: "#1A1714",
  },

  listContainer: {
    paddingHorizontal: S.lg,
    paddingTop: S.xs,
    paddingBottom: 40,
  },
  centerContainer: {
    padding: S.xxl,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1714",
  },
  emptySub: {
    fontSize: 13,
    color: "#8E877D",
    textAlign: "center",
    marginTop: 4,
  },
});
