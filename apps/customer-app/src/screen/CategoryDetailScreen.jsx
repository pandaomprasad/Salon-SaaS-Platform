// src/screen/CategoryDetailScreen.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocationStore } from "../store/useLocationStore";
import { browseService } from "../services/browseService";
import { cleanCityName } from "../services/locationService";
import { useFavorites } from "../context/FavoritesContext";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";

const CATEGORY_CONFIGS = {
  haircut: {
    title: "Haircut",
    subtitle: "Stylish cuts for a better you",
    eyebrow: "HAIRCUT",
    heroTitle: "Fresh Look\nNew You",
    heroDesc: (city) => `Get stylish haircuts from expert professionals in ${city}`,
    badge: "Good Hair\nBetter Mood",
    heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    tags: ["Men's Haircut", "Beard Styling", "Hair Spa", "Hair Color"],
  },
  facial: {
    title: "Facial",
    subtitle: "Glow & revitalize your skin",
    eyebrow: "FACIAL & CARE",
    heroTitle: "Radiant Skin\nPure Bliss",
    heroDesc: (city) => `Discover rejuvenating facial treatments in ${city}`,
    badge: "Glow From\nWithin",
    heroImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    tags: ["Clean Up", "Fruit Facial", "Gold Facial", "Anti-Aging"],
  },
  makeup: {
    title: "Makeup",
    subtitle: "Glamour for every occasion",
    eyebrow: "MAKEUP ARTISTRY",
    heroTitle: "Flawless Beauty\nUnmatched Style",
    heroDesc: (city) => `Book professional makeup artists in ${city}`,
    badge: "Own Your\nGlam",
    heroImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
    tags: ["Bridal Makeup", "Party Makeup", "HD Makeup", "Eye Styling"],
  },
  massage: {
    title: "Massage",
    subtitle: "Relaxation & therapeutic therapy",
    eyebrow: "BODY & MASSAGE",
    heroTitle: "Unwind & Reset\nYour Mind",
    heroDesc: (city) => `Premium body spa & massage therapy in ${city}`,
    badge: "Ultimate\nRelaxation",
    heroImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    tags: ["Swedish Massage", "Deep Tissue", "Head Massage", "Aroma Spa"],
  },
  nails: {
    title: "Nails",
    subtitle: "Artistic nail care & extensions",
    eyebrow: "NAIL ART & CARE",
    heroTitle: "Perfect Nails\nBold Statements",
    heroDesc: (city) => `Top nail art salons & manicure experts in ${city}`,
    badge: "Nail Magic\nEvery Day",
    heroImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    tags: ["Nail Art", "Gel Polish", "Manicure", "Pedicure"],
  },
};

