// src/screen/SavedSalonsScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { customerService } from "../services/customerService";
import SalonCard from "../components/SalonCard";

export default function SavedSalonsScreen({ navigate, onBack }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      const res = await customerService.getFavoriteSalons();
      if (res?.data?.favorites) {
        setFavorites(res.data.favorites);
      } else if (Array.isArray(res?.data)) {
        setFavorites(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch favorites:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleRemoveFavorite = async (salonId) => {
    try {
      await customerService.removeFavoriteSalon(salonId);
      setFavorites((prev) => prev.filter((s) => (s._id || s.id) !== salonId));
    } catch (e) {
      console.warn("Failed to remove favorite", e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack || (() => navigate && navigate("Profile"))}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.eyebrow}>BOOKMARKS</Text>
          <Text style={styles.title}>Saved Salons</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={C.main} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.main} />}
        >
          {favorites.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-dislike-outline" size={32} color={C.dustTaupe} />
              </View>
              <Text style={styles.emptyTitle}>No Saved Salons Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart icon on any salon to bookmark it for 1-tap quick booking!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigate && navigate("Explore")}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreBtnText}>Explore Salons</Text>
              </TouchableOpacity>
            </View>
          ) : (
            favorites.map((salon) => {
              const salonId = salon._id || salon.id;
              const firstBranch = salon.branches && salon.branches[0];

              return (
                <View key={salonId} style={styles.salonItemContainer}>
                  <SalonCard
                    salon={{
                      ...salon,
                      id: salonId,
                      name: salon.name,
                      branchName: firstBranch?.name || "Main Branch",
                      address: firstBranch?.address ? `${firstBranch.address.street}, ${firstBranch.address.city}` : "Address unavailable",
                      rating: firstBranch?.rating?.avgScore || 4.8,
                      ratingCount: firstBranch?.rating?.count || 120,
                      isFavorite: true,
                    }}
                    onPress={() => navigate && navigate("SalonDetail", { salonId, salon })}
                  />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveFavorite(salonId)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color={C.error} />
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
    backgroundColor: C.bg,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: R.full,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: S.sm,
  },
  headerTextGroup: {
    flex: 1,
  },
  eyebrow: {
    ...TYPO.eyebrow,
    color: C.main,
    fontSize: 11,
  },
  title: {
    fontSize: 22,
    fontWeight: FW.medium,
    color: C.ink,
    letterSpacing: -0.4,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: S.md,
    gap: S.md,
  },
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: S.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    marginTop: S.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: R.full,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
  },
  emptyTitle: {
    fontSize: FS.h3,
    fontWeight: FW.medium,
    color: C.ink,
    marginBottom: S.xs,
  },
  emptySubtitle: {
    fontSize: FS.bodySm,
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: S.lg,
  },
  exploreBtn: {
    backgroundColor: C.main,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: R.full,
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
  salonItemContainer: {
    position: "relative",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  removeBtnText: {
    fontSize: 12,
    color: C.error,
    fontWeight: FW.medium,
  },
});
