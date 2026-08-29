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

  const barBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const barBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
  const centerBtnBg = theme.primary || (isDark ? "#D49B45" : "#C48B36");
  const activeColor = isDark ? "#FFFFFF" : theme.ink || "#121212";
  const inactiveColor = isDark ? "#8E8E93" : "#7A7A80";

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomInset }]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: barBg,
            borderColor: barBorder,
            shadowColor: isDark ? "#000000" : "#121212",
            shadowOpacity: isDark ? 0.35 : 0.08,
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
                      size={21}
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
                    size={21}
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
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
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
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSquircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
