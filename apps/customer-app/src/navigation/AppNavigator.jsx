import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Animated, LayoutAnimation, UIManager, LogBox } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, SHADOWS } from "../theme";
import { useTheme } from "../context/ThemeContext";

import HomeScreen from "../screen/homeScreen";
import ExploreScreen from "../screen/ExploreScreen";
import SalonDetailScreen from "../screen/SalonDetailScreen";
import BookingScreen from "../screen/BookingScreen";
import BookingsScreen from "../screen/BookingsScreen";
import LoginScreen from "../screen/LoginScreen";
import RegisterScreen from "../screen/RegisterScreen";
import ProfileScreen from "../screen/ProfileScreen";
import EditProfileScreen from "../screen/EditProfileScreen";
import SavedAddressesScreen from "../screen/SavedAddressesScreen";
import SupportScreen from "../screen/SupportScreen";
import AllSalonsScreen from "../screen/AllSalonsScreen";
import NotificationCenterScreen from "../screen/NotificationCenterScreen";
import SavedSalonsScreen from "../screen/SavedSalonsScreen";
import LegalScreen from "../screen/LegalScreen";
import OnboardingScreen from "../screen/OnboardingScreen";
import SplashScreen from "../screen/SplashScreen";
import ScreenTransition from "../components/ScreenTransition";
import AndroidExpandingTabBar from "../components/AndroidExpandingTabBar";
import { FavoritesProvider } from "../context/FavoritesContext";
import { storage } from "../services/storage";
import { notificationService } from "../services/notificationService";

LogBox.ignoreLogs([
  "setLayoutAnimationEnabledExperimental",
  "no-op in the New Architecture",
  "expo-notifications",
  "Android Push notifications",
]);

const TABS = [
  { id: "Home", label: "Home", iconActive: "home", iconInactive: "home-outline" },
  { id: "Explore", label: "Search", iconActive: "search", iconInactive: "search-outline" },
  { id: "Bookings", label: "Visits", iconActive: "calendar", iconInactive: "calendar-outline" },
  { id: "Profile", label: "Profile", iconActive: "person", iconInactive: "person-outline" },
];

