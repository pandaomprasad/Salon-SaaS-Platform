// src/components/AndroidExpandingTabBar.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BAR_MARGIN = 16; // left: 16, right: 16
const BAR_PADDING = 8;  // inner container padding
const TRACK_WIDTH = SCREEN_WIDTH - BAR_MARGIN * 2 - BAR_PADDING * 2;
const NUM_TABS = 4;
const TAB_COL_WIDTH = TRACK_WIDTH / NUM_TABS;

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const activeIndex = tabs.findIndex((t) => t.id === currentTab);
  const selectedIndex = activeIndex >= 0 ? activeIndex : 0;

  const animValue = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: selectedIndex,
      friction: 9,
      tension: 85,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex]);

  // Pixel-perfect sliding indicator position
  const indicatorLeft = animValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      BAR_PADDING,
      BAR_PADDING + TAB_COL_WIDTH,
      BAR_PADDING + TAB_COL_WIDTH * 2,
      BAR_PADDING + TAB_COL_WIDTH * 3,
    ],
  });

  return (
    <View style={styles.container}>
      {/* Moving Black Pill Indicator */}
      <Animated.View
        style={[
          styles.movingIndicator,
          {
            left: indicatorLeft,
            width: TAB_COL_WIDTH,
          },
        ]}
      />

      {/* Tabs Track */}
      <View style={styles.tabsTrack}>
        {tabs.map((tab, idx) => {
          const isSelected = currentTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.85}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabColumn}
            >
              <View style={styles.tabInner}>
                <Ionicons
                  name={isSelected ? tab.iconActive : tab.iconInactive}
                  size={19}
                  color={isSelected ? "#FFFFFF" : "#5F5D62"}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isSelected ? styles.labelActive : styles.labelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: BAR_MARGIN,
    right: BAR_MARGIN,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: BAR_PADDING,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
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
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    marginLeft: 5,
  },
  labelActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  labelInactive: {
    color: "#5F5D62",
    fontWeight: "600",
  },
  movingIndicator: {
    position: "absolute",
    top: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1D1B20",
    zIndex: 1,
  },
});
