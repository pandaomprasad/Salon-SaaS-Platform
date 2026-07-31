import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Animated, LayoutAnimation, UIManager, LogBox } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, SHADOWS } from "../theme";

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
import ScreenTransition from "../components/ScreenTransition";
import AndroidExpandingTabBar from "../components/AndroidExpandingTabBar";
import { FavoritesProvider } from "../context/FavoritesContext";

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
  const [currentTab, setCurrentTab] = useState("Home");
  const [screenStack, setScreenStack] = useState([]); // Navigation stack: [{ name, params }]

  // iOS Bottom Bar Squeeze Animation
  const squeezeAnim = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);

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
    if (activeScreen === "SalonDetail") {
      return (
        <SalonDetailScreen
          salon={screenParams.salon}
          goBack={goBack}
          navigate={navigate}
          onScroll={handleScroll}
        />
      );
    }
    if (activeScreen === "Booking") {
      return (
        <BookingScreen
          salon={screenParams.salon}
          branch={screenParams.branch}
          service={screenParams.service}
          goBack={goBack}
          navigate={navigate}
        />
      );
    }
    if (activeScreen === "Login") {
      return (
        <LoginScreen
          navigate={navigate}
          goBack={goBack}
          routeParams={screenParams}
        />
      );
    }
    if (activeScreen === "Register") {
      return (
        <RegisterScreen
          navigate={navigate}
          goBack={goBack}
          routeParams={screenParams}
        />
      );
    }
    if (activeScreen === "EditProfile") {
      return <EditProfileScreen goBack={goBack} navigate={navigate} />;
    }
    if (activeScreen === "SavedAddresses") {
      return <SavedAddressesScreen goBack={goBack} navigate={navigate} />;
    }
    if (activeScreen === "Support") {
      return <SupportScreen goBack={goBack} navigate={navigate} />;
    }

    switch (currentTab) {
      case "Explore":
        return <ExploreScreen navigate={navigate} routeParams={screenParams} onScroll={handleScroll} />;
      case "Bookings":
        return <BookingsScreen navigate={navigate} onScroll={handleScroll} />;
      case "Profile":
        return <ProfileScreen navigate={navigate} onScroll={handleScroll} />;
      case "Home":
      default:
        return <HomeScreen navigate={navigate} onScroll={handleScroll} />;
    }
  };

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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.dark} />

        <View style={styles.content}>
          <ScreenTransition screenKey={activeScreen || currentTab} isStackScreen={!!activeScreen}>
            {renderContent()}
          </ScreenTransition>
        </View>

        {/* Show Bottom Tab Bar when not in a modal stack screen */}
        {!activeScreen ? (
          isIos ? (
            <Animated.View
              style={[
                styles.iosTabBarContainer,
                {
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
                      size={22}
                      color={isSelected ? "#1A1714" : "#8E8880"}
                    />
                    <Text
                      style={[
                        styles.iosTabLabel,
                        isSelected && styles.iosTabLabelSelected,
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
    backgroundColor: C.dark,
  },
  content: {
    flex: 1,
  },

  // ──── iOS Floating Pill Tab Bar ────
  iosTabBarContainer: {
    position: "absolute",
    bottom: 28,
    left: 20,
    right: 20,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  iosTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  iosTabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8880",
    marginTop: 3,
  },
  iosTabLabelSelected: {
    color: "#1A1714",
    fontWeight: "800",
  },

  // ──── Android Material 3 Expanding Pill Capsule Tab Bar ────
  androidTabBarContainer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  androidTabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  androidTabItemActive: {
    backgroundColor: "#1D1B20",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  androidActiveLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 8,
  },
});
