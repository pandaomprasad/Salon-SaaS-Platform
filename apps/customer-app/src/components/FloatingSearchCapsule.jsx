// src/components/FloatingSearchCapsule.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SAMPLE_SUGGESTIONS = [
  { id: "1", query: "Haircut", prefix: "Popular: ", bold: "Haircut & Styling" },
  { id: "2", query: "Facial", prefix: "Spa: ", bold: "Facials & Skin Care" },
  { id: "3", query: "Bridal", prefix: "Luxury: ", bold: "Bridal Makeup Suite" },
  { id: "4", query: "Pedicure", prefix: "Nails: ", bold: "Manicure & Pedicure" },
];

export default function FloatingSearchCapsule({
  value,
  onChangeText,
  onSearchSubmit,
  onSelectSuggestion,
  placeholder = "Search salons, hair, facials & spa…",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState(value || "");

  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      setIsMounted(true);
      Animated.spring(expandAnim, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start(() => setIsMounted(false));
    }
  }, [isFocused]);

  const handleTextChange = (text) => {
    setQuery(text);
    if (onChangeText) onChangeText(text);
  };

  const handleSelect = (item) => {
    setQuery(item.bold);
    if (onChangeText) onChangeText(item.bold);
    if (onSelectSuggestion) onSelectSuggestion(item.bold);
    setIsFocused(false);
  };

  const filteredSuggestions = SAMPLE_SUGGESTIONS.filter((s) =>
    query ? s.bold.toLowerCase().includes(query.toLowerCase()) : true
  );

  const opacity = expandAnim;
  const animHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 195],
  });
  const animMarginTop = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const translateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  return (
    <View style={styles.outerContainer}>
      {/* Top Floating Pill Capsule */}
      <View style={[styles.capsulePill, isFocused && styles.capsuleFocused]}>
        <Ionicons name="search-outline" size={20} color="#71717A" style={styles.searchIcon} />

        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#A1A1AA"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onSubmitEditing={() => onSearchSubmit && onSearchSubmit(query)}
        />

        {query ? (
          <TouchableOpacity onPress={() => handleTextChange("")} style={styles.rightAction}>
            <Ionicons name="close-circle" size={18} color="#A1A1AA" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.rightAction}>
            <Ionicons name="mic-outline" size={20} color="#18181B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Smooth Layout Height Expanding Autocomplete Card */}
      {isMounted ? (
        <Animated.View
          style={[
            styles.dropdownCard,
            {
              height: animHeight,
              marginTop: animMarginTop,
              opacity: opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          {filteredSuggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionRow}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={16} color="#A1A1AA" style={styles.sugIcon} />
              <Text style={styles.sugTextPrefix}>
                {item.prefix}
                <Text style={styles.sugTextBold}>{item.bold}</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "relative",
    zIndex: 100,
  },
  capsulePill: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  capsuleFocused: {
    borderColor: "#18181B",
    shadowOpacity: 0.12,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#18181B",
    fontWeight: "500",
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  rightAction: {
    padding: 4,
    marginLeft: 6,
  },

  // ──── Expanded Autocomplete Dropdown Card ────
  dropdownCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  sugIcon: {
    marginRight: 12,
  },
  sugTextPrefix: {
    fontSize: 14,
    color: "#A1A1AA",
    fontWeight: "400",
  },
  sugTextBold: {
    color: "#18181B",
    fontWeight: "700",
  },
});
