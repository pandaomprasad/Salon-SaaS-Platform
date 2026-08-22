// src/screen/homeScreen.jsx
import React, { useEffect, useState, useCallback, memo } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Ios26HomeHero from "../components/Ios26HomeHero";
import TopPromoBanner from "../components/TopPromoBanner";
import QuickRebookWidget from "../components/QuickRebookWidget";
import SalonCard from "../components/SalonCard";
import LocationPickerModal from "../components/LocationPickerModal";
import InteractiveMapModal from "../components/InteractiveMapModal";
import AddReviewModal from "../components/AddReviewModal";
import { browseService } from "../services/browseService";
import { appointmentService } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";
import { storage } from "../services/storage";
import { cleanCityName } from "../services/locationService";
import { socketClient } from "../services/socketClient";

const SalonCarousel = memo(({ salons, onSalonPress, styles }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.horizontalCarousel}
    contentContainerStyle={{ paddingLeft: S.md, paddingRight: S.xs }}
  >
    {salons.map((salon, idx) => (
      <SalonCard key={salon._id || salon.id} salon={salon} isHorizontal={true} index={idx} onPress={onSalonPress} />
    ))}
  </ScrollView>
));

const SalonVerticalList = memo(({ salons, onSalonPress, styles }) => (
  <View style={styles.verticalList}>
    {salons.map((salon, idx) => (
      <SalonCard key={`full_${salon._id || salon.id}`} salon={salon} isHorizontal={false} index={idx + 2} onPress={onSalonPress} />
    ))}
  </View>
));

const GLOBAL_SALON_CACHE = {};

function getSalonRating(s) {
  if (!s) return 0;
  if (typeof s.rating === "number") return s.rating;
  if (typeof s.rating === "object" && s.rating !== null) {
    return s.rating.average || s.rating.score || s.rating.avg || 4.5;
  }
  return 4.5;
}

const PAGE_SIZE = 5;