const SAMPLE_SALONS = [
  {
    id: "s-1",
    _id: "s-1",
    name: "Royal Cut Luxury Salon & Spa",
    isVerified: true,
    isPopular: true,
    rating: { avgScore: 4.8, totalReviews: 1200 },
    address: { formattedAddress: "Brahmapur Main Road" },
    distance: "1.2 km",
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    tags: ["Men's Haircut", "Beard Styling", "Hair Spa"],
    audience: "Men",
    startingPrice: 350,
  },
  {
    id: "s-2",
    _id: "s-2",
    name: "Urban Edge Unisex Salon",
    isVerified: true,
    isPopular: false,
    rating: { avgScore: 4.6, totalReviews: 856 },
    address: { formattedAddress: "City Centre, Brahmapur" },
    distance: "1.8 km",
    coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    tags: ["Haircut", "Hair Color", "Styling"],
    audience: "Unisex",
    startingPrice: 300,
  },
  {
    id: "s-3",
    _id: "s-3",
    name: "Looks Family Salon",
    isVerified: true,
    isPopular: false,
    rating: { avgScore: 4.4, totalReviews: 642 },
    address: { formattedAddress: "Gosani Nuagaon" },
    distance: "2.1 km",
    coverImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
    tags: ["Haircut", "Kids Haircut", "Hair Spa"],
    audience: "Kids",
    startingPrice: 250,
  },
  {
    id: "s-4",
    _id: "s-4",
    name: "Style Hub Salon",
    isVerified: false,
    isPopular: false,
    rating: { avgScore: 4.3, totalReviews: 530 },
    address: { formattedAddress: "Berhampur Bypass" },
    distance: "2.8 km",
    coverImage: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
    tags: ["Haircut", "Beard Styling", "Hair Treatment"],
    audience: "Men",
    startingPrice: 280,
  },
  {
    id: "s-5",
    _id: "s-5",
    name: "Glow & Radiance Skincare Clinic",
    isVerified: true,
    isPopular: true,
    rating: { avgScore: 4.9, totalReviews: 940 },
    address: { formattedAddress: "Silk City Square, Brahmapur" },
    distance: "3.2 km",
    coverImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    tags: ["Fruit Facial", "Clean Up", "Gold Facial"],
    audience: "Women",
    startingPrice: 500,
  },
  {
    id: "s-6",
    _id: "s-6",
    name: "Velvet Makeup Studio",
    isVerified: true,
    isPopular: false,
    rating: { avgScore: 4.7, totalReviews: 480 },
    address: { formattedAddress: "Gandhi Nagar 1st Lane, Brahmapur" },
    distance: "3.8 km",
    coverImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
    tags: ["Bridal Makeup", "Party Makeup", "HD Makeup"],
    audience: "Women",
    startingPrice: 1500,
  },
  {
    id: "s-7",
    _id: "s-7",
    name: "Zenith Body Spa & Massage Center",
    isVerified: true,
    isPopular: true,
    rating: { avgScore: 4.8, totalReviews: 710 },
    address: { formattedAddress: "Engineering School Road, Brahmapur" },
    distance: "4.1 km",
    coverImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    tags: ["Swedish Massage", "Deep Tissue", "Head Massage"],
    audience: "Unisex",
    startingPrice: 800,
  },
  {
    id: "s-8",
    _id: "s-8",
    name: "Polished Nail Art Studio",
    isVerified: true,
    isPopular: false,
    rating: { avgScore: 4.6, totalReviews: 390 },
    address: { formattedAddress: "Prem Nagar Main Road, Brahmapur" },
    distance: "4.5 km",
    coverImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    tags: ["Nail Art", "Gel Polish", "Manicure"],
    audience: "Women",
    startingPrice: 400,
  },
];

function isSalonInCategory(s, catName) {
  if (!catName) return true;
  const target = catName.toLowerCase().trim();

  const keywordsMap = {
    haircut: ["haircut", "hair cut", "hair", "barber", "cut", "trim", "beard", "styling"],
    facial: ["facial", "clean up", "skin", "face", "glow", "bleach", "derma"],
    makeup: ["makeup", "bridal", "party makeup", "cosmetic", "glam", "eye makeup"],
    massage: ["massage", "spa", "body spa", "therapy", "head massage", "wellness"],
    nails: ["nail", "manicure", "pedicure", "gel polish", "nail art", "extensions"],
  };

  const keywords = keywordsMap[target] || [target];

  // 1. Check tags / categories array
  const tags = s.tags || s.categories || [];
  const matchesTag = tags.some((t) =>
    keywords.some((kw) => (t || "").toLowerCase().includes(kw))
  );
  if (matchesTag) return true;

  // 2. Check name / description
  const nameDesc = `${s.name || ""} ${s.description || ""}`.toLowerCase();
  const matchesNameDesc = keywords.some((kw) => nameDesc.includes(kw));
  if (matchesNameDesc) return true;

  // 3. Check attached services if any
  if (Array.isArray(s.services)) {
    const matchesServices = s.services.some((svc) => {
      const sName = (svc.name || "").toLowerCase();
      const sCat = (svc.category || "").toLowerCase();
      return keywords.some((kw) => sName.includes(kw) || sCat.includes(kw));
    });
    if (matchesServices) return true;
  }

  return false;
}

