// src/components/ErrorCardModal.jsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";

export default function ErrorCardModal({
  visible,
  title = "Notice",
  message,
  onClose,
  buttonText = "Got It",
}) {
  const styles = getStyles();
  if (!visible || !message) return null;

  return (
    <Modal
      visible={!!visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              {/* Close Button Top Right */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={C.muted} />
              </TouchableOpacity>

              {/* Icon Badge */}
              <View style={styles.iconWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="warning-sharp" size={32} color={C.error} />
                </View>
              </View>

              {/* Text Content */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onClose}
                activeOpacity={0.88}
              >
                <Text style={styles.actionBtnText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function getStyles() {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(13, 11, 24, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: S.lg,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: S.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(189, 68, 68, 0.2)",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: S.md,
    right: S.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bone,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  iconWrapper: {
    marginBottom: S.md,
    marginTop: S.xs,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.errorBg,
    borderWidth: 1.5,
    borderColor: C.error,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    textAlign: "center",
    marginBottom: S.xs,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: S.xl,
    paddingHorizontal: S.sm,
  },
  actionBtn: {
    width: "100%",
    backgroundColor: C.dark,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.main,
    letterSpacing: 0.3,
  },
  });
}
