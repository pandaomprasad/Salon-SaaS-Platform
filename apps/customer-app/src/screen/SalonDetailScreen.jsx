import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Modal,
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import VerifiedBadge from "../components/VerifiedBadge";
import { C, S, FS, FW, R, TYPO, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { BlurView } from 'expo-blur';
import CategoryAccordionList from "../components/CategoryAccordionList";
import AddReviewModal from "../components/AddReviewModal";
import SpringTouchable from "../components/SpringTouchable";
import ServiceCard from "../components/ServiceCard";
import ErrorCardModal from "../components/ErrorCardModal";
import ReviewsSection from "../components/ReviewsSection";
import { ServiceCardSkeleton } from "../components/SkeletonLoader";
import { browseService } from "../services/browseService";
import { paiseToINR } from "../services/apiClient";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import VerifyEmailModal from "../components/VerifyEmailModal";
import ComboServiceModal from "../components/ComboServiceModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Highlight accent reserved for rating & premium touches — used sparingly
const GOLD = C.main;

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop",
];

const AMENITIES = [
  { id: "1", icon: "wifi-outline", label: "Wi-Fi", description: "High-speed complimentary Wi-Fi for all clients" },
  { id: "2", icon: "snow-outline", label: "Air conditioning", description: "Climate-controlled private treatment rooms" },
  { id: "3", icon: "cafe-outline", label: "Beverages", description: "Complimentary green tea, espresso & gourmet coffee" },
  { id: "4", icon: "car-outline", label: "Parking", description: "Reserved valet parking space at salon entrance" },
  { id: "5", icon: "shield-checkmark-outline", label: "Sanitized Equipment", description: "Hospital-grade UV sterilization for all styling equipment" },
  { id: "6", icon: "card-outline", label: "Digital Payments", description: "All major credit cards, UPI, and contactless payments accepted" },
  { id: "7", icon: "sparkles-outline", label: "Private VIP Suite", description: "Exclusive private dressing room for specialized beauty sessions" },
];

const GALLERY_THUMBNAILS = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=300&auto=format&fit=crop",
];

const ServiceList = memo(({ services, selectedServices = [], onSelect, onViewCombo }) => {
  return services.map((svc) => {
    const svcId = svc._id || svc.id;
    const isSelected = selectedServices.some((s) => (s._id || s.id) === svcId);
    return (
      <ServiceCard
        key={svcId}
        service={svc}
        selected={isSelected}
        onSelect={onSelect}
        onViewCombo={onViewCombo}
      />
    );
  });
});

const SqueezingOpenBadge = memo(({ isOpen, styles, isHeaderPill = false }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 0 = close (collapsed dot circle)
    // 1 = open (expanded wide pill)
    animValue.setValue(0);

    // Sequence:
    // 1. Initially 0 (close/dot circle)
    // 2. When opened: animate to 1 (expands open pill)
    // 3. Hold for 1 second (1000ms)
    // 4. After 1 sec: animate back to 0 (squeezes closed into dot circle)
    const animSequence = Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: false,
      }),
      Animated.delay(1000),
      Animated.timing(animValue, {
        toValue: 0,
        duration: 450,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    animSequence.start();

    return () => animSequence.stop();
  }, [isOpen]);

  const containerWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [isHeaderPill ? 24 : 32, isHeaderPill ? 64 : 78],
  });

  const containerPadding = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 9],
  });

  const textWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isHeaderPill ? 34 : 40],
  });

  const textOpacity = animValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const textMarginLeft = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  if (isHeaderPill) {
    return (
      <Animated.View
        key="hdr_badge_v3"
        style={[
          styles.statusBadgePill,
          isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed,
          {
            width: containerWidth,
            height: 24,
            borderRadius: 12,
            paddingHorizontal: containerPadding,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            overflow: "hidden",
          },
        ]}
      >
        <View style={[styles.statusBadgeDot, isOpen ? styles.statusDotOpen : styles.statusDotClosed]} />
        <Animated.View
          style={{
            width: textWidth,
            opacity: textOpacity,
            marginLeft: textMarginLeft,
            overflow: "hidden",
          }}
        >
          <Text
            style={[styles.statusBadgeText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]}
            numberOfLines={1}
          >
            {isOpen ? "OPEN" : "CLOSED"}
          </Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key="hero_badge_v3"
      style={[
        styles.heroStatusBadgePill,
        isOpen ? styles.heroStatusOpen : styles.heroStatusClosed,
        {
          width: containerWidth,
          height: 32,
          borderRadius: 16,
          paddingHorizontal: containerPadding,
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          overflow: "hidden",
        },
      ]}
    >
      <View style={[styles.heroStatusDot, isOpen ? styles.heroDotOpen : styles.heroDotClosed]} />
      <Animated.View
        style={{
          width: textWidth,
          opacity: textOpacity,
          marginLeft: textMarginLeft,
          overflow: "hidden",
        }}
      >
        <Text
          style={[styles.heroStatusText, isOpen ? styles.heroTextOpen : styles.heroTextClosed]}
          numberOfLines={1}
        >
          {isOpen ? "OPEN" : "CLOSED"}
        </Text>
      </Animated.View>
    </Animated.View>
  );
});

