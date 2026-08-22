// src/components/AndroidExpandingTabBar.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BAR_MARGIN = 16;
const BAR_PADDING = 8;
const TRACK_WIDTH = SCREEN_WIDTH - BAR_MARGIN * 2 - BAR_PADDING * 2;
const NUM_TABS = 4;
const TAB_COL_WIDTH = TRACK_WIDTH / NUM_TABS;

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const baseBottomInset = isAndroid ? Math.max(insets.bottom, 36) : Math.max(insets.bottom, 12);
  const bottomInset = baseBottomInset + 10;

  const activeIndex = tabs.findIndex((t) => t.id === currentTab);
  const selectedIndex = activeIndex >= 0 ? activeIndex : 0;

  // Inverted styling per user request:
  // Light Theme -> Pure obsidian black bar (#000000), active pill (#27272A), white icons/text
  // Dark Theme  -> Crisp white bar (#FFFFFF), active pill (#F4F4F5), dark icons/text
  const barBg = isDark ? "#FFFFFF" : "#000000";
  const barBorder = isDark ? "#E4E4E7" : "#18181B";
  const activePillBg = isDark ? "#F4F4F5" : "#27272A";
  const activeContentColor = isDark ? "#18181B" : "#FFFFFF";
  const inactiveIconColor = isDark ? "#71717A" : "#FFFFFF";

  const animValue = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: selectedIndex,
      friction: 8,
      tension: 75,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex]);

  // Interpolate position of the sliding active capsule pill
  const indicatorLeft = animValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      BAR_PADDING,
      BAR_PADDING + TAB_COL_WIDTH,
      BAR_PADDING + TAB_COL_WIDTH * 2,
      BAR_PADDING + TAB_COL_WIDTH * 3,
    ],
  });

  const styles = getStyles();

  return (
    <View style={[styles.container, { backgroundColor: barBg, borderColor: barBorder, bottom: bottomInset }]}>
      {/* Sliding Active Pill Background */}
      <Animated.View
        style={[
          styles.slidingPill,
          {
            left: indicatorLeft,
            width: TAB_COL_WIDTH,
            backgroundColor: activePillBg,
          },
        ]}
      />

      {/* Interactive Tabs Track */}
      <View style={styles.tabsTrack}>
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.85}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabColumn}
            >
              <View style={styles.tabContentRow}>
                <Ionicons
                  name={isSelected ? tab.iconActive : tab.iconInactive}
                  size={isSelected ? 19 : 22}
                  color={isSelected ? activeContentColor : inactiveIconColor}
                />
                {isSelected ? (
                  <Text style={[styles.activeLabel, { color: activeContentColor }]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      position: "absolute",
      left: BAR_MARGIN,
      right: BAR_MARGIN,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      paddingHorizontal: BAR_PADDING,
      borderWidth: 1,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    slidingPill: {
      position: "absolute",
      top: 8,
      height: 48,
      borderRadius: 24,
      zIndex: 1,
    },
    tabsTrack: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      zIndex: 2,
    },
    tabColumn: {
      width: TAB_COL_WIDTH,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    tabContentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    activeLabel: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
}
