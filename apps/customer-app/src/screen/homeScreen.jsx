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
import { C, S } from "../theme";
import Ios26HomeHero from "../components/Ios26HomeHero";
import TopPromoBanner from "../components/TopPromoBanner";
import QuickRebookWidget from "../components/QuickRebookWidget";
import SalonCard from "../components/SalonCard";
import LocationPickerModal from "../components/LocationPickerModal";
import { browseService } from "../services/browseService";
import { appointmentService } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";

const SalonCarousel = memo(({ salons, onSalonPress }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.horizontalCarousel}
    contentContainerStyle={{ paddingLeft: S.lg, paddingRight: S.sm }}
  >
    {salons.map((salon, idx) => (
      <SalonCard
        key={salon._id || salon.id}
        salon={salon}
        isHorizontal={true}
        index={idx}
        onPress={onSalonPress}
      />
    ))}
  </ScrollView>
));

const SalonVerticalList = memo(({ salons, onSalonPress }) => (
  <View style={styles.verticalListContainer}>
    {salons.map((salon, idx) => (
      <SalonCard
        key={`full_${salon._id || salon.id}`}
        salon={salon}
        isHorizontal={false}
        index={idx + 2}
        onPress={onSalonPress}
      />
    ))}
  </View>
));

function HomeScreen({ navigate, onScroll }) {
  const { user, isAuthenticated } = useAuth();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [upcomingAppt, setUpcomingAppt] = useState(null);

  const salonsRef = React.useRef(salons);
  salonsRef.current = salons;

  const loadData = useCallback(async (silent = false) => {
    try {
      setLoadError(null);
      if (!silent && salonsRef.current.length === 0) {
        setLoading(true);
      }
      const res = await browseService.getSalons({ city: selectedCity });
      const salonList = res.data?.salons || (Array.isArray(res.data) ? res.data : []);
      
      setSalons((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(salonList)) return prev;
        return salonList;
      });

      if (isAuthenticated) {
        try {
          const apptRes = await appointmentService.getAppointments();
          const list = apptRes.data?.appointments || (Array.isArray(apptRes.data) ? apptRes.data : []);
          const active = list.find((app) => {
            const status = (app.status || "").toUpperCase();
            return status === "PENDING" || status === "CONFIRMED" || status === "IN_PROGRESS";
          });
          setUpcomingAppt(active || (list.length > 0 ? list[0] : null));
        } catch (e) {
          setUpcomingAppt(null);
        }
      } else {
        setUpcomingAppt(null);
      }
    } catch (err) {
      console.log("Failed to load salons", err.message);
      setLoadError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, isAuthenticated]);

  useEffect(() => {
    loadData(salonsRef.current.length > 0);
  }, [selectedCity, isAuthenticated, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salon });
  }, [navigate]);

  const handleSearchClick = useCallback(() => {
    if (navigate) navigate("Explore");
  }, [navigate]);

  const handleBannerPress = useCallback(() => {
    if (navigate) navigate("Explore");
  }, [navigate]);

  const handleRebook = useCallback(() => {
    if (salons.length > 0 && navigate) {
      navigate("SalonDetail", { salon: salons[0] });
    } else if (navigate) {
      navigate("Explore");
    }
  }, [salons, navigate]);

  const handleExplore = useCallback(() => {
    if (navigate) navigate("Explore");
  }, [navigate]);

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
  }, []);

  const handleLocationClose = useCallback(() => {
    setLocationModalVisible(false);
  }, []);

  const handleLocationClick = useCallback(() => {
    setLocationModalVisible(true);
  }, []);

  const handleSeeAll = useCallback(() => {
    if (navigate) navigate("Explore");
  }, [navigate]);

  const handleSearchSubmit = useCallback((term) => {
    if (navigate) navigate("Explore", { search: term });
  }, [navigate]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAF9F5" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1714" />
        }
      >
        <Ios26HomeHero
          userName={user?.name}
          selectedCity={selectedCity}
          onSearchClick={handleSearchClick}
          onLocationClick={handleLocationClick}
          onSearchSubmit={handleSearchSubmit}
        />

        <TopPromoBanner onPressBanner={handleBannerPress} />

        <QuickRebookWidget
          isAuthenticated={isAuthenticated}
          appointment={upcomingAppt}
          onRebook={handleRebook}
          onViewDetails={() => navigate && navigate("Bookings")}
          onLogin={() => navigate && navigate("Login")}
          onExplore={handleExplore}
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionSubTitle}>HANDPICKED STUDIOS</Text>
            <Text style={styles.sectionTitle}>Featured Studios in {selectedCity}</Text>
          </View>
          <TouchableOpacity onPress={handleSeeAll} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1A1714" />
            <Text style={styles.loadingText}>Finding luxury studios in {selectedCity}...</Text>
          </View>
        ) : loadError && salons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Unable to connect to server</Text>
            <Text style={styles.emptyText}>{loadError}. Make sure your device is on the same network as the server.</Text>
            <TouchableOpacity
              style={{
                marginTop: 12,
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: "#1A1714",
                borderRadius: 16,
              }}
              onPress={() => loadData(false)}
            >
              <Text style={{ color: "#E6CA65", fontWeight: "800", fontSize: 13 }}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : salons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No salons found in {selectedCity}</Text>
            <Text style={styles.emptyText}>Check back soon for new partner studios in this city.</Text>
          </View>
        ) : (
          <SalonCarousel salons={salons} onSalonPress={handleSalonPress} />
        )}

        {salons.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionSubTitle}>HIGHEST RATED</Text>
                <Text style={styles.sectionTitle}>Top Rated In {selectedCity}</Text>
              </View>
            </View>
            <SalonVerticalList salons={salons} onSalonPress={handleSalonPress} />
          </>
        ) : null}
      </ScrollView>

      <LocationPickerModal
        visible={locationModalVisible}
        selectedCity={selectedCity}
        onSelectCity={handleCitySelect}
        onClose={handleLocationClose}
      />
    </View>
  );
}

export default memo(HomeScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F5",
  },
  contentContainer: {
    paddingBottom: 110,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: S.lg,
    marginTop: S.lg,
    marginBottom: S.sm,
  },
  sectionSubTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8E877D",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1714",
    letterSpacing: -0.5,
  },
  seeAllBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A1714",
  },
  horizontalCarousel: {
    marginBottom: S.md,
  },
  verticalListContainer: {
    paddingHorizontal: S.lg,
  },
  loadingContainer: {
    padding: S.xxl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: S.sm,
    color: "#8E877D",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: S.xxl,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: S.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1714",
  },
  emptyText: {
    fontSize: 13,
    color: "#8E877D",
    textAlign: "center",
    marginTop: 4,
  },
});