function SalonDetailScreen({ salon, goBack, navigate, onScroll }) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(isDark), [isDark]);
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [fetchingSalon, setFetchingSalon] = useState(false);
  const [salonData, setSalonData] = useState(salon);
  const [error, setError] = useState(null);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { user } = useAuth();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeComboService, setActiveComboService] = useState(null);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.durationMinutes || s.duration || 30), 0);
  }, [selectedServices]);

  const handleGetDirections = useCallback(() => {
    const lat = selectedBranch?.coordinates?.coordinates?.[1] || selectedBranch?.latitude || salonData?.latitude || 19.3150;
    const lng = selectedBranch?.coordinates?.coordinates?.[0] || selectedBranch?.longitude || salonData?.longitude || 84.7941;
    const branchTitle = selectedBranch?.name || salonData?.name || "ST CUT Salon";
    const encodedTitle = encodeURIComponent(branchTitle);

    const mapsUrl = Platform.select({
      ios: `maps:0,0?q=${encodedTitle}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedTitle})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    });

    const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedTitle}`;

    Linking.canOpenURL(mapsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mapsUrl);
        } else {
          Linking.openURL(googleMapsWebUrl);
        }
      })
      .catch(() => {
        Linking.openURL(googleMapsWebUrl);
      });
  }, [selectedBranch, salonData]);

  const handleCallSalon = useCallback(() => {
    const phone = selectedBranch?.contactPhone || selectedBranch?.phone || salonData?.contactPhone || "9861012345";
    const telUrl = `tel:${phone.replace(/\s+/g, "")}`;
    Linking.openURL(telUrl).catch((err) => console.log("Call error:", err));
  }, [selectedBranch, salonData]);

  const animVal = useRef(new Animated.Value(selectedServices.length > 0 ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: selectedServices.length > 0 ? 1 : 0,
      tension: 65,
      friction: 9,
      useNativeDriver: false,
    }).start();
  }, [selectedServices]);

  const priceWidth = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 115],
  });

  const priceOpacity = animVal.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });

  const priceTranslateX = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const pricePaddingLeft = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const activeBgOpacity = animVal;

  const disabledBgOpacity = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const slideUpY = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [160, 0],
  });

  const salonId = salonData?._id || salonData?.id;
  const favorited = isFavorite(salonId);

  const coverImage = salonData?.coverImage || salonData?.image || HERO_IMAGES[0];

  const reviewAvg = useMemo(() => {
    if (reviewsList.length === 0) return "0.0";
    const total = reviewsList.reduce((sum, r) => sum + (r.score || r.rating || 0), 0);
    return (total / reviewsList.length).toFixed(1);
  }, [reviewsList]);

  const handleBack = useCallback(() => {
    if (goBack) goBack();
  }, [goBack]);

  useEffect(() => {
    const salonId = salon?._id || salon?.id;
    if (!salonId) return;

    const cachedSalonRes = browseService.getCachedSalonById(salonId);
    if (cachedSalonRes) {
      const fullSalon = cachedSalonRes.data?.salon || cachedSalonRes.data;
      if (fullSalon) setSalonData(fullSalon);
    }

    if (!salon?.branches || salon.branches.length === 0) {
      const fetchSalon = async () => {
        if (!cachedSalonRes) setFetchingSalon(true);
        try {
          const res = await browseService.getSalonById(salonId);
          const fullSalon = res.data?.salon || res.data;
          if (fullSalon) {
            setSalonData(fullSalon);
          }
        } catch (err) {
          console.log("Error fetching salon details:", err.message);
        } finally {
          setFetchingSalon(false);
        }
      };
      fetchSalon();
    }
  }, [salon]);

  const branches = salonData?.branches || [];

  useEffect(() => {
    if (branches.length > 0) {
      setSelectedBranch((prev) => prev || branches[0]);
    }
  }, [branches]);

  useEffect(() => {
    if (!selectedBranch) return;
    let cancelled = false;
    const branchId = selectedBranch._id || selectedBranch.id || selectedBranch;

    // Check client-side memory cache first for instant render (no loading state on re-open!)
    const cachedRes = browseService.getCachedBranchServices(branchId);
    if (cachedRes) {
      const cachedList = cachedRes.data?.services || (Array.isArray(cachedRes.data) ? cachedRes.data : []);
      setServices(cachedList);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchBranchServices = async () => {
      try {
        const res = await browseService.getBranchServices(branchId);
        if (cancelled) return;
        const serviceList = res.data?.services || (Array.isArray(res.data) ? res.data : []);
        setServices(serviceList);
      } catch (err) {
        console.log("Error loading services:", err.message);
        if (!cancelled && !cachedRes) {
          setServices([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBranchServices();
    return () => {
      cancelled = true;
    };
  }, [selectedBranch]);

  useEffect(() => {
    if (!salonId) return;
    let cancelled = false;
    const fetchReviews = async () => {
      try {
        const branchId = selectedBranch?._id || selectedBranch?.id;
        const res = branchId
          ? await browseService.getBranchReviews(branchId)
          : await browseService.getSalonReviews(salonId);
        if (cancelled) return;
        setReviewsList(res.data?.reviews || []);
      } catch (err) {
        console.log("Error loading reviews:", err.message);
        if (!cancelled) setReviewsList([]);
      }
    };
    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [salonId, selectedBranch]);

  const lowestServicePrice = useMemo(() => {
    const servicePrices = services
      .map((s) => s.price)
      .filter((p) => typeof p === "number" && p > 0)
      .map((p) => (p >= 1000 ? p / 100 : p));

    const candidatePrices = [
      ...servicePrices,
      salonData?.minServicePrice ? (salonData.minServicePrice >= 1000 ? salonData.minServicePrice / 100 : salonData.minServicePrice) : null,
      salonData?.startingPrice ? (salonData.startingPrice >= 1000 ? salonData.startingPrice / 100 : salonData.startingPrice) : null,
    ].filter((p) => typeof p === "number" && p > 0);

    if (!candidatePrices.length) return 499;
    return Math.round(Math.min(...candidatePrices));
  }, [services, salonData]);

  const categories = useMemo(() => {
    const set = new Set();
    services.forEach((s) => {
      if (s.category) set.add(s.category.toLowerCase());
    });
    return ["all", ...Array.from(set)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter(
      (s) => s.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [services, selectedCategory]);

  const isOpenStatus = useMemo(() => {
    const target = selectedBranch || salonData;
    if (!target) return { isOpen: true };

    if (
      target.isActive === false ||
      target.deactivatedByAdmin === true ||
      target.isOpen === false ||
      target.status === "CLOSED" ||
      salonData?.isOpen === false
    ) {
      return { isOpen: false, nextOpenText: "Closed right now by management." };
    }

    const workingHours = target.workingHours || salonData?.workingHours;
    if (!Array.isArray(workingHours) || workingHours.length === 0) {
      return { isOpen: true };
    }

    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todayWorking = workingHours.find((w) => w.day === dayOfWeek);
    if (!todayWorking || todayWorking.isOpen === false) {
      let nextDayText = "Closed today. You can still book an advance slot.";
      for (let i = 1; i <= 7; i++) {
        const nextDayIdx = (dayOfWeek + i) % 7;
        const nextWorking = workingHours.find((w) => w.day === nextDayIdx && w.isOpen !== false);
        if (nextWorking) {
          const dayName = i === 1 ? "tomorrow" : `on ${dayNames[nextDayIdx]}`;
          const openT = nextWorking.openTime || "9:00 AM";
          nextDayText = `Opens ${dayName} at ${openT}. Advance booking available.`;
          break;
        }
      }
      return { isOpen: false, nextOpenText: nextDayText };
    }

    if (todayWorking.openTime && todayWorking.closeTime) {
      const [openH, openM] = todayWorking.openTime.split(":").map(Number);
      const [closeH, closeM] = todayWorking.closeTime.split(":").map(Number);
      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);

      if (currentMinutes < openMinutes) {
        return { isOpen: false, nextOpenText: `Opens today at ${todayWorking.openTime}.` };
      }
      if (currentMinutes >= closeMinutes) {
        return { isOpen: false, nextOpenText: `Closed for today (${todayWorking.closeTime}). Opens tomorrow.` };
      }
    }

    return { isOpen: true };
  }, [selectedBranch, salonData]);

  const handleSelectService = useCallback((svc) => {
    setSelectedServices((prev) => {
      const currentId = svc?._id || svc?.id;
      const exists = prev.some((item) => (item._id || item.id) === currentId);
      if (exists) {
        return prev.filter((item) => (item._id || item.id) !== currentId);
      } else {
        return [...prev, svc];
      }
    });
  }, []);

  const handleBranchChange = useCallback((b) => {
    setSelectedBranch(b);
    setSelectedServices([]);
  }, []);

  const handleBookNow = useCallback(() => {
    if (!selectedBranch) return;
    const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);
    if (user && !isVerified) {
      setShowVerifyModal(true);
      return;
    }
    const targetServices = selectedServices.length > 0 ? selectedServices : (services.length > 0 ? [services[0]] : []);
    if (targetServices.length === 0) return;
    if (navigate) {
      navigate("Booking", {
        salon: salonData,
        branch: selectedBranch,
        service: targetServices[0],
        selectedServices: targetServices,
      });
    }
  }, [selectedServices, services, selectedBranch, navigate, salonData, user]);

  return (
    <View style={styles.container}>
      <ErrorCardModal
        visible={!!error}
        title="Salon Error"
        message={error}
        onClose={() => setError(null)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 160 },
        ]}
      >
        <View style={styles.heroCardContainer}>
          <Image source={{ uri: coverImage }} style={styles.heroImage} resizeMode="cover" />

          {/* Bottom scrim so overlaid content stays legible on any photo */}
          <View style={styles.heroScrim} pointerEvents="none" />

          <View style={styles.priceOverlayPill}>
            <Text style={styles.priceOverlayIcon}>✦</Text>
            <Text style={styles.priceOverlayAmount}>₹{lowestServicePrice}</Text>
          </View>

          <TouchableOpacity style={styles.circleBackBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={19} color="#000000ff" />
          </TouchableOpacity>

          {/* Squeezing Open/Closed Badge on Top Hero Image */}
          <SqueezingOpenBadge isOpen={isOpenStatus.isOpen} styles={styles} />

          <TouchableOpacity
            style={styles.circleHeartBtn}
            onPress={() => toggleFavorite(salonData)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={17}
              color={favorited ? C.herat : "#000000ff"}
            />
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4].map((idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === activeImageIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.eyebrowLabel}>SALON & SPA</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Text style={styles.salonTitle}>{salonData?.name}</Text>
            <VerifiedBadge size={20} color={C.verified} />
          </View>

          <View style={styles.locationRatingRow}>
            <View style={styles.locationBlock}>
              <Ionicons name="location-sharp" size={13} color={C.muted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedBranch?.address?.city || selectedBranch?.name}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {/* Squeezing Open / Closed Status Badge in Header */}
              {/* <SqueezingOpenBadge isOpen={isOpenStatus.isOpen} styles={styles} isHeaderPill={true} /> */}

              <View style={styles.ratingBlock}>
                <Ionicons name="star" size={13} color={GOLD} />
                <Text style={styles.ratingText}>{reviewAvg}</Text>
                <Text style={styles.ratingSubtext}>({reviewsList.length})</Text>
              </View>
            </View>
          </View>

          {/* Closed Salon Alert Banner */}
          {!isOpenStatus.isOpen && (
            <View style={styles.closedAlertBanner}>
              <View style={styles.closedAlertIconCircle}>
                <Ionicons name="time" size={18} color="#FF3B30" />
              </View>
              <View style={styles.closedAlertTextStack}>
                <Text style={styles.closedAlertTitle}>Salon is Currently Closed</Text>
                <Text style={styles.closedAlertSub}>
                  {isOpenStatus.nextOpenText || "Closed right now. You can still schedule an advance appointment."}
                </Text>
              </View>
            </View>
          )}

          {/* Quick Actions: Call & Directions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleCallSalon} activeOpacity={0.85}>
              <Ionicons name="call-outline" size={16} color={C.ink} />
              <Text style={styles.quickActionText}>Call Salon</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={handleGetDirections} activeOpacity={0.85}>
              <Ionicons name="navigate-outline" size={16} color={C.ink} />
              <Text style={styles.quickActionText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hairline} />


        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>About</Text>
          <Text style={styles.aboutText}>
            {salonData?.description ||
              "This is a perfect place to experience luxury salon services & spa treatments. Comes with private rooms, master stylists, and premium organic products."}
          </Text>

          {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {GALLERY_THUMBNAILS.map((imgUrl, i) => (
              <View key={i} style={styles.galleryThumbWrap}>
                <Image source={{ uri: imgUrl }} style={styles.galleryThumb} resizeMode="cover" />
              </View>
            ))}
          </ScrollView> */}
        </View>

        {/* Select Branch */}
        {(salonData?.branches || []).length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Select location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchRow}>
              {(salonData?.branches || []).map((b) => {
                const isSelected = (b._id || b.id) === (selectedBranch?._id || selectedBranch?.id);
                const rawName = b.name || "Main Branch";
                const displayTitle = rawName.includes(" — ")
                  ? rawName.split(" — ")[1] || rawName
                  : rawName.includes(" - ")
                    ? rawName.split(" - ")[1] || rawName
                    : rawName;

                return (
                  <TouchableOpacity
                    key={b._id || b.id}
                    style={[styles.branchPill, isSelected && styles.branchPillSelected]}
                    onPress={() => handleBranchChange(b)}
                    activeOpacity={0.88}
                  >
                    <Text style={[styles.branchTitle, isSelected && styles.branchTitleSelected]} numberOfLines={1}>
                      {displayTitle}
                    </Text>
                    {b.address?.city || b.address?.street ? (
                      <Text style={[styles.branchCity, isSelected && styles.branchCitySelected]} numberOfLines={1}>
                        {b.address?.city || b.address?.street}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}



        {/* Services Menu Accordion per reference design */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Services menu</Text>

          {loading ? (
            <View style={{ gap: S.xs }}>
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
            </View>
          ) : (
            <CategoryAccordionList
              services={services}
              selectedServices={selectedServices}
              onSelectService={handleSelectService}
              onViewComboService={setActiveComboService}
            />
          )}
        </View>

        {/* Address & Interactive Map Component */}
        <View style={styles.sectionBlock}>
          <Text style={styles.addressHeaderTitle}>Address</Text>
          <Text style={styles.addressBodyText}>
            {selectedBranch?.address?.street ||
              selectedBranch?.address?.full ||
              salonData?.address?.street ||
              (salonData?.address?.city ? `${salonData?.address?.city}, Odisha` : null) ||
              "6391 Elgin St. Celina, Delaware 10299"}
          </Text>

          <TouchableOpacity
            style={styles.addressMapCard}
            onPress={handleGetDirections}
            activeOpacity={0.92}
          >
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={styles.addressMapOverlay} />

            {/* Center Salon Pin Marker */}
            <View style={styles.addressMapPinCenter}>
              <View style={styles.addressPinBadge}>
                <Ionicons name="location-sharp" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.tapToNavigatePill}>
              <Ionicons name="navigate-outline" size={13} color="#FFFFFF" />
              <Text style={styles.tapToNavigateText}>Tap for Directions</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Amenities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.amenitiesScroll}>
            {AMENITIES.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.amenityItem}
                onPress={() => setShowAmenitiesModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.amenityIconCircle}>
                  <Ionicons name={item.icon} size={17} color={C.ink} />
                </View>
                <Text style={styles.amenityLabel} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.amenityItem}
              onPress={() => setShowAmenitiesModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.amenityIconCircle, styles.moreAmenityCircle]}>
                <Text style={styles.moreAmenityText}>+{AMENITIES.length - 4}</Text>
              </View>
              <Text style={styles.amenityLabel}>More</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>


        {/* Reviews Section */}
        <View style={{ paddingHorizontal: S.md }}>
          <ReviewsSection
            reviews={reviewsList}
            overallRating={reviewAvg}
            totalReviews={reviewsList.length}
            onOpenAddReview={() => setShowReviewModal(true)}
          />
        </View>
      </ScrollView>

      <AddReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={async ({ rating, comment, aspects }) => {
          if (reviewsList.length > 0) {
            const firstAppt = reviewsList[0];
            const apptId = firstAppt._id || firstAppt.id;
            try {
              await appointmentService.rateAppointment(apptId, rating, comment);
            } catch (e) { }
          }
          setShowReviewModal(false);
        }}
        salonName={salonData?.name}
      />

      <Modal
        visible={showAmenitiesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAmenitiesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setShowAmenitiesModal(false)}
          />
          <View style={styles.amenitiesSheetContainer}>
            <View style={styles.dragHandle} />

            <View style={styles.amenitiesHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.amenitiesModalTitle}>Salon Amenities</Text>
                <Text style={styles.amenitiesModalSub}>Available for your comfort & care</Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowAmenitiesModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={C.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.amenitiesListScroll}>
              {AMENITIES.map((item) => (
                <View key={item.id} style={styles.amenityRowCard}>
                  <View style={styles.amenityRowIconCircle}>
                    <Ionicons name={item.icon} size={20} color={C.ink} />
                  </View>
                  <View style={styles.amenityRowTextContent}>
                    <Text style={styles.amenityRowTitle}>{item.label}</Text>
                    <Text style={styles.amenityRowDesc}>{item.description}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.amenitiesGotItBtn}
              onPress={() => setShowAmenitiesModal(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.amenitiesGotItBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Booking Action Bar — Hidden when 0 services, slides up smoothly when >= 1 service selected */}
      <Animated.View
        style={[
          styles.floatingBottomBarWrapper,
          { transform: [{ translateY: slideUpY }] },
        ]}
        pointerEvents={selectedServices.length > 0 ? "auto" : "none"}
      >
        {/* Floating Bottom Booking Action Bar */}
        <BlurView
          intensity={Platform.OS === "ios" ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.floatingBottomBar}
        >
          {/* Solid tint on top of the blur — hides content bleed-through, gives that frosted-white look */}
          <View
            style={[
              styles.floatingBottomBarTint,
              { backgroundColor: isDark ? "rgba(20,20,18,0.55)" : "rgba(255,255,255,0.85)" },
            ]}
            pointerEvents="none"
          />

          <View style={styles.bookRow}>
            <View style={styles.totalBlock}>
              <Text style={styles.totalLabel} numberOfLines={1}>
                {selectedServices.length === 1
                  ? selectedServices[0]?.name || "Service"
                  : selectedServices.length > 1
                    ? `${selectedServices.length} services`
                    : "Total"}
              </Text>
              <Text style={styles.totalAmount}>
                {selectedServices.length > 0 ? paiseToINR(totalPrice) : "₹0.00"}
              </Text>
            </View>

            <SpringTouchable
              onPress={handleBookNow}
              style={styles.animatedBookBtn}
              scaleTo={0.95}
              hapticType="medium"
            >
              <Text style={styles.animatedBookBtnText}>Book now</Text>
            </SpringTouchable>
          </View>
        </BlurView>
      </Animated.View>

      <VerifyEmailModal
        visible={showVerifyModal}
        email={user?.email}
        onClose={() => setShowVerifyModal(false)}
        onVerified={() => setShowVerifyModal(false)}
      />

      <ComboServiceModal
        visible={Boolean(activeComboService)}
        service={activeComboService}
        isSelected={
          activeComboService
            ? selectedServices.some(
                (s) =>
                  (s._id || s.id) === (activeComboService._id || activeComboService.id)
              )
            : false
        }
        onClose={() => setActiveComboService(null)}
        onSelectService={handleSelectService}
      />
    </View>
  );
}

export default memo(SalonDetailScreen);

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    scrollContent: {
      flexGrow: 1,
    },
    heroCardContainer: {
      height: 320,
      width: "100%",
      position: "relative",
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      overflow: "hidden",
      backgroundColor: C.lifted,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroScrim: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "0%",
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    circleBackBtn: {
      position: "absolute",
      top: Platform.OS === "android" ? 44 : 52,
      left: S.md,
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    },
    circleHeartBtn: {
      position: "absolute",
      top: Platform.OS === "android" ? 44 : 52,
      right: S.md,
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    },
    heroStatusBadgePill: {
      position: "absolute",
      top: Platform.OS === "android" ? 44 : 52,
      right: 58,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      paddingHorizontal: 9,
      paddingVertical: 7,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
      zIndex: 10,
    },
    heroStatusOpen: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderWidth: 1,
      borderColor: "rgba(34, 197, 94, 0.35)",
    },
    heroStatusClosed: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderWidth: 1,
      borderColor: "rgba(239, 68, 68, 0.35)",
    },
    heroStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    heroDotOpen: {
      backgroundColor: "#22C55E",
    },
    heroDotClosed: {
      backgroundColor: "#EF4444",
    },
    heroStatusText: {
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    heroTextOpen: {
      color: "#15803D",
    },
    heroTextClosed: {
      color: "#B91C1C",
    },
    priceOverlayPill: {
      position: "absolute",
      bottom: S.md,
      right: S.md,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(15, 15, 13, 0.78)",
      paddingHorizontal: S.sm + 3,
      paddingVertical: 8,
      borderRadius: R.lg,
      gap: 7,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
    },
    priceOverlayIcon: {
      fontSize: 12,
      color: GOLD,
    },
    priceOverlayAmount: {
      color: "#FFFFFF",
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      lineHeight: 16,
    },
    priceOverlayUnit: {
      color: "rgba(255, 255, 255, 0.65)",
      fontSize: 10,
      lineHeight: 12,
    },
    dotsRow: {
      position: "absolute",
      bottom: S.md,
      left: S.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      display: "none",
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: "rgba(255,255,255,0.5)",
    },
    dotActive: {
      backgroundColor: "#FFFFFF",
      width: 14,
      height: 5,
      borderRadius: 2.5,
    },
    titleSection: {
      paddingHorizontal: S.md,
      marginTop: S.lg,
      marginBottom: S.md,
    },
    eyebrowLabel: {
      fontSize: 10.5,
      fontWeight: FW.bold,
      color: GOLD,
      letterSpacing: 1.6,
      marginBottom: 6,
    },
    salonTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 26,
      fontWeight: FW.bold,
      color: C.ink,
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    locationRatingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusBadgePill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: R.pill,
      gap: 5,
    },
    statusBadgeOpen: {
      backgroundColor: isDark ? "rgba(34, 197, 94, 0.16)" : "#E8F8EE",
      borderWidth: 1,
      borderColor: isDark ? "rgba(34, 197, 94, 0.3)" : "#C3F0D3",
    },
    statusBadgeClosed: {
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.16)" : "#FEE2E2",
      borderWidth: 1,
      borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA",
    },
    statusBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusDotOpen: {
      backgroundColor: "#22C55E",
    },
    statusDotClosed: {
      backgroundColor: "#EF4444",
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    statusTextOpen: {
      color: isDark ? "#4ADE80" : "#15803D",
    },
    statusTextClosed: {
      color: isDark ? "#FCA5A5" : "#B91C1C",
    },
    closedAlertBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 59, 48, 0.14)" : "#FFF2F2",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 59, 48, 0.35)" : "#FFCACA",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 14,
      marginBottom: 4,
      gap: 12,
    },
    closedAlertIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? "rgba(255, 59, 48, 0.22)" : "#FFE5E5",
      alignItems: "center",
      justifyContent: "center",
    },
    closedAlertTextStack: {
      flex: 1,
    },
    closedAlertTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: "#FF3B30",
      letterSpacing: -0.1,
    },
    closedAlertSub: {
      fontSize: 12,
      fontWeight: "500",
      color: isDark ? "#E5E5EA" : "#555555",
      marginTop: 2,
      lineHeight: 16,
    },
    locationBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
      paddingRight: S.sm,
    },
    locationText: {
      fontSize: FS.sub,
      color: C.muted,
      fontWeight: FW.regular,
    },
    ratingBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: C.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: C.border,
    },
    ratingText: {
      fontSize: FS.bodySm,
      fontWeight: FW.bold,
      color: C.ink,
    },
    ratingSubtext: {
      fontSize: 11,
      color: C.muted,
    },
    hairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border,
      marginHorizontal: S.md,
      marginBottom: S.md,
    },
    sectionBlock: {
      paddingHorizontal: S.md,
      marginBottom: S.lg + 2,
    },
    sectionLabel: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 18,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.2,
      marginBottom: S.sm + 2,
    },
    addressHeaderTitle: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 18,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    addressBodyText: {
      fontSize: 13.5,
      fontWeight: "500",
      color: C.muted,
      lineHeight: 20,
      marginBottom: 12,
    },
    addressMapCard: {
      height: 185,
      borderRadius: 24,
      overflow: "hidden",
      position: "relative",
      borderWidth: 1,
      borderColor: isDark ? "#2C2C34" : "#E5E5EB",
    },
    addressMapOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(18,18,22,0.35)" : "rgba(240,240,245,0.1)",
    },
    addressMapPinCenter: {
      position: "absolute",
      top: "38%",
      left: "44%",
      alignItems: "center",
    },
    addressPinBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 2.5,
      borderColor: "#FFFFFF",
    },
    tapToNavigatePill: {
      position: "absolute",
      bottom: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(24, 24, 27, 0.85)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      gap: 5,
    },
    tapToNavigateText: {
      color: "#FFFFFF",
      fontSize: 11.5,
      fontWeight: "600",
    },
    amenitiesScroll: {
      flexDirection: "row",
    },
    amenityItem: {
      alignItems: "center",
      width: 66,
      marginRight: S.sm,
    },
    amenityIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: 6,
    },
    moreAmenityCircle: {
      backgroundColor: C.ink,
      borderColor: C.ink,
    },
    amenityLabel: {
      fontSize: 11,
      color: C.body,
      fontWeight: FW.medium,
      textAlign: "center",
    },
    moreAmenityText: {
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      color: C.bg,
    },
    aboutText: {
      fontSize: FS.bodySm,
      color: C.body,
      lineHeight: 22,
      marginBottom: S.md,
    },
    galleryScroll: {
      marginTop: S.xs,
    },
    galleryThumbWrap: {
      borderRadius: R.md + 2,
      marginRight: S.sm,
    },
    galleryThumb: {
      width: 100,
      height: 72,
      borderRadius: R.md + 2,
      backgroundColor: C.bone,
    },
    loadingBox: {
      padding: S.xl,
      alignItems: "center",
    },
    branchRow: {
      flexDirection: "row",
    },
    branchPill: {
      backgroundColor: C.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 10,
      borderWidth: 1,
      borderColor: C.border,
      minWidth: 120,
      maxWidth: 240,
    },
    branchPillSelected: {
      backgroundColor: C.ink,
      borderColor: C.ink,
    },
    branchPillHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    branchCheckDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: GOLD,
      alignItems: "center",
      justifyContent: "center",
    },
    branchTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.2,
    },
    branchTitleSelected: {
      color: C.bg,
    },
    branchCity: {
      fontSize: 12,
      color: C.muted,
      marginTop: 3,
    },
    branchCitySelected: {
      color: C.bg,
    },
    catTabRow: {
      flexDirection: "row",
      marginBottom: S.md,
    },
    catTabPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 14,
      marginRight: 6,
    },
    catTabText: {
      fontSize: 13,
      letterSpacing: 0.1,
    },
    emptyCard: {
      padding: S.lg,
      backgroundColor: C.surface,
      borderRadius: R.lg,
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    emptyText: {
      color: C.muted,
      fontSize: FS.bodySm,
    },
    // Outer wrapper carries the shadow — NOT clipped, so Android elevation renders cleanly
    // Outer wrapper carries the shadow — NOT clipped, so Android elevation renders cleanly
    // Outer wrapper carries the shadow — NOT clipped, so Android elevation renders cleanly
    floatingBottomBarWrapper: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 10,
    },
    // Inner container matching BookingScreen bottom bar design
    floatingBottomBar: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: Platform.OS === "ios" ? 28 : 20,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2A2A2C" : "#F0F1F5",
      overflow: "hidden",
    },
    floatingBottomBarTint: {
      ...StyleSheet.absoluteFillObject,
    },
    bookRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 1, // sit above the tint layer
    },
    totalBlock: {
      flex: 1,
      marginRight: 12,
      justifyContent: "center",
    },
    totalLabel: {
      fontSize: 12.5,
      color: isDark ? "#94A3B8" : "#64748B",
      fontWeight: "600",
      marginBottom: 2,
    },
    totalAmount: {
      fontSize: 20,
      fontWeight: FW.bold,
      color: C.ink,
      letterSpacing: -0.3,
    },
    animatedBookBtn: {
      height: 52,
      paddingHorizontal: 28,
      borderRadius: 26,
      backgroundColor: C.purple || "#6C5CE7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: C.purple || "#6C5CE7",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    animatedBookBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: FW.bold,
      letterSpacing: 0.2,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },
    modalBackdropTouch: {
      ...StyleSheet.absoluteFillObject,
    },
    amenitiesSheetContainer: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: S.lg,
      paddingTop: S.md,
      paddingBottom: Platform.OS === "ios" ? 36 : 24,
      maxHeight: "82%",
      borderWidth: 1,
      borderColor: C.border,
    },
    dragHandle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.border,
      alignSelf: "center",
      marginBottom: S.md,
    },
    amenitiesHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: S.md,
    },
    amenitiesModalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.4,
    },
    amenitiesModalSub: {
      fontSize: 12.5,
      color: C.muted,
      marginTop: 2,
    },
    modalCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.bg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    amenitiesListScroll: {
      marginBottom: S.md,
    },
    amenityRowCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.bg,
      padding: S.md,
      borderRadius: 16,
      marginBottom: S.xs + 2,
      borderWidth: 1,
      borderColor: C.border,
    },
    amenityRowIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: S.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    amenityRowTextContent: {
      flex: 1,
      marginRight: S.sm,
    },
    amenityRowTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: C.ink,
    },
    amenityRowDesc: {
      fontSize: 12,
      color: C.muted,
      marginTop: 2,
      lineHeight: 16,
    },
    amenitiesGotItBtn: {
      backgroundColor: C.ink,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    amenitiesGotItBtnText: {
      color: C.bg,
      fontSize: 15,
      fontWeight: "600",
    },
    quickActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: S.sm,
    },
    quickActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.surface,
      borderRadius: 14,
      paddingVertical: 12,
      gap: 7,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    quickActionText: {
      fontSize: 13,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
  });
}