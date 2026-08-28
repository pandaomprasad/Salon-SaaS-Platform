// src/components/SkeletonLoader.jsx
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { C, R, S } from "../theme";

export function SkeletonBox({ width, height, borderRadius = R.md, style }) {
  const styles = getStyles();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width: width !== undefined ? width : "100%",
          height: height !== undefined ? height : 20,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SalonCardSkeleton({ variant = "default" }) {
  const styles = getStyles();
  if (variant === "compact") {
    return (
      <View style={styles.compactCardSkeleton}>
        <SkeletonBox width={58} height={58} borderRadius={12} />
        <View style={styles.compactSkeletonInfo}>
          <SkeletonBox width="48%" height={14} style={{ marginBottom: 7 }} />
          <SkeletonBox width="82%" height={11} style={{ marginBottom: 9 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <SkeletonBox width={58} height={10} />
            <SkeletonBox width={42} height={10} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardSkeleton}>
      <SkeletonBox height={160} borderRadius={R.lg} style={{ marginBottom: S.xs }} />
      <View style={{ paddingHorizontal: S.xs }}>
        <SkeletonBox width="70%" height={18} style={{ marginBottom: 8 }} />
        <SkeletonBox width="45%" height={14} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <SkeletonBox width="30%" height={14} />
          <SkeletonBox width="25%" height={14} />
        </View>
      </View>
    </View>
  );
}

export function ServiceCardSkeleton() {
  const styles = getStyles();
  return (
    <View style={styles.serviceSkeleton}>
      <View style={{ flex: 1, paddingRight: S.sm }}>
        <SkeletonBox width="60%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="85%" height={12} style={{ marginBottom: 8 }} />
        <SkeletonBox width="30%" height={14} />
      </View>
      <SkeletonBox width={70} height={70} borderRadius={R.md} />
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
  box: {
    backgroundColor: C.border,
  },
  cardSkeleton: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: S.xs,
    marginBottom: S.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  compactCardSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  compactSkeletonInfo: {
    flex: 1,
    marginLeft: 11,
  },
  serviceSkeleton: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: S.sm,
    marginBottom: S.xs,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  });
}
