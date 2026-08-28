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
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  const barBg = isDark ? "#181820" : "#FFFFFF";
  const barBorder = isDark ? "#282834" : "#EFEFF4";
  const centerBtnBg = isDark ? "#6C5CE7" : "#0F172A";

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomInset }]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: barBg,
            borderColor: barBorder,
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
                  activeOpacity={0.82}
                  onPress={() => onSelectTab(tab.id)}
                  style={styles.tabItem}
                >
                  <View style={[styles.centerSquircle, { backgroundColor: centerBtnBg }]}>
                    <Ionicons
                      name="home"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={[styles.tabLabel, styles.centerLabelText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            }

            const activeColor = isDark ? "#FFFFFF" : "#0F172A";
            const inactiveColor = isDark ? "#71717A" : "#8E8E93";
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
                    size={20}
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
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 999,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSquircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  centerLabelText: {
    fontWeight: "700",
  },
});
