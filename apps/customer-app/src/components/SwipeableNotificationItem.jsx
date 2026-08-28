// src/components/SwipeableNotificationItem.jsx
import React, { useRef, useState, memo } from "react";
import {
  View,
  Text,
  Animated,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DELETE_BTN_WIDTH = 84;

function SwipeableNotificationItem({
  item,
  isLast,
  onPress,
  onDelete,
  renderRichBody,
  formatTimestamp,
}) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const scrollRef = useRef(null);
  const rowHeight = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentScrollX = useRef(0);

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      Haptics.impactAsync(style);
    } catch (e) {}
  };

  const closeRow = () => {
    setIsOpen(false);
    currentScrollX.current = 0;
    scrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const executeDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    Animated.parallel([
      Animated.timing(rowOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: false,
      }),
      Animated.timing(rowHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDelete(item);
    });
  };

  const handleScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    currentScrollX.current = x;
  };

  const handleMomentumScrollEnd = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    currentScrollX.current = x;
    if (x >= DELETE_BTN_WIDTH * 0.4) {
      setIsOpen(true);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setIsOpen(false);
    }
  };

  const handleScrollEndDrag = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    currentScrollX.current = x;
    if (x >= DELETE_BTN_WIDTH * 0.4) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleRowPress = () => {
    if (currentScrollX.current > 10 || isOpen) {
      closeRow();
    } else {
      onPress(item);
    }
  };

  const isUnread = !item.isRead;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: rowOpacity,
          maxHeight: rowHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 240],
          }),
          overflow: "hidden",
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}
        snapToOffsets={[0, DELETE_BTN_WIDTH]}
        snapToEnd={false}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Main Notification Card */}
        <TouchableOpacity
          style={[styles.mainCard, !isLast && styles.rowBorderBottom]}
          onPress={handleRowPress}
          activeOpacity={0.88}
        >
          {/* Left Dot Indicator */}
          <View style={styles.indicatorWrap}>
            {isUnread ? (
              <View style={styles.unreadPurpleDot} />
            ) : (
              <View style={styles.readHollowRing} />
            )}
          </View>

          {/* Right Content Column */}
          <View style={styles.contentColumn}>
            {renderRichBody(item)}
            <View style={styles.timestampRow}>
              <Text style={styles.timestampText}>{formatTimestamp(item.createdAt)}</Text>
              
              <TouchableOpacity
                style={styles.deleteHintBtn}
                onPress={executeDelete}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="trash-outline"
                  size={14}
                  color={isDark ? "#94A3B8" : "#8E8E93"}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.swipeHintText}>slide or tap to delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Slide-out Red Delete Action Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={executeDelete}
          activeOpacity={0.85}
        >
          <View style={styles.deleteContent}>
            <Ionicons name="trash" size={24} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

export default memo(SwipeableNotificationItem);

function getStyles(isDark) {
  return StyleSheet.create({
    wrapper: {
      width: SCREEN_WIDTH,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    scrollContainer: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    mainCard: {
      width: SCREEN_WIDTH,
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 16,
      paddingHorizontal: 22,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    rowBorderBottom: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#26262E" : "#EFEFF4",
    },
    indicatorWrap: {
      width: 22,
      paddingTop: 5,
      alignItems: "flex-start",
    },
    unreadPurpleDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#6C5CE7",
    },
    readHollowRing: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: isDark ? "#55555E" : "#C7C7CC",
      backgroundColor: "transparent",
    },
    contentColumn: {
      flex: 1,
    },
    timestampRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
    },
    timestampText: {
      fontSize: 12,
      color: isDark ? "#7C7C82" : "#A0A0A5",
      fontWeight: "400",
    },
    deleteHintBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#F3F4F6",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    swipeHintText: {
      fontSize: 11,
      color: isDark ? "#94A3B8" : "#6B7280",
      fontWeight: "600",
    },
    deleteButton: {
      width: DELETE_BTN_WIDTH,
      backgroundColor: "#EF4444",
      justifyContent: "center",
      alignItems: "center",
    },
    deleteContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    deleteButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      marginTop: 3,
      letterSpacing: 0.3,
    },
  });
}
