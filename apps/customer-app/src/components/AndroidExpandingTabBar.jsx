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

  const barBg = theme.tabBg || (isDark ? "#18181C" : "#FFFFFF");
  const tabActiveColor = theme.tabActive || "#B3261E";
  const tabActiveTint = theme.tabActiveTint || "#FCE8E8";
  const tabCenterBtn = theme.tabCenterBtn || "#8C1D2A";
  const inactiveColor = isDark ? "#8E8E93" : "#8E8E93";

  return (
    <View
      style={[
        styles.bottomBarContainer,
        {
          backgroundColor: barBg,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;
          const isCenter = tab.id === "Map";

          if (isCenter) {
             return (
               <TouchableOpacity
                 key={tab.id}
                 activeOpacity={0.85}
                 onPress={() => onSelectTab(tab.id)}
                 style={styles.centerTabItem}
               >
                 <View style={[styles.centerButtonOuter, { backgroundColor: barBg }]}>
                   <View style={[styles.centerButtonInner, { backgroundColor: tabCenterBtn, shadowColor: tabCenterBtn }]}>
                     <Ionicons name="location" size={28} color="#FFFFFF" />
                   </View>
                 </View>
                 <View style={styles.centerLabelContainer}>
                   <Text style={[styles.tabLabel, { color: isSelected ? tabCenterBtn : inactiveColor, fontWeight: isSelected ? "700" : "500" }]}>
                     {tab.label}
                   </Text>
                   {isSelected && <View style={[styles.activeDot, { backgroundColor: tabCenterBtn }]} />}
                 </View>
               </TouchableOpacity>
             );
          }

          const iconColor = isSelected ? tabActiveColor : inactiveColor;
          
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.75}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabItem}
            >
              <View style={[styles.iconWrapper, isSelected && { backgroundColor: tabActiveTint }]}>
                <Ionicons
                  name={isSelected ? (tab.iconActive || tab.icon) : (tab.iconInactive || tab.icon)}
                  size={24}
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
              {isSelected && <View style={[styles.activeDot, { backgroundColor: tabActiveColor }]} />}
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    elevation: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
    minHeight: 64,
  },
  iconWrapper: {
    height: 36,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    marginBottom: 4,
  },
  activeIconWrapper: {
    backgroundColor: "#FCE8E8", // Light pink/red background
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#B3261E",
    position: "absolute",
    bottom: -2,
  },
  centerTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
    minHeight: 64,
    position: 'relative',
  },
  centerButtonOuter: {
    position: 'absolute',
    top: -32,
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    // Fake the cutout shadow effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
  },
  centerButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#8C1D2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#8C1D2A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
  }
});
