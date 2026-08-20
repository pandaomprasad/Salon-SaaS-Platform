// src/screen/SavedSalonsScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useFavorites } from "../context/FavoritesContext";
import { customerService } from "../services/customerService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SalonCard from "../components/SalonCard";

export default function SavedSalonsScreen({ navigate, onBack }) {
  const { theme, isDark } = useTheme();
  const { favorites: localFavorites, toggleFavorite } = useFavorites();
  const styles = getStyles(theme, isDark);

  const [remoteFavorites, setRemoteFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRemoteFavorites = useCallback(async () => {
    try {
      const res = await customerService.getFavoriteSalons();
      const list = res?.data?.favorites || (Array.isArray(res?.data) ? res.data : []);
      setRemoteFavorites(list);
    } catch (err) {
      console.log("Remote favorites sync note:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRemoteFavorites();
  }, [fetchRemoteFavorites]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRemoteFavorites();
  };

  // Combine local & remote favorites without duplicates
  const allFavorites = useMemo(() => {
    const map = new Map();
    (localFavorites || []).forEach((item) => {
      const id = item._id || item.id;
      if (id) map.set(id, item);
    });
    (remoteFavorites || []).forEach((item) => {
      const id = item._id || item.id;
      if (id && !map.has(id)) map.set(id, item);
    });
    return Array.from(map.values());
  }, [localFavorites, remoteFavorites]);

  const handleSalonPress = (salon) => {
    if (navigate) navigate("SalonDetail", { salon });
  };

  const handleRemove = (salon) => {
    toggleFavorite(salon);
    setRemoteFavorites((prev) => prev.filter((s) => (s._id || s.id) !== (salon._id || salon.id)));
  };

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topInset + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack || (() => navigate && navigate("Profile"))}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={C.ink} />
        </TouchableOpacity>

        <View style={styles.headerTextGroup}>
          <Text style={styles.eyebrow}>BOOKMARKS</Text>
          <Text style={styles.title}>Saved Salons</Text>
        </View>

        {allFavorites.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{allFavorites.length} Saved</Text>
          </View>
        )}
      </View>

      {/* Main Content Body */}
      {loading && allFavorites.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={C.main} />
          <Text style={styles.loadingText}>Loading saved studios…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.main} />}
        >
          {allFavorites.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-dislike-outline" size={32} color={C.main} />
              </View>
              <Text style={styles.emptyTitle}>No Saved Salons Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart icon on any salon card to bookmark it for 1-tap quick booking!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigate && navigate("Explore")}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.exploreBtnText}>Explore Luxury Salons</Text>
              </TouchableOpacity>
            </View>
          ) : (
            allFavorites.map((salon, idx) => {
              const salonId = salon._id || salon.id;
              return (
                <View key={salonId || idx} style={styles.cardWrapper}>
                  <SalonCard salon={salon} index={idx} onPress={handleSalonPress} />
                  <TouchableOpacity
                    style={styles.removeBar}
                    onPress={() => handleRemove(salon)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={14} color={C.herat || C.error} />
                    <Text style={styles.removeBarText}>Remove from saved</Text>
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

function getStyles(theme, isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      paddingTop: Platform.OS === "ios" ? 54 : 44,
      paddingHorizontal: S.md,
      paddingBottom: S.md,
      backgroundColor: C.bg,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: R.md,
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
      letterSpacing: 1.2,
    },
    title: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 24,
      fontWeight: FW.bold,
      color: C.ink,
      letterSpacing: -0.3,
      marginTop: 2,
    },
    countBadge: {
      backgroundColor: C.goldTint,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: C.goldTintStrong,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: FW.bold,
      color: C.main,
      letterSpacing: 0.5,
    },
    centerBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: S.xs,
    },
    loadingText: {
      fontSize: FS.bodySm,
      color: C.muted,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: S.md,
      paddingBottom: 130,
      gap: S.md,
    },
    emptyCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.xl,
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
      marginTop: S.lg,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: C.goldTint,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: S.md,
    },
    emptyTitle: {
      fontSize: FS.h3,
      fontWeight: FW.bold,
      color: C.ink,
      marginBottom: S.xs,
    },
    emptySubtitle: {
      fontSize: FS.bodySm,
      color: C.muted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: S.lg,
      maxWidth: 280,
    },
    exploreBtn: {
      backgroundColor: C.main,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: R.button,
    },
    exploreBtnText: {
      color: "#FFFFFF",
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
    },
    cardWrapper: {
      marginBottom: S.xs,
    },
    removeBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 4,
      marginTop: -S.xs,
      marginBottom: S.xs,
    },
    removeBarText: {
      fontSize: 11.5,
      fontWeight: FW.medium,
      color: C.herat || C.error,
    },
  });
}