export default function AppNavigator() {
  const { theme, isDark } = useTheme();
  const [currentTab, setCurrentTab] = useState("Home");
  const [screenStack, setScreenStack] = useState([]); // Navigation stack: [{ name, params }]
  const [hasOnboarded, setHasOnboarded] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const val = await storage.getItem("@salon_app_has_onboarded");
        setHasOnboarded(val === "true");
      } catch (e) {
        setHasOnboarded(false);
      }
    };
    checkOnboarding();
  }, []);

  // iOS Bottom Bar Squeeze Animation
  const squeezeAnim = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);

  // Tapping an appointment push → open the Bookings tab
  React.useEffect(() => {
    notificationService.initAndroidChannel();
    const unsubscribe = notificationService.onNotificationTap((data) => {
      if (data?.type === "appointment.status" || data?.appointmentId) {
        setCurrentTab("Bookings");
        setScreenStack([]);
      }
    });
    return () => {
      if (typeof unsubscribe === "function") {
        try {
          unsubscribe();
        } catch (e) {}
      }
    };
  }, []);

  const handleScroll = (event) => {
    if (Platform.OS !== "ios") return;
    const y = event.nativeEvent?.contentOffset?.y || 0;
    const diff = y - lastY.current;

    if (y > 50 && diff > 12) {
      // Gentle squeeze when scrolling down
      Animated.spring(squeezeAnim, {
        toValue: 1,
        friction: 12,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else if (diff < -12 || y <= 20) {
      // Restore full pill bar when scrolling up or near top
      Animated.spring(squeezeAnim, {
        toValue: 0,
        friction: 12,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }
    lastY.current = y;
  };

  const navigate = (screenName, params = {}) => {
    if (Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    // Reset squeeze when navigating
    squeezeAnim.setValue(0);
    if (["Home", "Explore", "Bookings", "Profile"].includes(screenName)) {
      setCurrentTab(screenName);
      setScreenStack([]);
    } else {
      setScreenStack((prev) => [...prev, { name: screenName, params }]);
    }
  };

  const goBack = () => {
    if (Platform.OS === "android") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setScreenStack((prev) => {
      if (prev.length <= 1) return [];
      return prev.slice(0, prev.length - 1);
    });
  };

  const currentOverlay = screenStack.length > 0 ? screenStack[screenStack.length - 1] : null;
  const activeScreen = currentOverlay?.name || null;
  const screenParams = currentOverlay?.params || {};

  // Render current view
  const renderContent = () => {
    // Show splash screen on cold launch
    if (showSplash) {
      return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    if (hasOnboarded === false || activeScreen === "Onboarding") {
      return (
        <OnboardingScreen
          onFinish={() => {
            setHasOnboarded(true);
            setScreenStack([]);
            setCurrentTab("Home");
          }}
          navigate={navigate}
        />
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: activeScreen ? "none" : "flex" }}>
          {renderTabViews()}
        </View>

        {activeScreen === "SalonDetail" && (
          <SalonDetailScreen
            salon={screenParams.salon}
            goBack={goBack}
            navigate={navigate}
            onScroll={handleScroll}
          />
        )}
        {activeScreen === "Booking" && (
          <BookingScreen
            salon={screenParams.salon}
            branch={screenParams.branch}
            service={screenParams.service}
            goBack={goBack}
            navigate={navigate}
          />
        )}
        {activeScreen === "Login" && (
          <LoginScreen
            navigate={navigate}
            goBack={goBack}
            routeParams={screenParams}
          />
        )}
        {activeScreen === "Register" && (
          <RegisterScreen
            navigate={navigate}
            goBack={goBack}
            routeParams={screenParams}
          />
        )}
        {activeScreen === "EditProfile" && (
          <EditProfileScreen goBack={goBack} navigate={navigate} />
        )}
        {activeScreen === "SavedAddresses" && (
          <SavedAddressesScreen goBack={goBack} navigate={navigate} />
        )}
        {activeScreen === "Support" && (
          <SupportScreen goBack={goBack} navigate={navigate} />
        )}
        {activeScreen === "AllSalons" && (
          <AllSalonsScreen
            goBack={goBack}
            navigate={navigate}
            routeParams={screenParams}
            onScroll={handleScroll}
          />
        )}
        {activeScreen === "NotificationCenter" && (
          <NotificationCenterScreen onBack={goBack} navigate={navigate} />
        )}
        {activeScreen === "SavedSalons" && (
          <SavedSalonsScreen onBack={goBack} navigate={navigate} />
        )}
        {activeScreen === "Legal" && (
          <LegalScreen goBack={goBack} navigate={navigate} routeParams={screenParams} onScroll={handleScroll} />
        )}
      </View>
    );
  };

  // Persistent Tab Screen Views (Keep-Alive)
  const renderTabViews = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, display: currentTab === "Home" ? "flex" : "none" }}>
        <HomeScreen navigate={navigate} onScroll={handleScroll} />
      </View>
      <View style={{ flex: 1, display: currentTab === "Explore" ? "flex" : "none" }}>
        <ExploreScreen navigate={navigate} routeParams={screenParams} onScroll={handleScroll} />
      </View>
      <View style={{ flex: 1, display: currentTab === "Bookings" ? "flex" : "none" }}>
        <BookingsScreen navigate={navigate} onScroll={handleScroll} />
      </View>
      <View style={{ flex: 1, display: currentTab === "Profile" ? "flex" : "none" }}>
        <ProfileScreen navigate={navigate} onScroll={handleScroll} />
      </View>
    </View>
  );

  const isIos = Platform.OS === "ios";

  // Interpolations for subtle iOS Squeeze effect
  const scale = squeezeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  const translateY = squeezeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  const barOpacity = squeezeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  return (
    <FavoritesProvider>
      <View style={[styles.container, { backgroundColor: theme.canvas }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.canvas} />

        <View style={styles.content} key={isDark ? 'dark' : 'light'}>
          <ScreenTransition screenKey={activeScreen || currentTab} isStackScreen={!!activeScreen}>
            {renderContent()}
          </ScreenTransition>
        </View>

        {/* Show Bottom Tab Bar when not in a modal stack screen or onboarding or splash */}
        {!activeScreen && hasOnboarded !== false && !showSplash ? (
          isIos ? (
            <Animated.View
              style={[
                styles.iosTabBarContainer,
                {
                  backgroundColor: theme.tabBg,
                  borderColor: theme.tabBorder,
                  opacity: barOpacity,
                  transform: [
                    { translateY },
                    { scale },
                  ],
                },
              ]}
            >
              {TABS.map((tab) => {
                const isSelected = currentTab === tab.id;
                const iconName = isSelected ? tab.iconActive : tab.iconInactive;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={styles.iosTabItem}
                    onPress={() => navigate(tab.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={iconName}
                      size={20}
                      color={isSelected ? theme.primary : theme.muted}
                    />
                    <Text
                      style={[
                        styles.iosTabLabel,
                        { color: theme.muted },
                        isSelected && { color: theme.primary, fontWeight: "600" },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          ) : (
            <AndroidExpandingTabBar
              tabs={TABS}
              currentTab={currentTab}
              onSelectTab={(tabId) => navigate(tabId)}
            />
          )
        ) : null}
      </View>
    </FavoritesProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
  },

  // ──── Floating Pill Nav per cursor/DESIGN.md ────
  iosTabBarContainer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    height: 58,
    borderRadius: R.pill,          // rounded.pill (9999px)
    backgroundColor: C.surface,     // Surface card white
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,          // 1px hairline border
  },
  iosTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iosTabLabel: {
    fontSize: 10,
    fontWeight: FW.medium,
    color: C.muted,
    marginTop: 2,
  },
  iosTabLabelSelected: {
    color: C.main,                  // Cursor Orange #f54e00
    fontWeight: FW.semiBold,
  },

  // ──── Android Tab Bar per cursor/DESIGN.md ────
  androidTabBarContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    height: 56,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  androidTabItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.md,             // 8px radius per cursor/DESIGN.md
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  androidTabItemActive: {
    backgroundColor: C.main,        // Cursor Orange primary
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: R.md,             // 8px CTA radius
  },
  androidActiveLabel: {
    color: "#FFFFFF",
    fontWeight: FW.medium,
    fontSize: 13,
    marginLeft: 6,
  },
});