function HomeScreen({ navigate, onScroll }) {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [selectedCity, setSelectedCity] = useState("Brahmapur");
  const initialCleanCity = cleanCityName("Brahmapur");
  const initialSalons = GLOBAL_SALON_CACHE[initialCleanCity] || [];
  const [salons, setSalons] = useState(initialSalons);
  const [loading, setLoading] = useState(initialSalons.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [upcomingAppt, setUpcomingAppt] = useState(null);
  const [reviewModalAppt, setReviewModalAppt] = useState(null);
  const promptedReviewIdsRef = React.useRef(new Set());

  // Filter salons to only show those with > 3 stars rating
  const topRatedSalons = React.useMemo(() => {
    return (salons || []).filter((s) => getSalonRating(s) > 3.0);
  }, [salons]);

  // Paginated list slice
  const paginatedSalons = React.useMemo(() => {
    return topRatedSalons.slice(0, page * PAGE_SIZE);
  }, [topRatedSalons, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedCity]);

  const handleAddReviewSubmit = async ({ rating, comment }) => {
    if (!reviewModalAppt) return;
    const apptId = reviewModalAppt._id || reviewModalAppt.id;
    try {
      await appointmentService.rateAppointment(apptId, rating, comment);
      setReviewModalAppt(null);
    } catch (e) {
      console.warn("Failed to submit review", e);
    }
  };

  useEffect(() => {
    storage.getItem("@user_selected_city").then((savedCity) => {
      if (savedCity && savedCity.trim()) setSelectedCity(savedCity);
    });
  }, []);

  const salonsRef = React.useRef(salons);
  salonsRef.current = salons;
  const upcomingApptRef = React.useRef(upcomingAppt);
  upcomingApptRef.current = upcomingAppt;
  const salonCacheRef = React.useRef({});
  const prevCityRef = React.useRef(selectedCity);

  useEffect(() => {
    if (prevCityRef.current !== selectedCity) {
      prevCityRef.current = selectedCity;
      const cleanCity = cleanCityName(selectedCity);
      const cached = GLOBAL_SALON_CACHE[cleanCity] || salonCacheRef.current[cleanCity];
      if (cached && cached.length > 0) { setSalons(cached); setLoading(false); }
      else { setSalons([]); setLoading(true); }
      setLoadError(null);
    }
  }, [selectedCity]);

  const loadData = useCallback(async (silent = false) => {
    const cleanCity = cleanCityName(selectedCity);
    const cachedList = GLOBAL_SALON_CACHE[cleanCity] || salonCacheRef.current[cleanCity] || [];
    const hasCachedData = cachedList.length > 0 || salonsRef.current.length > 0;
    try {
      setLoadError(null);
      if (!silent && !hasCachedData) setLoading(true);
      const res = await browseService.getSalons({ city: cleanCity });
      const salonList = res.data?.salons || (Array.isArray(res.data) ? res.data : []);
      salonCacheRef.current[cleanCity] = salonList;
      GLOBAL_SALON_CACHE[cleanCity] = salonList;
      if (JSON.stringify(salonList) !== JSON.stringify(salonsRef.current)) setSalons(salonList);
      if (isAuthenticated) {
        try {
          const apptRes = await appointmentService.getAppointments();
          const list = apptRes.data?.appointments || (Array.isArray(apptRes.data) ? apptRes.data : []);
          const active = list.find((a) => ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes((a.status || "").toUpperCase()));
          const target = active || (list.length > 0 ? list[0] : null);
          if (JSON.stringify(target) !== JSON.stringify(upcomingApptRef.current)) setUpcomingAppt(target);

          // Auto-popup review modal for the last completed appointment
          const lastUnratedCompleted = list
            .filter(
              (a) =>
                (a.status || "").toUpperCase() === "COMPLETED" &&
                (!a.rating || !a.rating.score) &&
                !promptedReviewIdsRef.current.has(a._id || a.id)
            )
            .sort((a, b) => new Date(b.updatedAt || b.appointmentDate || b.createdAt || 0) - new Date(a.updatedAt || a.appointmentDate || a.createdAt || 0))[0];

          if (lastUnratedCompleted) {
            promptedReviewIdsRef.current.add(lastUnratedCompleted._id || lastUnratedCompleted.id);
            setReviewModalAppt(lastUnratedCompleted);
          }
        } catch (e) { if (upcomingApptRef.current !== null) setUpcomingAppt(null); }
      } else { if (upcomingApptRef.current !== null) setUpcomingAppt(null); }
    } catch (err) {
      if (!hasCachedData) { setSalons([]); setLoadError(err.message || "Unable to connect"); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, isAuthenticated]);

  useEffect(() => {
    loadData(false);
  }, [selectedCity, isAuthenticated, loadData]);

  useEffect(() => {
    const cleanupSocket = socketClient.onAppointmentStatusChanged(({ appointment }) => {
      loadData(true);
    });
    return () => {
      if (typeof cleanupSocket === "function") cleanupSocket();
    };
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadData(true);
  }, [loadData]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salonId: salon._id || salon.id, salon });
  }, [navigate]);

  const handleSearchClick = useCallback(() => { if (navigate) navigate("Explore"); }, [navigate]);
  const handleBannerPress = useCallback((promo) => {
    if (promo?.salonId) {
      if (navigate) navigate("SalonDetail", { salonId: promo.salonId });
    } else if (promo?.serviceName) {
      if (navigate) navigate("Explore", { search: promo.serviceName });
    } else {
      if (navigate) navigate("Explore");
    }
  }, [navigate]);
  const handleRebook = useCallback(() => {
    if (!navigate) return;
    const apptSalonId =
      upcomingAppt?.salonId?._id ||
      upcomingAppt?.salonId ||
      upcomingAppt?.salon?._id ||
      upcomingAppt?.salon?.id;
    const match = salons.find((s) => String(s._id || s.id) === String(apptSalonId));
    if (match) navigate("SalonDetail", { salon: match });
    else if (salons.length > 0) navigate("SalonDetail", { salon: salons[0] });
    else navigate("Explore");
  }, [salons, navigate, upcomingAppt]);
  const handleExplore = useCallback(() => { if (navigate) navigate("Explore"); }, [navigate]);
  const handleCitySelect = useCallback((city) => { setSelectedCity(city); storage.setItem("@user_selected_city", city); }, []);
  const handleLocationClose = useCallback(() => setLocationModalVisible(false), []);
  const handleLocationClick = useCallback(() => setLocationModalVisible(true), []);
  const handleSearchSubmit = useCallback((term) => { if (navigate) navigate("Explore", { search: term }); }, [navigate]);

  const styles = buildStyles();

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.main} />}
      >
        <Ios26HomeHero
          userName={user?.name}
          selectedCity={selectedCity}
          onSearchClick={handleSearchClick}
          onLocationClick={handleLocationClick}
          onNotificationClick={() => navigate && navigate("NotificationCenter")}
          onFilterPress={() => navigate && navigate("Explore", { openFilter: true })}
          onSearchSubmit={handleSearchSubmit}
        />

        <TopPromoBanner onPressBanner={handleBannerPress} refreshTrigger={refreshing} />

        <QuickRebookWidget
          isAuthenticated={isAuthenticated}
          appointment={upcomingAppt}
          onRebook={handleRebook}
          onViewDetails={() => navigate && navigate("Bookings")}
          onLogin={() => navigate && navigate("Login")}
          onExplore={handleExplore}
        />

        {/* Section: Featured Studios */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleBlock}>
            <Text style={styles.sectionTag}>HANDPICKED</Text>
            <Text style={styles.sectionTitle}>Loved in {selectedCity}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setMapModalVisible(true)} style={styles.buttonSecondary}>
              <Ionicons name="map-outline" size={13} color={C.ink} />
              <Text style={styles.buttonSecondaryText}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyBlock}>
            <ActivityIndicator size="small" color={C.main} />
            <Text style={styles.emptyText}>Loading salons…</Text>
          </View>
        ) : loadError && topRatedSalons.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ionicons name="wifi-outline" size={24} color={C.muted} />
            <Text style={styles.emptyTitle}>Unable to connect</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(false)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : topRatedSalons.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ionicons name="star-outline" size={24} color={C.muted} />
            <Text style={styles.emptyTitle}>No 3+★ salons in {selectedCity}</Text>
            <Text style={styles.emptyText}>Check back soon for top-rated salons.</Text>
          </View>
        ) : (
          <SalonCarousel salons={topRatedSalons} onSalonPress={handleSalonPress} styles={styles} />
        )}

        {/* Section: All Studios (>3 Stars with Pagination) */}
        {topRatedSalons.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTag}>THE FULL LIST</Text>
                <Text style={styles.sectionTitle}>Every salon in {selectedCity}</Text>
              </View>
            </View>

            <SalonVerticalList salons={paginatedSalons} onSalonPress={handleSalonPress} styles={styles} />

            {topRatedSalons.length > paginatedSalons.length ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setPage((p) => p + 1)}
                activeOpacity={0.85}
              >
                <Text style={styles.loadMoreText}>
                  Load More Salons ({topRatedSalons.length - paginatedSalons.length} remaining)
                </Text>
                <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : topRatedSalons.length > PAGE_SIZE ? (
              <View style={styles.endOfListBlock}>
                <Text style={styles.endOfListText}>Showing all {topRatedSalons.length} top-rated salons</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {/* 80px Section rhythm bottom padding per cursor/DESIGN.md */}
        <View style={{ height: S.section }} />
      </ScrollView>

      <LocationPickerModal visible={locationModalVisible} selectedCity={selectedCity} onSelectCity={handleCitySelect} onClose={handleLocationClose} />
      <InteractiveMapModal visible={mapModalVisible} onClose={() => setMapModalVisible(false)} salons={salons} onSelectSalon={handleSalonPress} />
      <AddReviewModal
        visible={!!reviewModalAppt}
        onClose={() => setReviewModalAppt(null)}
        onSubmit={handleAddReviewSubmit}
        appointment={reviewModalAppt}
      />
    </View>
  );
}