export default function CategoryDetailScreen({ goBack, navigate, routeParams = {} }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedCity = useLocationStore((state) => state.selectedCity) || "Brahmapur";
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const categoryName = routeParams?.category || routeParams?.search || "Haircut";
  const configKey = categoryName.toLowerCase();
  const config = CATEGORY_CONFIGS[configKey] || {
    title: categoryName,
    subtitle: `Stylish ${categoryName.toLowerCase()} services near you`,
    eyebrow: categoryName.toUpperCase(),
    heroTitle: `Fresh Look\nNew You`,
    heroDesc: (city) => `Get top-rated ${categoryName.toLowerCase()} services from professionals in ${city}`,
    badge: "Good Hair\nBetter Mood",
    heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    tags: [categoryName, "Styling", "Treatment", "Grooming"],
  };

  const [activeAudience, setActiveAudience] = useState("Men");
  const [activeSort, setActiveSort] = useState("Recommended");
  const [isNearMe, setIsNearMe] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const isCityEmpty = !loading && salons.length === 0;

  // Fetch real salons from browseService if available and filter strictly by category
  useEffect(() => {
    let isMounted = true;
    async function loadSalons() {
      setLoading(true);
      try {
        const cleanCity = cleanCityName(selectedCity);
        const res = await browseService.getSalons({ city: cleanCity, category: categoryName });
        const fetched = res.data?.salons || (Array.isArray(res.data) ? res.data : []);

        if (isMounted && fetched.length > 0) {
          const mapped = fetched.map((s, idx) => ({
            id: s._id || s.id || `s-${idx}`,
            _id: s._id || s.id,
            name: s.name,
            isVerified: true,
            isPopular: idx === 0,
            rating: s.rating || { avgScore: 4.5, totalReviews: 320 },
            address: s.address || { formattedAddress: s.city || selectedCity },
            distance: s.distance || `${(1.2 + idx * 0.5).toFixed(1)} km`,
            coverImage: s.coverImage || SAMPLE_SALONS[idx % SAMPLE_SALONS.length].coverImage,
            tags: s.categories || s.tags || config.tags,
            audience: idx % 2 === 0 ? "Men" : "Unisex",
            startingPrice: s.startingPrice || 300,
            services: s.services || [],
          }));

          const categoryFiltered = mapped.filter((s) => isSalonInCategory(s, categoryName));
          setSalons(categoryFiltered.length > 0 ? categoryFiltered : mapped);
        } else if (isMounted) {
          if (selectedCity && selectedCity.toLowerCase() !== "brahmapur") {
            setSalons([]);
          } else {
            const fallbackFiltered = SAMPLE_SALONS.filter((s) => isSalonInCategory(s, categoryName));
            setSalons(fallbackFiltered);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch salons for category screen:", err);
        if (isMounted) {
          if (selectedCity && selectedCity.toLowerCase() !== "brahmapur") {
            setSalons([]);
          } else {
            const fallbackFiltered = SAMPLE_SALONS.filter((s) => isSalonInCategory(s, categoryName));
            setSalons(fallbackFiltered);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSalons();
    return () => { isMounted = false; };
  }, [selectedCity, categoryName]);

  // Audience options
  const audienceOptions = ["Men", "Women", "Kids", "Unisex"];

  // Filtering logic
  const filteredSalons = useMemo(() => {
    return salons.filter((s) => {
      // Category filter safety check
      if (!isSalonInCategory(s, categoryName)) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesAddress = (s.address?.formattedAddress || "").toLowerCase().includes(q);
        const matchesTag = s.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesAddress && !matchesTag) return false;
      }

      // Audience filter
      if (activeAudience && activeAudience !== "Unisex") {
        if (s.audience && s.audience !== activeAudience && s.audience !== "Unisex") {
          return false;
        }
      }

      // Rating filter
      if (ratingFilter) {
        const score = s.rating?.avgScore || s.rating?.rating || 0;
        if (score < ratingFilter) return false;
      }
      return true;
    });
  }, [salons, categoryName, searchQuery, activeAudience, ratingFilter]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) {
      navigate("SalonDetail", { salonId: salon._id || salon.id, salon });
    }
  }, [navigate]);

  const handleBookNow = useCallback((salon) => {
    if (navigate) {
      navigate("Booking", { salon });
    }
  }, [navigate]);

  const styles = buildStyles(isDark);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121218" : "#FAFAFB" }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121218" : "#FAFAFB"} />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={isDark ? "#FFFFFF" : "#18181B"} />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <Text style={styles.headerSubtitle}>{config.subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.searchIconBtn}
          onPress={() => setIsSearching((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons name={isSearching ? "close" : "search-outline"} size={20} color={isDark ? "#FFFFFF" : "#18181B"} />
        </TouchableOpacity>
      </View>

      {/* Search Input Box (Collapsible) */}
      {isSearching && (
        <View style={styles.searchPillWrap}>
          <Ionicons name="search-outline" size={18} color="#9999A0" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${config.title.toLowerCase()} salons...`}
            placeholderTextColor="#9999A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9999A0" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Scrollable Content Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroEyebrow}>{config.eyebrow}</Text>
            <Text style={styles.heroTitle}>{config.heroTitle}</Text>
            <Text style={styles.heroDesc}>{config.heroDesc(selectedCity)}</Text>
          </View>

          <View style={styles.heroRight}>
            <Image
              source={{ uri: config.heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Stamp Badge */}
            <View style={styles.badgeStamp}>
              <Text style={styles.badgeStampText}>{config.badge}</Text>
            </View>
          </View>
        </View>

        {/* Gender / Audience Filter Pills Bar */}
        <View style={styles.audienceRow}>
          {audienceOptions.map((item) => {
            const isActive = activeAudience === item;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.audiencePill,
                  isActive && styles.audiencePillActive,
                ]}
                onPress={() => setActiveAudience(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.audienceText, isActive && styles.audienceTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sort & Filter Controls Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {/* Sort Pill */}
          <TouchableOpacity
            style={[styles.filterPill, activeSort !== "Recommended" && styles.filterPillActive]}
            onPress={() => setActiveSort((prev) => (prev === "Recommended" ? "Rating" : "Recommended"))}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical" size={14} color={activeSort !== "Recommended" ? "#C05278" : "#3F3F46"} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, activeSort !== "Recommended" && styles.filterPillTextActive]}>
              Sort
            </Text>
            <Ionicons name="chevron-down" size={12} color="#71717A" style={{ marginLeft: 3 }} />
          </TouchableOpacity>

          {/* Near Me Pill */}
          <TouchableOpacity
            style={[styles.filterPill, isNearMe && styles.filterPillActive]}
            onPress={() => setIsNearMe((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={14} color={isNearMe ? "#C05278" : "#3F3F46"} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, isNearMe && styles.filterPillTextActive]}>
              Near me
            </Text>
          </TouchableOpacity>

          {/* Price Pill */}
          <TouchableOpacity
            style={styles.filterPill}
            activeOpacity={0.8}
          >
            <Text style={styles.filterPillIcon}>₹</Text>
            <Text style={styles.filterPillText}>Price</Text>
            <Ionicons name="chevron-down" size={12} color="#71717A" style={{ marginLeft: 3 }} />
          </TouchableOpacity>

          {/* Ratings Pill */}
          <TouchableOpacity
            style={[styles.filterPill, ratingFilter === 4.0 && styles.filterPillActive]}
            onPress={() => setRatingFilter((prev) => (prev === 4.0 ? null : 4.0))}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={13} color={ratingFilter ? "#F59E0B" : "#71717A"} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, ratingFilter && styles.filterPillTextActive]}>
              Ratings
            </Text>
            <Ionicons name="chevron-down" size={12} color="#71717A" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </ScrollView>

        {/* Count Header & Map View Button */}
        {!isCityEmpty && (
          <View style={styles.listHeaderRow}>
            <Text style={styles.salonsCountText}>
              {filteredSalons.length} salons found
            </Text>

            <TouchableOpacity
              style={styles.mapViewBtn}
              onPress={() => navigate && navigate("Map")}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={15} color="#C05278" style={{ marginRight: 5 }} />
              <Text style={styles.mapViewBtnText}>Map View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Salons List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#C05278" />
            <Text style={styles.loadingText}>Loading top salons...</Text>
          </View>
        ) : isCityEmpty ? (
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => setSelectedCity(c)}
          />
        ) : filteredSalons.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={40} color="#A1A1AA" />
            <Text style={styles.emptyTitle}>No salons found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or search criteria</Text>
          </View>
        ) : (
          filteredSalons.map((salon) => {
            const rawScore = typeof salon.rating === "number" ? salon.rating : (salon.rating?.avgScore || salon.rating?.score || salon.avgScore || 5.0);
            const score = typeof rawScore === "number" && !isNaN(rawScore) ? rawScore : 5.0;
            const reviewCount = salon.totalReviews ?? salon.reviewsCount ?? salon.rating?.totalReviews ?? salon.rating?.reviewsCount ?? 0;

            return (
              <TouchableOpacity
                key={salon.id || salon._id}
                style={styles.salonCard}
                onPress={() => handleSalonPress(salon)}
                activeOpacity={0.9}
              >
                {/* Salon Thumbnail Box */}
                <View style={styles.salonThumbWrap}>
                  <Image
                    source={{ uri: salon.coverImage }}
                    style={styles.salonThumb}
                    resizeMode="cover"
                  />
                  {salon.isPopular ? (
                    <View style={styles.popularBadge}>
                      <Ionicons name="sparkles" size={11} color="#FFD700" style={{ marginRight: 3 }} />
                      <Text style={styles.popularBadgeText}>Popular</Text>
                    </View>
                  ) : null}
                </View>

                {/* Center Salon Details */}
                <View style={styles.salonDetails}>
                  {/* Name + Verified Circle */}
                  <View style={styles.salonTitleRow}>
                    <Text style={styles.salonName} numberOfLines={1}>
                      {salon.name}
                    </Text>
                    {salon.isVerified !== false ? (
                      <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={{ marginLeft: 4 }} />
                    ) : null}
                  </View>

                  {/* Rating & Reviews */}
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingScore}>{score.toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>
                      ({reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount} reviews)
                    </Text>
                  </View>

                  {/* Location & Distance */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color="#71717A" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {salon.address?.formattedAddress || selectedCity} · {salon.distance || "1.2 km"}
                    </Text>
                  </View>

                  {/* Service Tags */}
                  <View style={styles.tagsRow}>
                    {(salon.tags || config.tags).slice(0, 3).map((tag, idx) => (
                      <View key={idx} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Right Side Favorite & Book Action */}
                <View style={styles.rightActions}>
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(salon)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFav ? "heart" : "heart-outline"}
                      size={20}
                      color={isFav ? "#E11D48" : "#A1A1AA"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={() => handleBookNow(salon)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.bookNowText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Bottom Consultation CTA Banner */}
        <View style={styles.ctaBanner}>
          <View style={styles.ctaIconCircle}>
            <Ionicons name="headset-outline" size={22} color="#C05278" />
          </View>

          <View style={styles.ctaTextWrap}>
            <Text style={styles.ctaTitle}>Not sure what to choose?</Text>
            <Text style={styles.ctaSub}>Get free consultation from our hair experts.</Text>
          </View>

          <TouchableOpacity
            style={styles.chatNowBtn}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.8}
          >
            <Text style={styles.chatNowText}>Chat Now</Text>
            <Ionicons name="arrow-forward" size={13} color="#7A0026" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LocationPickerModal
        visible={locationModalVisible}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setLocationModalVisible(false);
        }}
        onClose={() => setLocationModalVisible(false)}
      />
    </View>
  );
}

function buildStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: isDark ? "#121218" : "#FAFAFB",
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#71717A",
      marginTop: 1,
    },
    searchIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? "#22222D" : "#F4F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    searchPillWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: isDark ? "#22222D" : "#F4F4F6",
      borderRadius: 20,
      paddingHorizontal: 14,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: isDark ? "#FFFFFF" : "#18181B",
      paddingVertical: 0,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 36,
    },
    /* Hero Card */
    heroCard: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1E1B24" : "#F9F4F0",
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      overflow: "hidden",
      alignItems: "center",
      minHeight: 160,
    },
    heroLeft: {
      flex: 1,
      paddingRight: 10,
    },
    heroEyebrow: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: isDark ? "#A1A1AA" : "#71717A",
      marginBottom: 6,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      lineHeight: 26,
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    heroDesc: {
      fontSize: 12,
      color: isDark ? "#D4D4D8" : "#52525B",
      lineHeight: 16,
    },
    heroRight: {
      width: 130,
      height: 140,
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: "100%",
      borderRadius: 16,
    },
    badgeStamp: {
      position: "absolute",
      bottom: 8,
      right: 8,
      backgroundColor: "rgba(255, 255, 255, 0.92)",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "rgba(192, 82, 120, 0.3)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    badgeStampText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#7A0026",
      textAlign: "center",
      fontStyle: "italic",
    },
    /* Audience Filter Pills */
    audienceRow: {
      flexDirection: "row",
      marginBottom: 14,
      backgroundColor: isDark ? "#1E1E24" : "#F4F4F6",
      borderRadius: 24,
      padding: 4,
    },
    audiencePill: {
      flex: 1,
      paddingVertical: 9,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },
    audiencePillActive: {
      backgroundColor: isDark ? "#3F3F46" : "#22222D",
    },
    audienceText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#A1A1AA" : "#71717A",
    },
    audienceTextActive: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    /* Filter Row */
    filterRow: {
      flexDirection: "row",
      marginBottom: 18,
      paddingRight: 10,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#27272A" : "#E4E4E7",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
    },
    filterPillActive: {
      borderColor: "#C05278",
      backgroundColor: isDark ? "#2A1B22" : "#FDF0F2",
    },
    filterPillIcon: {
      fontSize: 13,
      fontWeight: "700",
      color: "#71717A",
      marginRight: 4,
    },
    filterPillText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#D4D4D8" : "#3F3F46",
    },
    filterPillTextActive: {
      color: "#C05278",
    },
    /* List Header */
    listHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    salonsCountText: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    mapViewBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2A1B22" : "#FDF0F2",
      borderWidth: 1,
      borderColor: "rgba(192, 82, 120, 0.3)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    mapViewBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#C05278",
    },
    /* Salon Cards */
    salonCard: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      borderRadius: 18,
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDark ? "#27272A" : "#F4F4F6",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    salonThumbWrap: {
      width: 90,
      height: 96,
      borderRadius: 14,
      overflow: "hidden",
      marginRight: 12,
      position: "relative",
    },
    salonThumb: {
      width: "100%",
      height: "100%",
    },
    popularBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.72)",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    popularBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    salonDetails: {
      flex: 1,
      justifyContent: "center",
    },
    salonTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    salonName: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      flexShrink: 1,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    ratingScore: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginLeft: 4,
      marginRight: 3,
    },
    ratingCount: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#71717A",
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    locationText: {
      fontSize: 11,
      color: isDark ? "#A1A1AA" : "#71717A",
      marginLeft: 3,
      flexShrink: 1,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    tagPill: {
      backgroundColor: isDark ? "#27272A" : "#F4F4F6",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginRight: 4,
      marginBottom: 2,
    },
    tagText: {
      fontSize: 10,
      fontWeight: "500",
      color: isDark ? "#D4D4D8" : "#52525B",
    },
    rightActions: {
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginLeft: 6,
    },
    favBtn: {
      padding: 4,
    },
    bookNowBtn: {
      backgroundColor: isDark ? "#2A1B22" : "#FDF0F2",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      marginTop: 10,
    },
    bookNowText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#7A0026",
    },
    /* Consultation Banner */
    ctaBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#20171B" : "#FDF0F2",
      borderRadius: 18,
      padding: 14,
      marginTop: 10,
      borderWidth: 1,
      borderColor: "rgba(192, 82, 120, 0.2)",
    },
    ctaIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(192, 82, 120, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    ctaTextWrap: {
      flex: 1,
    },
    ctaTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    ctaSub: {
      fontSize: 11,
      color: isDark ? "#A1A1AA" : "#71717A",
      marginTop: 2,
    },
    chatNowBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#3A1B27" : "#FAD4E0",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
    },
    chatNowText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#7A0026",
    },
    loadingBox: {
      alignItems: "center",
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 13,
      color: "#71717A",
      marginTop: 8,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginTop: 10,
    },
    emptySub: {
      fontSize: 12,
      color: "#71717A",
      marginTop: 4,
    },
  });
}
