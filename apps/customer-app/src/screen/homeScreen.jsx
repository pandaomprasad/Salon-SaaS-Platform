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
  Image,
  Dimensions,
} from "react-native";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Ios26HomeHero from "../components/Ios26HomeHero";
import TopPromoBanner from "../components/TopPromoBanner";
import QuickRebookWidget from "../components/QuickRebookWidget";
import SalonCard from "../components/SalonCard";
import * as Location from "expo-location";
import Constants, { ExecutionEnvironment } from "expo-constants";
import PermissionPromptModal from "../components/PermissionPromptModal";
import LocationPickerModal from "../components/LocationPickerModal";
import InteractiveMapModal from "../components/InteractiveMapModal";
import AddReviewModal from "../components/AddReviewModal";
import AppleTouchable from "../components/AppleTouchable";
import ComingSoonLocation from "../components/ComingSoonLocation";
import { browseService } from "../services/browseService";
import { appointmentService } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";
import { storage } from "../services/storage";
import { cleanCityName, getCurrentLocation } from "../services/locationService";
import { useLocationStore } from "../store/useLocationStore";
import { socketClient } from "../services/socketClient";

const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient;
let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch (e) { }
}

const DEFAULT_HERO_BANNERS = [
  {
    _id: "b-1",
    tag: "B E A U T Y · C A R E · Y O U",
    title: "Self Care\nFeels Better",
    subtitle: (city) => `Book trusted salons & beauty experts in ${city}`,
    ctaText: "Book Now",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop",
  },
  {
    _id: "b-2",
    tag: "S P E C I A L  S P A  &  G L O W",
    title: "Radiant Skin\nPure Bliss",
    subtitle: (city) => `Discover rejuvenating facial & spa treatments in ${city}`,
    ctaText: "Explore Offers",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop",
  },
  {
    _id: "b-3",
    tag: "E X P E R T  H A I R  C A R E",
    title: "Fresh Look\nNew Confidence",
    subtitle: (city) => `Top hair stylists and coloring specialists in ${city}`,
    ctaText: "View Salons",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop",
  },
];

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
  if (typeof s.rating === "number" && s.rating > 0) return s.rating;
  if (typeof s.rating === "object" && s.rating !== null) {
    return s.rating.avgScore || s.rating.average || s.rating.score || s.rating.avg || 4.8;
  }
  return s.avgScore || s.avgRating || 4.8;
}

function sanitizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  let cleaned = url.trim();
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) return null;

  if (cleaned.includes("images.unsplash.com")) {
    cleaned = cleaned.replace(/auto=format&?/gi, "");
    if (!cleaned.includes("fm=jpg") && !cleaned.includes("format=jpg")) {
      cleaned += (cleaned.includes("?") ? "&" : "?") + "fm=jpg";
    }
  }

  return cleaned;
}

const PAGE_SIZE = 5;