export default memo(HomeScreen);

function buildStyles() {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg, // Flat white canvas
  },
  scroller: {
    flex: 1,
  },
  content: {
    paddingBottom: 84,
  },

  // Section Headers per cursor/DESIGN.md
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: S.md,
    marginTop: S.xl,
    marginBottom: S.sm,
  },
  sectionTitleBlock: {
    flex: 1,
  },
  sectionTag: {
    ...TYPO.eyebrow,
    color: C.muted,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: FS.titleLg,
    fontWeight: "400", // Weight 400 per cursor/DESIGN.md
    color: C.ink,
    letterSpacing: -0.32,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },

  // button-secondary spec per cursor/DESIGN.md (white bg, 1px hairline border, 8px radius)
  buttonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.surface,
    paddingHorizontal: S.sm,
    paddingVertical: 6,
    borderRadius: R.md, // 8px radius
    borderWidth: 1,
    borderColor: C.borderDark,
  },
  buttonSecondaryText: {
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
  },

  horizontalCarousel: {
    marginBottom: S.sm,
  },
  verticalList: {
    paddingHorizontal: S.md,
  },

  // Empty / Loading states
  emptyBlock: {
    paddingVertical: S.xxl,
    alignItems: "center",
    marginHorizontal: S.md,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.lg,
    gap: S.xs,
  },
  emptyTitle: {
    fontSize: FS.body,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  emptyText: {
    fontSize: FS.bodySm,
    color: C.body,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: S.xs,
    paddingHorizontal: S.md,
    paddingVertical: 8,
    backgroundColor: C.main, // Cursor Orange
    borderRadius: R.md,
  },
  retryText: {
    color: C.bg,
    fontWeight: FW.medium,
    fontSize: FS.bodySm,
  },

  // Pagination Styles
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.main,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.button,
    marginTop: S.md,
    marginHorizontal: S.md,
  },
  loadMoreText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
  },
  endOfListBlock: {
    alignItems: "center",
    marginTop: S.md,
    paddingVertical: S.xs,
  },
  endOfListText: {
    fontSize: FS.caption,
    color: C.muted,
  },
  });
}
