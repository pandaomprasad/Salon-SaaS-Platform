// src/components/AndroidExpandingTabBar.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  const barBg = isDark ? "#18181C" : "#FFFFFF";
  const barBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E5EA";
  const centerBtnBg = theme.primary || (isDark ? "#D49B45" : "#C48B36");
  const activeColor = isDark ? "#FFFFFF" : theme.ink || "#121212";
  const inactiveColor = isDark ? "#8E8E93" : "#8E8E93";

  return (
    <View
      style={[
        styles.bottomBarContainer,
        {
          backgroundColor: barBg,
          borderTopColor: barBorder,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;
          const isCenter = tab.id === "Home";

          if (isCenter) {
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.85}
                onPress={() => onSelectTab(tab.id)}
                style={styles.tabItem}
              >
                <View
                  style={[
                    styles.centerSquircle,
                    {
                      backgroundColor: centerBtnBg,
                      shadowColor: centerBtnBg,
                    },
                  ]}
                >
                  <Ionicons
                    name="home"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    styles.centerLabelText,
                    { color: isSelected ? activeColor : inactiveColor },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          const iconColor = isSelected ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.75}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabItem}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isSelected ? (tab.iconActive || tab.icon) : (tab.iconInactive || tab.icon)}
                  size={22}
                  color={iconColor}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: iconColor,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    borderTopWidth: 1,
    paddingTop: 6,
    elevation: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  iconWrapper: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSquircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.2,
  },
  centerLabelText: {
    fontWeight: "700",
  },
});

