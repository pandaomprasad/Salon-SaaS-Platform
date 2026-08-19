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
import { C, S, FS, FW, R } from "../theme";
import { useTheme } from "../context/ThemeContext";

const SAMPLE_SUGGESTIONS = [
  { id: "1", stage: "POPULAR", color: C.grep, query: "Haircut & Styling" },
  { id: "2", stage: "SPA", color: C.read, query: "Facials & Skin Care" },
  { id: "3", stage: "LUXURY", color: C.edit, query: "Bridal Makeup" },
  { id: "4", stage: "NAILS", color: C.thinking, query: "Manicure & Pedicure" },
];

export default function FloatingSearchCapsule({
  value,
  onChangeText,
  onSearchSubmit,
  onSelectSuggestion,
  onFilterPress,
  placeholder = "Search by salon name or service...",
}) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState(value || "");
  const expandAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef(null);
  const styles = getStyles();

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
    setQuery(item.query);
    if (onChangeText) onChangeText(item.query);
    if (onSelectSuggestion) onSelectSuggestion(item.query);
    setIsFocused(false);
  };

  const filtered = SAMPLE_SUGGESTIONS.filter((s) =>
    query ? s.query.toLowerCase().includes(query.toLowerCase()) : true
  );

  const opacity = expandAnim;
  const animHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 190] });
  const animMarginTop = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const translateY = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  return (
    <View style={styles.outer}>
      <View style={styles.searchRow}>
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: isFocused ? theme.primary : theme.hairline }]}>
          <Ionicons name="search" size={18} color={theme.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: theme.ink }]}
            value={query}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor={theme.mutedSoft}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onSubmitEditing={() => onSearchSubmit && onSearchSubmit(query)}
          />
          {query ? (
            <TouchableOpacity onPress={() => handleTextChange("")} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={theme.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Integrated Solid Gold Filter Button */}
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: theme.primary }]}
          onPress={onFilterPress}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Autocomplete Card */}
      {isMounted ? (
        <Animated.View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.surface,
              borderColor: theme.hairline,
              height: animHeight,
              marginTop: animMarginTop,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          {filtered.map((item) => (
            <TouchableOpacity key={item.id} style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              <View style={[styles.timelinePill, { backgroundColor: theme.goldTint }]}>
                <Text style={[styles.timelinePillText, { color: theme.primary }]}>{item.stage}</Text>
              </View>
              <Text style={[styles.rowQuery, { color: theme.ink }]}>{item.query}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    outer: { position: "relative", zIndex: 100 },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inputContainer: {
      flex: 1,
      height: 48,
      borderRadius: R.md,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.md,
      borderWidth: 1,
    },
    searchIcon: {
      marginRight: S.xs,
    },
    input: {
      flex: 1,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
      paddingVertical: 0,
    },
    filterBtn: {
      width: 48,
      height: 48,
      borderRadius: R.md,
      alignItems: "center",
      justifyContent: "center",
    },
    dropdown: {
      borderRadius: R.lg,
      paddingVertical: S.xs,
      paddingHorizontal: S.md,
      borderWidth: 1,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: S.sm,
      gap: S.xs,
    },
    timelinePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: R.pill,
    },
    timelinePillText: {
      fontSize: 10,
      fontWeight: FW.bold,
      letterSpacing: 0.88,
    },
    rowQuery: {
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
  });
}