function HomeScreen({ navigate, onScroll }) {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const initLocation = useLocationStore((state) => state.initLocation);
  const detectCurrentLocation = useLocationStore((state) => state.detectCurrentLocation);
  const initialCleanCity = cleanCityName(selectedCity || "Brahmapur");
  const initialSalons = GLOBAL_SALON_CACHE[initialCleanCity] || [];
  const [salons, setSalons] = useState(initialSalons);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(initialSalons.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [page, setPage] = useState(1);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [permissionModalType, setPermissionModalType] = useState(null); // "location" | "notification" | null
  const [permissionLoading, setPermissionLoading] = useState(false);
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

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = React.useRef(null);

  const displayBanners = React.useMemo(() => {
    return banners && banners.length > 0 ? banners : DEFAULT_HERO_BANNERS;
  }, [banners]);

  useEffect(() => {
    if (!displayBanners || displayBanners.length <= 1) return;

    const screenWidth = Dimensions.get("window").width;
    const interval = setInterval(() => {
      setActiveBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % displayBanners.length;
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [displayBanners]);

  const handleBannerScroll = useCallback((event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const screenWidth = Dimensions.get("window").width;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    if (newIndex >= 0 && newIndex < displayBanners.length) {
      setActiveBannerIndex(newIndex);
    }
  }, [displayBanners.length]);

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
    let active = true;
    const initLocationAndPermissions = async () => {
      try {
        await initLocation();

        // Check Location permission / GPS status
        try {
          const locPerm = await Location.getForegroundPermissionsAsync();
          if (!locPerm.granted && locPerm.canAskAgain) {
            if (active) setPermissionModalType("location");
          }
        } catch (e) { }

        // Check Notification permission
        try {
          if (Notifications) {
            const notifPerm = await Notifications.getPermissionsAsync();
            if (!notifPerm.granted && notifPerm.canAskAgain) {
              if (active) setPermissionModalType("notification");
            }
          }
        } catch (e) { }
      } catch (err) {
        console.warn("📍 [HOME] Auto-location detection fallback:", err.message);
      }
    };
    initLocationAndPermissions();
    return () => { active = false; };
  }, [initLocation]);

  const handleEnablePermission = async () => {
    setPermissionLoading(true);
    if (permissionModalType === "location") {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const geoResult = await getCurrentLocation();
          if (geoResult && geoResult.city) {
            const detectedCity = cleanCityName(geoResult.city);
            setSelectedCity(detectedCity);
            await storage.setItem("@user_selected_city", detectedCity);
          }
        }
      } catch (e) {
        console.warn("Location permission error:", e);
      }

      // Automatically move to Notification permission check if needed
      try {
        if (Notifications) {
          const notifPerm = await Notifications.getPermissionsAsync();
          if (!notifPerm.granted && notifPerm.canAskAgain) {
            setPermissionLoading(false);
            setPermissionModalType("notification");
            return;
          }
        }
      } catch (e) { }

      setPermissionModalType(null);
    } else if (permissionModalType === "notification") {
      try {
        if (Notifications) {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        console.warn("Notification permission error:", e);
      }
      setPermissionModalType(null);
    }
    setPermissionLoading(false);
  };

  const handleSkipPermission = async () => {
    if (permissionModalType === "location") {
      try {
        if (Notifications) {
          const notifPerm = await Notifications.getPermissionsAsync();
          if (!notifPerm.granted && notifPerm.canAskAgain) {
            setPermissionModalType("notification");
            return;
          }
        }
      } catch (e) { }
      setPermissionModalType(null);
    } else {
      setPermissionModalType(null);
    }
  };

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
    const hasCachedData = cachedList.length > 0;
    try {
      setLoadError(null);
      if (!silent && !hasCachedData) setLoading(true);
      const res = await browseService.getSalons({ city: cleanCity });
      const salonList = res.data?.salons || (Array.isArray(res.data) ? res.data : []);
      salonCacheRef.current[cleanCity] = salonList;
      GLOBAL_SALON_CACHE[cleanCity] = salonList;
      setSalons(salonList);

      try {
        const bannerRes = await browseService.getBanners({ city: cleanCity, bypassCache: true });
        const fetchedBanners =
          (Array.isArray(bannerRes?.data) ? bannerRes.data : null) ||
          (Array.isArray(bannerRes?.data?.data) ? bannerRes.data.data : null) ||
          (Array.isArray(bannerRes) ? bannerRes : null) ||
          [];
        console.log(`\n==============================================`);
        console.log(`📱 [CUSTOMER APP HOME SCREEN] Banners received from DB count: ${fetchedBanners.length}`);
        fetchedBanners.forEach((b, i) => {
          console.log(`   [${i + 1}] ID: ${b._id || b.id} | Title: "${b.title}" | PromoCode: "${b.promoCode || 'N/A'}"`);
        });
        console.log(`==============================================\n`);
        setBanners(fetchedBanners);
      } catch (e) {
        console.warn("Failed to fetch banners", e);
      }
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
  const handleBannerPress = useCallback((banner) => {
    if (!navigate) return;
    if (banner._id || banner.id) {
      browseService.trackBannerClick(banner._id || banner.id);
    }
    navigate("BannerDetail", { banner });
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
        {/* NEW HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleLocationClick} style={styles.headerLocation}>
            <Ionicons name="location" size={22} color="#B3261E" />
            <View style={{ marginLeft: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.headerCityText}>{selectedCity}</Text>
                <Ionicons name="chevron-down" size={14} color="#333333" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.headerSubtitleText}>Your beauty destination</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBellBtn} onPress={() => navigate && navigate("NotificationCenter")}>
            <Ionicons name="notifications-outline" size={22} color="#1E1E1E" />
            <View style={styles.headerBellBadge} />
          </TouchableOpacity>
        </View>

        {/* HERO BANNER & CATEGORIES — Only shown when salons are available */}
        {!loading && salons.length === 0 ? null : (
          <>
            {/* HERO BANNER - AUTOMATIC SLIDE */}
            <View style={{ marginBottom: 24 }}>
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
              >
                {displayBanners.map((banner, idx) => {
                  const screenWidth = Dimensions.get("window").width;
                  const cardWidth = screenWidth - 32;
                  const titleText = banner.title || "Self Care\nFeels Better";
                  const subText = typeof banner.subtitle === "function"
                    ? banner.subtitle(selectedCity)
                    : (banner.subtitle || banner.details || `Book trusted salons & beauty experts in ${selectedCity}`);
                  const tagText = banner.tag || banner.eyebrow || "B E A U T Y · C A R E · Y O U";
                  const ctaText = banner.ctaText || "Book Now";

                  const rawImg = banner.imageUrl || banner.image || banner.photoUrl;
                  const bannerImgUri = sanitizeImageUrl(rawImg) || "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&fit=crop&fm=jpg";

                  return (
                    <View key={banner._id || idx} style={{ width: screenWidth, alignItems: "center" }}>
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => handleBannerPress(banner)}
                        style={[
                          styles.heroBannerContainer,
                          { width: cardWidth, marginBottom: 0, marginHorizontal: 0 },
                        ]}
                      >
                        <Image source={{ uri: bannerImgUri }} style={styles.heroBannerImage} resizeMode="cover" />
                        <View style={styles.heroBannerOverlay} pointerEvents="none" />

                        <View style={styles.heroBannerContent}>
                          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                            <Text style={styles.heroEyebrow}>{tagText}</Text>
                            {banner.promoCode ? (
                              <View style={styles.promoCodeBadge}>
                                <Ionicons name="pricetag" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                                <Text style={styles.promoCodeBadgeText}>Code: {banner.promoCode}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.heroTitle}>{titleText}</Text>
                          <Text style={styles.heroSubtitle}>{subText}</Text>

                          <View style={styles.heroBookBtn}>
                            <Text style={styles.heroBookBtnText}>{ctaText}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                          </View>
                        </View>

                        <View style={styles.heroDotsRow}>
                          {displayBanners.map((_, dotIdx) => (
                            <View
                              key={dotIdx}
                              style={[styles.heroDot, dotIdx === activeBannerIndex && styles.heroDotActive]}
                            />
                          ))}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* CATEGORIES */}
            <View style={styles.categoriesContainer}>
              {[
                { id: "haircut", label: "Haircut", icon: "cut-outline", color: "#FCE8E8" },
                { id: "facial", label: "Facial", icon: "happy-outline", color: "#FEF1E6" },
                { id: "makeup", label: "Makeup", icon: "color-wand-outline", color: "#F1EBFC" },
                { id: "massage", label: "Massage", icon: "leaf-outline", color: "#E9F8F1" },
                { id: "nails", label: "Nails", icon: "hand-left-outline", color: "#FDF0F3" },
              ].map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.categoryItem}
                  onPress={() =>
                    navigate && navigate("CategoryDetail", { category: cat.label })
                  }
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={24} color="#1E1E1E" />
                  </View>
                  <Text style={[styles.categoryLabel, idx === 0 && { color: "#B3261E", fontWeight: "700" }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {loading ? (
          <View style={styles.emptyBlock}>
            <ActivityIndicator size="small" color={C.main} />
            <Text style={styles.emptyText}>Loading salons in {selectedCity}…</Text>
          </View>
        ) : salons.length === 0 ? (
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={handleLocationClick}
            onSelectQuickCity={handleCitySelect}
          />
        ) : (
          <>
            {/* Section: Top Rated Salons */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>Top Rated Salons Near You</Text>
              </View>
              <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigate && navigate("AllSalons", { city: selectedCity })}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={14} color="#1E1E1E" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {topRatedSalons.length > 0 ? (
              <SalonCarousel salons={topRatedSalons} onSalonPress={handleSalonPress} styles={styles} />
            ) : null}

            {/* THANK YOU LETTER */}
            <View style={[styles.offerBannerContainer, { backgroundColor: "#F3EBE1", padding: 20, justifyContent: 'center' }]}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#6D554D", letterSpacing: 1.5, marginBottom: 12, textAlign: "center" }}>
                A NOTE FROM US
              </Text>
              <Text style={{ fontSize: 18, fontStyle: "italic", color: "#1E1E1E", lineHeight: 26, textAlign: "center", marginBottom: 12 }}>
                "Thank you for letting us be a part of your beauty journey. We promise to bring you the best experts, the finest salons, and an experience you'll love."
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#5D3B3E", textAlign: "center" }}>
                — The Salon Team
              </Text>
            </View>

            {/* Section: All Studios */}
            {/* <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>Every salon in {selectedCity}</Text>
              </View>
            </View>

            <SalonVerticalList salons={paginatedSalons} onSalonPress={handleSalonPress} styles={styles} /> */}

            {topRatedSalons.length > paginatedSalons.length ? (
              <AppleTouchable
                style={styles.loadMoreBtn}
                onPress={() => setPage((p) => p + 1)}
                scaleTo={0.96}
                hapticType="medium"
              >
                <Text style={styles.loadMoreText}>
                  Load More Salons ({topRatedSalons.length - paginatedSalons.length} remaining)
                </Text>
                <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </AppleTouchable>
            ) : topRatedSalons.length > PAGE_SIZE ? (
              <View style={styles.endOfListBlock}>
                <Text style={styles.endOfListText}>Showing all {topRatedSalons.length} salons</Text>
              </View>
            ) : null}
          </>
        )}

        {/* 80px Section rhythm bottom padding per cursor/DESIGN.md */}
        <View style={{ height: S.section }} />
      </ScrollView>

      <PermissionPromptModal
        visible={!!permissionModalType}
        type={permissionModalType || "location"}
        onEnable={handleEnablePermission}
        onSkip={handleSkipPermission}
        loading={permissionLoading}
      />
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
      paddingBottom: 56,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingHorizontal: S.md,
      marginBottom: S.sm,
    },
    sectionTitleBlock: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: FS.titleLg,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.32,
    },
    seeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#1E1E1E",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 54,
      paddingBottom: 16,
      backgroundColor: "#FFFFFF",
    },
    headerLocation: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerCityText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#1E1E1E",
    },
    headerSubtitleText: {
      fontSize: 12,
      color: "#666666",
      marginTop: 2,
    },
    headerBellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EEEEEE",
      alignItems: "center",
      justifyContent: "center",
    },
    headerBellBadge: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FF3B30",
    },
    heroBannerContainer: {
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: "hidden",
      height: 220,
      backgroundColor: "#F3EBE1",
      marginBottom: 24,
      // shadowColor: "#000",
      // shadowOpacity: 0.3,
      // shadowRadius: 10,
      // elevation: 5,
    },
    heroBannerImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      zIndex: 0,
    },
    heroBannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(245, 239, 230, 0.72)",
      zIndex: 1,
    },
    heroBannerContent: {
      ...StyleSheet.absoluteFillObject,
      padding: 20,
      justifyContent: "center",
      zIndex: 10,
      elevation: 10,
    },
    heroEyebrow: {
      fontSize: 10,
      fontWeight: "700",
      color: "#6D554D",
      letterSpacing: 1.5,
      marginBottom: 0,
    },
    promoCodeBadge: {
      backgroundColor: "rgba(179, 38, 30, 0.90)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },
    promoCodeBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: "#1E1E1E",
      lineHeight: 32,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 12,
      color: "#333333",
      lineHeight: 18,
      marginBottom: 16,
    },
    heroBookBtn: {
      backgroundColor: "#1E1E1E",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
    },
    heroBookBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
    heroDotsRow: {
      flexDirection: "row",
      position: "absolute",
      bottom: 16,
      left: 20,
      gap: 6,
    },
    heroDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(0,0,0,0.2)",
    },
    heroDotActive: {
      width: 16,
      backgroundColor: "#5D3B3E",
    },
    categoriesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    categoryItem: {
      flex: 1,
      alignItems: "center",
    },
    categoryIconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    categoryLabel: {
      fontSize: 12,
      color: "#333333",
      fontWeight: "500",
      textAlign: "center",
    },
    offerBannerContainer: {
      marginHorizontal: 16,
      minHeight: 140,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#FCE8E8",
      marginTop: 16,
      // marginBottom: 24,
    },
    offerBannerImage: {
      ...StyleSheet.absoluteFillObject,
    },
    offerBannerContent: {
      padding: 20,
      justifyContent: "center",
      flex: 1,
      zIndex: 1,
    },
    offerEyebrow: {
      fontSize: 10,
      fontWeight: "700",
      color: "#1E1E1E",
      letterSpacing: 0,
      marginBottom: 6,
    },
    offerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: "#1E1E1E",
      marginBottom: 4,
    },
    offerSubtitle: {
      fontSize: 13,
      color: "#333333",
      marginBottom: 16,
    },
    offerCodeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    offerCodeBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.6)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    offerCodeTextPrefix: {
      fontSize: 11,
      color: "#333333",
      marginRight: 6,
    },
    offerCodeText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#1E1E1E",
    },
    offerArrowBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
