// src/screen/SalonDetailScreen.jsx
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import ServiceCard from "../components/ServiceCard";
import ErrorCardModal from "../components/ErrorCardModal";
import ReviewsSection from "../components/ReviewsSection";
import AddReviewModal from "../components/AddReviewModal";
import { browseService } from "../services/browseService";
import { useSharedElement } from "../context/SharedElementContext";
import { useFavorites } from "../context/FavoritesContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop",
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
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [fetchingSalon, setFetchingSalon] = useState(false);
  const [salonData, setSalonData] = useState(salon);
  const [error, setError] = useState(null);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);

  const salonId = salonData?._id || salonData?.id;
  const favorited = isFavorite(salonId);

  const coverImage = salonData?.coverImage || salonData?.image || HERO_IMAGES[0];
  const rating = (salonData?.rating || 4.8).toFixed(1);

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
          setError(err.message || "Failed to load services for this branch.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBranchServices();
    return () => { cancelled = true; };
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
    setSelectedService(svc);
  }, []);

  const handleBranchChange = useCallback((b) => {
    setSelectedBranch(b);
    setSelectedService(null);
  }, []);

  const handleBookNow = useCallback(() => {
    if (!selectedService || !selectedBranch) return;
    if (navigate) {
      navigate("Booking", {
        salon: salonData,
        branch: selectedBranch,
        service: selectedService,
      });
    }
  }, [selectedService, selectedBranch, navigate, salonData]);

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
        {/* Minimal Cover Hero Card */}
        <View style={styles.heroCardContainer}>
          <Image source={{ uri: coverImage }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradient} />

          {/* Minimal Floating Back Pill */}
          <TouchableOpacity style={styles.backPill} onPress={handleBack} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Favorite Heart Button */}
          <TouchableOpacity
            style={styles.heartPill}
            onPress={() => toggleFavorite(salonData)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={18}
              color={favorited ? "#EF4444" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Minimal Salon Title Block */}
        <View style={styles.headerTitleBlock}>
          <Text style={styles.studioLabel}>BOUTIQUE STUDIO</Text>
          <Text style={styles.salonTitle}>{salonData?.name || "Salon Details"}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingMeta}>
              <Text style={styles.starText}>★</Text>
              <Text style={styles.ratingNumber}>{rating}</Text>
              <Text style={styles.metaSub}>(140+ reviews)</Text>
            </View>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.metaSub}>
              {selectedBranch?.address?.city || "Mumbai"}
            </Text>
          </View>

          {salonData?.description ? (
            <Text style={styles.salonDescription} numberOfLines={2}>
              {salonData.description}
            </Text>
          ) : null}
        </View>

        {fetchingSalon ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1A1A1A" />
          </View>
        ) : (
          <>
            {/* Minimal Branch Location Selector */}
            {branches.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>LOCATION</Text>
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

            {/* Service Category Minimal Filter Tabs */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>SERVICES MENU</Text>

              {categories.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabRow}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catTab, isSelected && styles.catTabSelected]}
                        onPress={() => setSelectedCategory(cat)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.catTabText, isSelected && styles.catTabTextSelected]}>
                          {cat === "all" ? "ALL SERVICES" : cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}

              {/* Service Cards List */}
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#1A1A1A" />
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

            {/* Client Reviews & Feedback Section */}
            <View style={{ paddingHorizontal: 20 }}>
              <ReviewsSection
                reviews={reviewsList}
                overallRating={rating}
                totalReviews={142}
                onOpenAddReview={() => setShowAddReviewModal(true)}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Review Modal */}
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

      {/* Ultra-Sleek Floating Bottom Action Pill */}
      {selectedService ? (
        <View style={styles.floatingActionCapsule}>
          <View style={styles.barInfo}>
            <Text style={styles.barServiceName} numberOfLines={1}>
              {selectedService.name}
            </Text>
            <Text style={styles.barMetaText}>
              {selectedService.durationMinutes || selectedService.duration || 30} mins
            </Text>
          </View>

          <TouchableOpacity style={styles.proceedBtn} onPress={handleBookNow} activeOpacity={0.88}>
            <Text style={styles.proceedBtnText}>Proceed →</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default memo(SalonDetailScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg, // Canvas warm cream #f7f7f4
  },
  scroller: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 110,
  },
  heroCardContainer: {
    height: 240,
    marginHorizontal: S.md,
    marginTop: Platform.OS === "android" ? 44 : 52,
    borderRadius: R.lg, // 12px radius per cursor/DESIGN.md
    overflow: "hidden",
    position: "relative",
    backgroundColor: C.ink,
    borderWidth: 1,
    borderColor: C.border,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backPill: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(38, 37, 30, 0.75)",
    paddingHorizontal: S.md,
    paddingVertical: 6,
    borderRadius: R.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
  heartPill: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: "rgba(38, 37, 30, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Header Title Block
  headerTitleBlock: {
    marginHorizontal: S.md,
    marginTop: S.md,
    marginBottom: S.lg,
  },
  studioLabel: {
    ...TYPO.eyebrow,
    color: C.main,
    marginBottom: 4,
  },
  salonTitle: {
    fontSize: 26,
    fontWeight: "400", // Display 400 per cursor/DESIGN.md
    color: C.ink,
    letterSpacing: -0.52,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  ratingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  starText: {
    color: "#c08532",
    fontSize: 13,
    fontWeight: FW.semiBold,
  },
  ratingNumber: {
    fontSize: FS.bodySm,
    fontWeight: FW.semiBold,
    color: C.ink,
  },
  metaSub: {
    fontSize: FS.bodySm,
    color: C.body,
  },
  dotSeparator: {
    fontSize: 12,
    color: C.muted,
  },
  salonDescription: {
    fontSize: FS.bodySm,
    lineHeight: 20,
    color: C.body,
    marginTop: S.xs,
  },

  // Sections
  section: {
    marginHorizontal: S.md,
    marginBottom: S.lg,
  },
  sectionHeading: {
    ...TYPO.eyebrow,
    marginBottom: S.sm,
  },

  // Branch Selector
  branchRow: {
    flexDirection: "row",
  },
  branchPill: {
    backgroundColor: C.surface,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: R.md, // 8px radius
    marginRight: S.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  branchPillSelected: {
    backgroundColor: C.main,
    borderColor: C.main,
  },
  branchTitle: {
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
    color: C.ink,
  },
  branchTitleSelected: {
    color: "#FFFFFF",
  },
  branchCity: {
    fontSize: FS.caption,
    color: C.muted,
    marginTop: 2,
  },
  branchCitySelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Category Filter Tabs
  catTabRow: {
    flexDirection: "row",
    marginBottom: S.md,
  },
  catTab: {
    paddingHorizontal: S.md,
    paddingVertical: 8,
    borderRadius: R.md,
    backgroundColor: C.surface,
    marginRight: S.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  catTabSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  catTabText: {
    fontSize: 11,
    fontWeight: FW.semiBold,
    color: C.ink,
    letterSpacing: 0.88,
  },
  catTabTextSelected: {
    color: "#FFFFFF",
  },

  // Loading & Empty States
  loadingBox: {
    padding: S.xl,
    alignItems: "center",
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

  // Floating Bottom Action Pill (cursor/DESIGN.md spec: 8px radius button)
  floatingActionCapsule: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: C.ink,
    paddingHorizontal: S.md,
    paddingVertical: S.sm + 2,
    borderRadius: R.md, // 8px radius per cursor/DESIGN.md
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: C.borderDark,
  },
  barInfo: {
    flex: 1,
    marginRight: S.sm,
  },
  barServiceName: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
  barMetaText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: FS.caption,
    marginTop: 2,
  },
  proceedBtn: {
    backgroundColor: C.main, // Cursor Orange
    paddingHorizontal: S.md,
    paddingVertical: 8,
    borderRadius: R.md,
  },
  proceedBtnText: {
    color: "#FFFFFF",
    fontSize: FS.bodySm,
    fontWeight: FW.medium,
  },
});
