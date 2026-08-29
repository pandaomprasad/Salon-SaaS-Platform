import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  LogBox,
} from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import BannerDetailScreen from "../screen/BannerDetailScreen";
import LegalScreen from "../screen/LegalScreen";
import AboutScreen from "../screen/AboutScreen";
import ShopScreen from "../screen/ShopScreen";
import MapScreen from "../screen/MapScreen";
import OnboardingScreen from "../screen/OnboardingScreen";
import SplashScreen from "../screen/SplashScreen";
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

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const TABS = [
  { id: "Explore", label: "Map", iconActive: "location", iconInactive: "location-outline" },
  { id: "Salons", label: "Salons", iconActive: "storefront", iconInactive: "storefront-outline" },
  { id: "Home", label: "Home", iconActive: "home", iconInactive: "home-outline" },
  { id: "Shop", label: "Shop", iconActive: "bag-handle", iconInactive: "bag-handle-outline" },
  { id: "Profile", label: "Profile", iconActive: "person", iconInactive: "person-outline" },
];

const TAB_ORDER = ["Explore", "Salons", "Home", "Shop", "Profile"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MainTabsScreen = React.memo(function MainTabsScreen({
  slideAnim,
  navigate,
  handleScroll,
  tabParams,
  renderTabBar,
}) {
  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <Animated.View
        style={{
          flex: 1,
          flexDirection: "row",
          width: SCREEN_WIDTH * TAB_ORDER.length,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <View style={{ width: SCREEN_WIDTH }}>
          <MapScreen navigate={navigate} onScroll={handleScroll} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <ExploreScreen
            navigate={navigate}
            routeParams={tabParams["Salons"]}
            onScroll={handleScroll}
          />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <HomeScreen navigate={navigate} onScroll={handleScroll} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <ShopScreen navigate={navigate} onScroll={handleScroll} />
        </View>
        <View style={{ width: SCREEN_WIDTH }}>
          <ProfileScreen navigate={navigate} onScroll={handleScroll} />
        </View>
      </Animated.View>
      {renderTabBar()}
    </View>
  );
});

export default function AppNavigator() {
  const styles = getStyles();
  const { theme, isDark } = useTheme();
  const [currentTab, setCurrentTab] = useState("Home");
  const [tabParams, setTabParams] = useState({});
  const [hasOnboarded, setHasOnboarded] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // iOS Bottom Bar Squeeze Animation
  const squeezeAnim = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);

  // Instagram-style sliding tab content
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Sliding indicator under the active tab icon (iOS bar)
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  // Tapping an appointment push → open the Bookings tab
  useEffect(() => {
    notificationService.initAndroidChannel();
    const unsubscribe = notificationService.onNotificationTap((data) => {
      if (data?.type === "appointment.status" || data?.appointmentId) {
        setCurrentTab("Bookings");
        if (navigationRef.isReady()) {
          navigationRef.navigate("MainTabs");
        }
      }
    });
    return () => {
      if (typeof unsubscribe === "function") {
        try {
          unsubscribe();
        } catch (e) { }
      }
    };
  }, []);

  // Slide the screen content whenever the active tab changes
  useEffect(() => {
    const index = TAB_ORDER.indexOf(currentTab);
    Animated.spring(slideAnim, {
      toValue: -index * SCREEN_WIDTH,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [currentTab]);

  // Slide the little indicator under the active tab icon (iOS)
  useEffect(() => {
    if (!tabRowWidth) return;
    const index = TAB_ORDER.indexOf(currentTab);
    const segment = tabRowWidth / TABS.length;
    Animated.spring(indicatorAnim, {
      toValue: segment * index,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [currentTab, tabRowWidth]);

  const handleScroll = useCallback((event) => {
    if (Platform.OS !== "ios") return;
    const y = event.nativeEvent?.contentOffset?.y || 0;
    const diff = y - lastY.current;

    if (y > 50 && diff > 12) {
      Animated.spring(squeezeAnim, {
        toValue: 1,
        friction: 12,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else if (diff < -12 || y <= 20) {
      Animated.spring(squeezeAnim, {
        toValue: 0,
        friction: 12,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }
    lastY.current = y;
  }, [squeezeAnim]);

  const navigate = useCallback((screenName, params = {}) => {
    squeezeAnim.setValue(0);
    const targetTab = screenName === "Salons" ? "Explore" : screenName;
    if (TAB_ORDER.includes(screenName) || screenName === "MainTabs") {
      if (TAB_ORDER.includes(screenName)) {
        setCurrentTab(screenName);
        setTabParams((prev) => ({ ...prev, [targetTab]: params }));
      }
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute()?.name;
        if (
          currentRoute === "Login" ||
          currentRoute === "Register" ||
          currentRoute === "Onboarding"
        ) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        } else {
          navigationRef.navigate("MainTabs");
        }
      }
    } else {
      if (navigationRef.isReady()) {
        if (screenName === "Login" && params?.hideBack) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: "Login", params }],
          });
        } else {
          navigationRef.navigate(screenName, params);
        }
      }
    }
  }, [squeezeAnim]);

  const goBack = useCallback(() => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    } else if (navigationRef.isReady()) {
      navigationRef.navigate("MainTabs");
    }
  }, []);

  const isIos = Platform.OS === "ios";
  const insets = useSafeAreaInsets();
  const iosBottomPosition = Math.max(insets.bottom, 12) + 8;

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

  const renderTabBar = useCallback(() => {
    if (hasOnboarded === false || showSplash) return null;
    return (
      <AndroidExpandingTabBar
        tabs={TABS}
        currentTab={currentTab}
        onSelectTab={(tabId) => navigate(tabId)}
      />
    );
  }, [hasOnboarded, showSplash, currentTab, navigate]);

  const renderMainTabs = useCallback(
    () => (
      <MainTabsScreen
        slideAnim={slideAnim}
        navigate={navigate}
        handleScroll={handleScroll}
        tabParams={tabParams}
        renderTabBar={renderTabBar}
      />
    ),
    [slideAnim, navigate, handleScroll, tabParams, renderTabBar]
  );

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (hasOnboarded === null) {
    return null;
  }

  const initialRouteName = hasOnboarded === false ? "Onboarding" : "MainTabs";

  return (
    <FavoritesProvider>
      <View style={[styles.container, { backgroundColor: theme.canvas }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.canvas} />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName={initialRouteName}
            screenOptions={{
              headerShown: false,
              animation: "default",
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          >
            <Stack.Screen name="MainTabs" component={renderMainTabs} />
            <Stack.Screen name="Onboarding">
              {({ navigation }) => (
                <OnboardingScreen
                  onFinish={() => {
                    setHasOnboarded(true);
                    setCurrentTab("Home");
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "Login", params: { hideBack: true } }],
                    });
                  }}
                  navigate={(name, params) => navigate(name, params)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SalonDetail">
              {({ route }) => (
                <SalonDetailScreen
                  salon={route.params?.salon}
                  goBack={goBack}
                  navigate={navigate}
                  onScroll={handleScroll}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Booking">
              {({ route }) => (
                <BookingScreen
                  salon={route.params?.salon}
                  branch={route.params?.branch}
                  service={route.params?.service}
                  selectedServices={route.params?.selectedServices}
                  goBack={goBack}
                  navigate={navigate}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Login">
              {({ route }) => (
                <LoginScreen
                  navigate={navigate}
                  goBack={goBack}
                  routeParams={route.params}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {({ route }) => (
                <RegisterScreen
                  navigate={navigate}
                  goBack={goBack}
                  routeParams={route.params}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="EditProfile">
              {() => <EditProfileScreen goBack={goBack} navigate={navigate} />}
            </Stack.Screen>
            <Stack.Screen name="SavedAddresses">
              {() => <SavedAddressesScreen goBack={goBack} navigate={navigate} />}
            </Stack.Screen>
            <Stack.Screen name="Support">
              {() => <SupportScreen goBack={goBack} navigate={navigate} />}
            </Stack.Screen>
            <Stack.Screen name="AllSalons">
              {({ route }) => (
                <AllSalonsScreen
                  goBack={goBack}
                  navigate={navigate}
                  routeParams={route.params}
                  onScroll={handleScroll}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="NotificationCenter">
              {() => <NotificationCenterScreen onBack={goBack} navigate={navigate} />}
            </Stack.Screen>
            <Stack.Screen name="SavedSalons">
              {() => <SavedSalonsScreen onBack={goBack} navigate={navigate} />}
            </Stack.Screen>
            <Stack.Screen name="BannerDetail">
              {({ route }) => (
                <BannerDetailScreen
                  onBack={goBack}
                  navigate={navigate}
                  routeParams={route.params}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Legal">
              {({ route }) => (
                <LegalScreen
                  goBack={goBack}
                  navigate={navigate}
                  routeParams={route.params}
                  onScroll={handleScroll}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="About">
              {() => <AboutScreen goBack={goBack} navigate={navigate} />}
            </Stack.Screen>
            <Stack.Screen name="Shop">
              {() => <ShopScreen navigate={navigate} onScroll={handleScroll} />}
            </Stack.Screen>
            <Stack.Screen name="Bookings">
              {() => <BookingsScreen onBack={goBack} navigate={navigate} onScroll={handleScroll} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </FavoritesProvider>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    content: {
      flex: 1,
    },
    iosTabBarContainer: {
      position: "absolute",
      bottom: 24,
      left: 16,
      right: 16,
      height: 58,
      borderRadius: R.pill,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      overflow: "hidden",
    },
    iosTabRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 12,
    },
    tabIndicator: {
      position: "absolute",
      top: 0,
      left: 0,
      height: 3,
      borderRadius: 2,
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
      color: C.main,
      fontWeight: FW.semiBold,
    },
  });
}