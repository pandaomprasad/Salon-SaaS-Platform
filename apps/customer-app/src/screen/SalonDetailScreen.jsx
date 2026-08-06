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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, S, FS, FW, R, TYPO } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import ServiceCard from "../components/ServiceCard";
import ErrorCardModal from "../components/ErrorCardModal";
import ReviewsSection from "../components/ReviewsSection";
import AddReviewModal from "../components/AddReviewModal";
import { browseService } from "../services/browseService";
import { paiseToINR } from "../services/apiClient";
import { useSharedElement } from "../context/SharedElementContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Warm gold accent reserved for rating & premium touches — used sparingly
const GOLD = "#C7A053";

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

const ServiceList = memo(({ services, selectedService, onSelect }) => {
  return services.map((svc) => (
    <ServiceCard
      key={svc._id || svc.id}
      service={svc}
      selected={(selectedService?._id || selectedService?.id) === (svc._id || svc.id)}
      onSelect={onSelect}
    />
  ));
});

function SalonDetailScreen({ salon, goBack, navigate, onScroll }) {
  const { startSharedTransition, lastBounds } = useSharedElement();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [fetchingSalon, setFetchingSalon] = useState(false);
  const [salonData, setSalonData] = useState(salon);
  const [error, setError] = useState(null);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleOpenAddReview = useCallback(() => {
    if (!isAuthenticated) {
      if (navigate) {
        navigate("Login", { redirectTo: "SalonDetail", redirectData: { salon: salonData } });
      }
      return;
    }
    setShowAddReviewModal(true);
  }, [isAuthenticated, navigate, salonData]);

  const animVal = useRef(new Animated.Value(selectedService ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: selectedService ? 1 : 0,
      tension: 65,
      friction: 9,
      useNativeDriver: false,
    }).start();
  }, [selectedService]);

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

  const salonId = salonData?._id || salonData?.id;
  const favorited = isFavorite(salonId);

  const coverImage = salonData?.coverImage || salonData?.image || HERO_IMAGES[0];
  const rating = (salonData?.rating || 4.9).toFixed(1);

  const handleBack = useCallback(() => {
    if (startSharedTransition && lastBounds) {
      startSharedTransition(
        {
          image: coverImage,
          name: salonData?.name,
          direction: "reverse",
        },
        lastBounds
      );
    }
    if (goBack) goBack();
  }, [goBack, startSharedTransition, lastBounds, coverImage, salonData]);

  useEffect(() => {
    if (!salon?.branches || salon.branches.length === 0) {
      const fetchSalon = async () => {
        setFetchingSalon(true);
        try {
          const salonId = salon._id || salon.id;
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
    const fetchBranchServices = async () => {
      setLoading(true);
      try {
        const branchId = selectedBranch._id || selectedBranch.id || selectedBranch;
        const res = await browseService.getBranchServices(branchId);
        if (cancelled) return;
        const serviceList = res.data?.services || (Array.isArray(res.data) ? res.data : []);
        setServices(serviceList);
      } catch (err) {
        console.log("Error loading services:", err.message);
        if (!cancelled) {
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

  const handleSelectService = useCallback((svc) => {
    setSelectedService((prev) => {
      const prevId = prev?._id || prev?.id;
      const currentId = svc?._id || svc?.id;
      if (prevId && prevId === currentId) {
        return null;
      }
      return svc;
    });
  }, []);

  const handleBranchChange = useCallback((b) => {
    setSelectedBranch(b);
    setSelectedService(null);
  }, []);

  const handleBookNow = useCallback(() => {
    if (!selectedBranch) return;
    const targetService = selectedService || (services.length > 0 ? services[0] : null);
    if (navigate) {
      navigate("Booking", {
        salon: salonData,
        branch: selectedBranch,
        service: targetService,
      });
    }
  }, [selectedService, services, selectedBranch, navigate, salonData]);

  const styles = getStyles();

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
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCardContainer}>
          <Image source={{ uri: coverImage }} style={styles.heroImage} resizeMode="cover" />

          {/* Bottom scrim so overlaid content stays legible on any photo */}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.38)"]}
            start={{ x: 0.5, y: 0.4 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroScrim}
            pointerEvents="none"
          />

          <View style={styles.priceOverlayPill}>
            <Text style={styles.priceOverlayIcon}>✦</Text>
            <View>
              <Text style={styles.priceOverlayAmount}>₹499</Text>
              <Text style={styles.priceOverlayUnit}>per session</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.circleBackBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleHeartBtn}
            onPress={() => toggleFavorite(salonData)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={17}
              color={favorited ? "#E8556B" : "#FFFFFF"}
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
          <Text style={styles.salonTitle}>{salonData?.name}</Text>

          <View style={styles.locationRatingRow}>
            <View style={styles.locationBlock}>
              <Ionicons name="location-sharp" size={13} color={C.muted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedBranch?.address?.city || selectedBranch?.name}
              </Text>
            </View>

            <View style={styles.ratingBlock}>
              <Ionicons name="star" size={13} color={GOLD} />
              <Text style={styles.ratingText}>{rating}</Text>
              <Text style={styles.ratingSubtext}>(142)</Text>
            </View>
          </View>
        </View>

        <View style={styles.hairline} />

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

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>About</Text>
          <Text style={styles.aboutText}>
            {salonData?.description ||
              "This is a perfect place to experience luxury salon services & spa treatments. Comes with private rooms, master stylists, and premium organic products."}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {GALLERY_THUMBNAILS.map((imgUrl, i) => (
              <View key={i} style={styles.galleryThumbWrap}>
                <Image source={{ uri: imgUrl }} style={styles.galleryThumb} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
        </View>

        {fetchingSalon ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={C.main} />
          </View>
        ) : (
          <>
            {branches.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Select location</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchRow}>
                  {branches.map((b) => {
                    const isSelected = (b._id || b.id) === (selectedBranch?._id || selectedBranch?.id);
                    return (
                      <TouchableOpacity
                        key={b._id || b.id}
                        style={[styles.branchPill, isSelected && styles.branchPillSelected]}
                        onPress={() => handleBranchChange(b)}
                        activeOpacity={0.88}
                      >
                        <Text style={[styles.branchTitle, isSelected && styles.branchTitleSelected]}>
                          {b.name || "Main Branch"}
                        </Text>
                        {b.address?.city ? (
                          <Text style={[styles.branchCity, isSelected && styles.branchCitySelected]}>
                            {b.address.city}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Services menu</Text>

              {categories.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabRow}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={styles.catTab}
                        onPress={() => setSelectedCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.catTabText, isSelected && styles.catTabTextSelected]}>
                          {cat === "all" ? "All services" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                        <View style={[styles.catTabUnderline, isSelected && styles.catTabUnderlineActive]} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={C.main} />
                </View>
              ) : filteredServices.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No services listed in this category.</Text>
                </View>
              ) : (
                <ServiceList
                  services={filteredServices}
                  selectedService={selectedService}
                  onSelect={handleSelectService}
                />
              )}
            </View>

            <View style={{ paddingHorizontal: S.md }}>
              <ReviewsSection
                reviews={reviewsList}
                overallRating={rating}
                totalReviews={142}
                onOpenAddReview={handleOpenAddReview}
              />
            </View>
          </>
        )}
      </ScrollView>

      <AddReviewModal
        visible={showAddReviewModal}
        salonName={salonData?.name}
        onClose={() => setShowAddReviewModal(false)}
        onSubmit={async (newReview) => {
          setReviewsList((prev) => [
            {
              id: `user_rev_${Date.now()}`,
              userName: "You",
              rating: newReview.rating,
              comment: newReview.comment,
              date: "Just now",
            },
            ...prev,
          ]);
        }}
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

      <LinearGradient
        colors={["rgba(255,255,255,0)", C.bg, C.bg]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <View style={styles.floatingBottomContainer}>
        <View style={styles.floatingBar}>
          <Animated.View
            style={[
              styles.floatingPriceBlock,
              {
                width: priceWidth,
                opacity: priceOpacity,
                paddingLeft: pricePaddingLeft,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ translateX: priceTranslateX }] }}>
              <Text style={styles.floatingPriceLabel} numberOfLines={1}>
                {selectedService ? selectedService.name : ""}
              </Text>
              <Text style={styles.floatingPriceAmount} numberOfLines={1}>
                {selectedService ? paiseToINR(selectedService.price || 0) : ""}
              </Text>
            </Animated.View>
          </Animated.View>

          <TouchableOpacity
            disabled={!selectedService}
            onPress={handleBookNow}
            activeOpacity={selectedService ? 0.85 : 1}
            style={styles.animatedBookTouchable}
          >
            <View style={styles.animatedBookBtn}>
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: disabledBgOpacity }]}>
                <LinearGradient
                  colors={["#666560", "#4a4945", "#333230"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              <Animated.View style={[StyleSheet.absoluteFill, { opacity: activeBgOpacity }]}>
                <LinearGradient
                  colors={["#3a3a37", "#161614", "#000000"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.bookMainBtnSheen}
                />
              </Animated.View>

              <Text style={styles.animatedBookBtnText}>Book Service</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default memo(SalonDetailScreen);

function getStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    scrollContent: {
      paddingBottom: 120,
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
      height: "45%",
    },
    circleBackBtn: {
      position: "absolute",
      top: Platform.OS === "android" ? 44 : 52,
      left: S.md,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(20, 20, 18, 0.4)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    },
    circleHeartBtn: {
      position: "absolute",
      top: Platform.OS === "android" ? 44 : 52,
      right: S.md,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(20, 20, 18, 0.4)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    },
    priceOverlayPill: {
      position: "absolute",
      bottom: S.md,
      right: S.md,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(15, 15, 13, 0.78)",
      paddingHorizontal: S.sm + 3,
      paddingVertical: 7,
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
      fontWeight: FW.semiBold,
      color: GOLD,
      letterSpacing: 1.6,
      marginBottom: 6,
    },
    salonTitle: {
      fontSize: 25,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.6,
      marginBottom: 8,
    },
    locationRatingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
      fontWeight: FW.semiBold,
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
      fontSize: 15,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: -0.2,
      marginBottom: S.sm + 2,
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
      color: "#FFFFFF",
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
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 5,
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
      paddingVertical: 13,
      borderRadius: 16,
      marginRight: 10,
      borderWidth: 1,
      borderColor: C.border,
      minWidth: 148,
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
      color: "#FFFFFF",
    },
    branchCity: {
      fontSize: 12.5,
      color: C.muted,
      marginTop: 3,
    },
    branchCitySelected: {
      color: "#a8a59c",
    },
    catTabRow: {
      flexDirection: "row",
      marginBottom: S.md,
    },
    catTab: {
      alignItems: "center",
      marginRight: S.lg,
      paddingBottom: 8,
    },
    catTabText: {
      fontSize: 13,
      fontWeight: FW.medium,
      color: C.muted,
      letterSpacing: 0.1,
    },
    catTabTextSelected: {
      color: C.ink,
      fontWeight: "700",
    },
    catTabUnderline: {
      height: 2,
      width: "100%",
      marginTop: 8,
      borderRadius: 1,
      backgroundColor: "transparent",
    },
    catTabUnderlineActive: {
      backgroundColor: GOLD,
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
    bottomFade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 110,
      zIndex: 998,
    },
    floatingBottomContainer: {
      position: "absolute",
      bottom: 20,
      left: S.md,
      right: S.md,
      zIndex: 999,
    },
    floatingBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: C.surface,
      borderRadius: 22,
      padding: 6,
      borderWidth: 1,
      borderColor: C.border,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      overflow: "hidden",
    },
    floatingPriceBlock: {
      justifyContent: "center",
    },
    floatingPriceLabel: {
      fontSize: 11,
      color: C.muted,
      fontWeight: FW.regular,
      marginBottom: 1,
    },
    floatingPriceAmount: {
      fontSize: 20,
      fontWeight: "700",
      color: C.goldBright,
      letterSpacing: -0.3,
    },
    animatedBookTouchable: {
      flex: 1,
      borderRadius: 16,
      overflow: "hidden",
    },
    animatedBookBtn: {
      borderRadius: 16,
      paddingVertical: 13,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      position: "relative",
    },
    animatedBookBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 0.2,
      zIndex: 2,
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
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
  });
}