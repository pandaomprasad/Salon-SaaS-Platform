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
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BAR_MARGIN = 16; // left: 16, right: 16
const BAR_PADDING = 8;  // inner container padding
const TRACK_WIDTH = SCREEN_WIDTH - BAR_MARGIN * 2 - BAR_PADDING * 2;
const NUM_TABS = 4;
const TAB_COL_WIDTH = TRACK_WIDTH / NUM_TABS;

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const { theme } = useTheme();
  const activeIndex = tabs.findIndex((t) => t.id === currentTab);
  const selectedIndex = activeIndex >= 0 ? activeIndex : 0;

  const animValue = useRef(new Animated.Value(selectedIndex)).current;
  const styles = getStyles();

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
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
      {/* Moving Pill Indicator */}
      <Animated.View
        style={[
          styles.movingIndicator,
          {
            left: indicatorLeft,
            width: TAB_COL_WIDTH,
            backgroundColor: theme.primary,
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
                  color={isSelected ? "#FFFFFF" : theme.muted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isSelected ? styles.labelActive : { color: theme.muted, fontWeight: "600" },
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

function getStyles() {
  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 24,
      left: BAR_MARGIN,
      right: BAR_MARGIN,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      paddingHorizontal: BAR_PADDING,
      borderWidth: 1,
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
      fontWeight: "600",
    },
    movingIndicator: {
      position: "absolute",
      top: 8,
      height: 48,
      borderRadius: 24,
      zIndex: 1,
    },
  });
}
