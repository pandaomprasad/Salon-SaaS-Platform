// src/components/FloatingSearchCapsule.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const SAMPLE_SUGGESTIONS = [
  { id: "1", stage: "SALON", query: "Royal Cut Luxury Salon" },
  { id: "2", stage: "POPULAR", query: "Haircut & Styling" },
  { id: "3", stage: "SPA", query: "Facials & Skin Care" },
  { id: "4", stage: "LUXURY", query: "Bridal Makeup" },
  { id: "5", stage: "NAILS", query: "Manicure & Pedicure" },
];

const CATEGORIES = [
  { id: "1", label: "Haircut", icon: "✂️" },
  { id: "2", label: "Facials", icon: "🧴" },
  { id: "3", label: "Nails", icon: "💅" },
  { id: "4", label: "Spa & Body", icon: "💆‍♀️" },
  { id: "5", label: "Beard", icon: "✨" },
];

export default function FloatingSearchCapsule({
  value,
  onChangeText,
  onSearchSubmit,
  onSelectSuggestion,
  onFilterPress,
  onLocationClick,
  onSparkleClick,
  selectedCity = "Brahmapur",
  selectedState = "Odisha",
  placeholder = "Search luxury stays, salons & spa",
  showDropdown = true,
}) {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState(value || "");
  const expandAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef(null);
  const styles = getStyles(isDark);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      setIsMounted(true);
      Animated.spring(expandAnim, { toValue: 1, friction: 9, tension: 90, useNativeDriver: false }).start();
    } else {
      Animated.timing(expandAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => setIsMounted(false));
    }
  }, [isFocused]);

  const handleTextChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (onChangeText) onChangeText(text);
    }, 300);
  };

  const handleSelect = (item) => {
    const q = typeof item === "string" ? item : item.query;
    setQuery(q);
    if (onChangeText) onChangeText(q);
    if (onSelectSuggestion) onSelectSuggestion(q);
    if (onSearchSubmit) onSearchSubmit(q);
    setIsFocused(false);
  };

  const filtered = SAMPLE_SUGGESTIONS.filter((s) =>
    query ? s.query.toLowerCase().includes(query.toLowerCase()) : true
  );

  const cardHeight = Math.min(filtered.length * 46 + 16, 210);

  const opacity = expandAnim;
  const animHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, cardHeight] });
  const animMarginTop = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const translateY = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  return (
    <View style={styles.outer}>
      {/* Outer Dark Search Container */}
      <View style={styles.cardContainer}>
        {/* Top Dark Header Row */}
        <View style={styles.darkHeaderBlock}>
          <TouchableOpacity
            style={styles.locationGroup}
            onPress={onLocationClick}
            activeOpacity={0.85}
          >
            <View style={styles.locationIconBox}>
              <Ionicons name="location" size={17} color="#FFFFFF" />
            </View>
            <View style={styles.locationTextStack}>
              <Text style={styles.locationTitleText}>
                {selectedCity}{selectedState ? `, ${selectedState}` : ", Odisha"}
              </Text>
              <Text style={styles.locationSubText}>Find the perfect salon for you</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* White Floating Overlay Card */}
        <View style={styles.whiteCardOverlay}>
          {/* Search Bar Input + Filter Button */}
          <View style={styles.searchRow}>
            <View style={styles.inputPillContainer}>
              <Ionicons name="search-outline" size={18} color={isDark ? "#A0A09C" : "#666666"} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={handleTextChange}
                placeholder={placeholder}
                placeholderTextColor={isDark ? "#8E8E93" : "#9498A4"}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onSubmitEditing={() => onSearchSubmit && onSearchSubmit(query)}
              />
              {query ? (
                <TouchableOpacity onPress={() => handleTextChange("")} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={16} color="#8E8E93" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Circle Dark Filter Button */}
            <TouchableOpacity
              style={styles.darkFilterBtn}
              onPress={onFilterPress}
              activeOpacity={0.85}
            >
              <Ionicons name="funnel" size={16} color="#CCFF00" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryPill}
                onPress={() => handleSelect(cat.label)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIconText}>{cat.icon}</Text>
                <Text style={styles.categoryLabelText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Autocomplete Suggestions Card */}
      {showDropdown && isMounted && filtered.length > 0 ? (
        <Animated.View
          style={[
            styles.dropdown,
            {
              maxHeight: animHeight,
              marginTop: animMarginTop,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          {filtered.map((item) => (
            <TouchableOpacity key={item.id} style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              <View style={styles.timelinePill}>
                <Text style={styles.timelinePillText}>{item.stage}</Text>
              </View>
              <Text style={styles.rowQuery}>{item.query}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    outer: {
      position: "relative",
      zIndex: 100,
      marginVertical: 4,
    },
    cardContainer: {
      backgroundColor: isDark ? "#121216" : "#16161B",
      borderRadius: 28,
      padding: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 6,
    },
    darkHeaderBlock: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 6,
      paddingTop: 4,
      paddingBottom: 10,
    },
    locationGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    locationIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#2C2C34",
      alignItems: "center",
      justifyContent: "center",
    },
    locationTextStack: {
      justifyContent: "center",
    },
    locationTitleText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    locationSubText: {
      color: "#9498A4",
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: -0.1,
      marginTop: 1,
    },
    sparkleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#CCFF00",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#CCFF00",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    whiteCardOverlay: {
      backgroundColor: isDark ? "#1C1C22" : "#FFFFFF",
      borderRadius: 22,
      padding: 5,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    inputPillContainer: {
      flex: 1,
      height: 44,
      borderRadius: 18,
      backgroundColor: isDark ? "#2C2C34" : "#F2F3F5",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
      paddingVertical: 0,
    },
    darkFilterBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? "#2C2C34" : "#16161B",
      alignItems: "center",
      justifyContent: "center",
    },
    categoryScrollContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 2,
      gap: 8,
    },
    categoryPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2C2C34" : "#F5F6F8",
      borderRadius: 16,
      paddingHorizontal: 13,
      paddingVertical: 7,
      gap: 6,
    },
    categoryIconText: {
      fontSize: 13.5,
    },
    categoryLabelText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: isDark ? "#E5E5EA" : "#2C2C2E",
    },
    dropdown: {
      backgroundColor: isDark ? "#1C1C22" : "#FFFFFF",
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2C2C34" : "#EBECEF",
      overflow: "hidden",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      gap: 10,
    },
    timelinePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: "rgba(204, 255, 0, 0.15)",
    },
    timelinePillText: {
      fontSize: 10,
      fontWeight: "700",
      color: isDark ? "#CCFF00" : "#16161B",
      letterSpacing: 0.5,
    },
    rowQuery: {
      fontSize: 13.5,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
  });
}
