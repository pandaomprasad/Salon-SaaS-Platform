// src/screen/SupportScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  StatusBar,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

const FAQS_DATA = [
  {
    id: "f1",
    question: "What is Flo Cutters?",
    answer: "Flo Cutters (ST CUT) is a premier salon booking platform connecting you with top-rated hair stylists, beauty salons, and luxury spa treatments near you.",
  },
  {
    id: "f2",
    question: "How much does this cost?",
    answer: "We provide high-end services without the high-end price. A moderate price allows us to provide the high end services you enjoy and the lower price allows you to enjoy it more often! Prices for services are subject to consultation.",
  },
  {
    id: "f3",
    question: "Do you accept paypal?",
    answer: "Yes, we accept PayPal, UPI, major Credit/Debit Cards, Net Banking, and Pay at Salon options for your convenience.",
  },
  {
    id: "f4",
    question: "Where are you located?",
    answer: "We partner with certified salons located across major cities. You can search by your live location or browse salons in your area directly on the home map.",
  },
  {
    id: "f5",
    question: "Can I just come in or do I have to make an appointment?",
    answer: "While walk-ins are accepted based on slot availability, we strongly recommend booking an appointment in advance through the app to guarantee your preferred time and stylist.",
  },
];

export default function SupportScreen({ goBack }) {
  const { isDark } = useTheme();
  const [expandedId, setExpandedId] = useState("f2"); // Default expanded "How much does this cost?" matching reference mockup

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FAQs</Text>
        <TouchableOpacity onPress={goBack} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={isDark ? "#FFFFFF" : "#18181B"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.faqList}>
          {FAQS_DATA.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqRow}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleAccordion(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  <Ionicons
                    name={isExpanded ? "remove" : "add"}
                    size={20}
                    color={isExpanded ? (isDark ? "#9999A0" : "#8E8E93") : (isDark ? "#66666E" : "#C7C7CC")}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: TOP_INSET,
      paddingHorizontal: 24,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2A2A34" : "#EFEFF4",
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#18181B",
      letterSpacing: -0.3,
    },
    closeBtn: {
      padding: 4,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 40,
    },
    faqList: {
      flexDirection: "column",
    },
    faqRow: {
      paddingVertical: 18,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2A2A34" : "#F4F4F6",
    },
    faqQuestionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    faqQuestionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginRight: 16,
      lineHeight: 21,
    },
    answerContainer: {
      paddingTop: 12,
      paddingBottom: 4,
    },
    answerText: {
      fontSize: 13.5,
      fontWeight: "400",
      color: isDark ? "#9999A0" : "#71717A",
      lineHeight: 20,
    },
  });
}
