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
  placeholder = "Search salons, hair, facials & spa…",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState(value || "");
  const expandAnim = useRef(new Animated.Value(0)).current;
  const styles = getStyles();

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
    if (onChangeText) onChangeText(text);
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
      {/* text-input component spec from cursor/DESIGN.md */}
      <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
        <Ionicons name="search" size={16} color={C.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={C.dustTaupe}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onSubmitEditing={() => onSearchSubmit && onSearchSubmit(query)}
        />
        {query ? (
          <TouchableOpacity onPress={() => handleTextChange("")} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={16} color={C.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Autocomplete Card with Timeline Pastels */}
      {isMounted ? (
        <Animated.View
          style={[styles.dropdown, { height: animHeight, marginTop: animMarginTop, opacity, transform: [{ translateY }] }]}
        >
          {filtered.map((item) => (
            <TouchableOpacity key={item.id} style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.7}>
              {/* Timeline action pill */}
              <View style={[styles.timelinePill, { backgroundColor: item.color }]}>
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

function getStyles() {
  return StyleSheet.create({
    outer: { position: "relative", zIndex: 100 },
    inputContainer: {
      height: 44,
      borderRadius: R.md,
      backgroundColor: C.surface,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: S.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    inputFocused: {
      borderColor: C.main,
    },
    searchIcon: {
      marginRight: S.xs,
    },
    input: {
      flex: 1,
      fontSize: FS.bodySm,
      color: C.ink,
      fontWeight: FW.regular,
      paddingVertical: 0,
    },
    dropdown: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      paddingVertical: S.xs,
      paddingHorizontal: S.md,
      borderWidth: 1,
      borderColor: C.border,
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
      paddingVertical: 2,
      borderRadius: R.pill,
    },
    timelinePillText: {
      fontSize: 10,
      fontWeight: FW.semiBold,
      color: C.ink,
      letterSpacing: 0.88,
    },
    rowQuery: {
      fontSize: FS.bodySm,
      color: C.ink,
      fontWeight: FW.regular,
    },
  });
}
