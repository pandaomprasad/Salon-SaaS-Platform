// src/screen/SupportScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FAQS = [
  {
    id: "f1",
    question: "How do I cancel or reschedule an appointment?",
    answer: "Go to your 'Visits' tab, select your upcoming appointment, and tap 'Reschedule' or 'Cancel Booking'. Please check salon policy as cancellations within 2 hours may incur fees.",
  },
  {
    id: "f2",
    question: "What payment methods are accepted?",
    answer: "Salons accept all major Credit/Debit cards, Apple Pay, Google Pay, UPI, and Pay-at-Salon cash/card options.",
  },
  {
    id: "f3",
    question: "Can I choose my specific stylist or barber?",
    answer: "Yes! During the booking process, choose your preferred specialist from the specialist selector or select 'Any Specialist' for earliest availability.",
  },
  {
    id: "f4",
    question: "How do Luxe Loyalty Rewards work?",
    answer: "You earn 1 Luxe Point for every $1 spent at participating salons. Points can be redeemed for instant discount vouchers on future appointments.",
  },
];

export default function SupportScreen({ goBack }) {
  const [expandedId, setExpandedId] = useState("f1");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSendTicket = () => {
    if (!ticketMessage.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setTicketSubject("");
      setTicketMessage("");
      setTimeout(() => setSentSuccess(false), 2000);
    }, 1000);
  };

  const styles = getStyles();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 0);
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 20 : Math.max(insets.bottom, 20) + 20;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color={C.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIcon}>
            <Ionicons name="headset" size={24} color={C.bg} />
          </View>
          <Text style={styles.bannerTitle}>How can we assist you today?</Text>
          <Text style={styles.bannerSub}>Our concierge support team is here 24/7 to ensure a seamless experience.</Text>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleAccordion(faq.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={C.muted}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqAnswerBox}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Support Ticket Section */}
        <Text style={styles.sectionHeader}>SEND US A MESSAGE</Text>
        <View style={styles.ticketCard}>
          <Text style={styles.ticketCardSub}>Have a specific request or issue? Submit a ticket below.</Text>

          <TextInput
            style={styles.input}
            placeholder="Subject / Topic (e.g. Refund Request)"
            placeholderTextColor={C.dustTaupe}
            value={ticketSubject}
            onChangeText={setTicketSubject}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your inquiry or concern in detail…"
            placeholderTextColor={C.dustTaupe}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={ticketMessage}
            onChangeText={setTicketMessage}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!ticketMessage.trim() || sending) && styles.disabledBtn]}
            onPress={handleSendTicket}
            disabled={!ticketMessage.trim() || sending}
            activeOpacity={0.88}
          >
            {sending ? (
              <ActivityIndicator color={C.bg} size="small" />
            ) : sentSuccess ? (
              <Text style={styles.sendBtnText}>✓ Ticket Submitted!</Text>
            ) : (
              <Text style={styles.sendBtnText}>Submit Support Ticket</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 54,
      paddingHorizontal: S.md,
      paddingBottom: S.md,
      borderBottomWidth: 1,
      borderBottomColor: C.borderLight,
      backgroundColor: C.bg,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: R.md,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    headerTitle: {
      fontSize: FS.titleSm,
      fontWeight: FW.semiBold,
      color: C.ink,
    },
    content: {
      paddingHorizontal: S.md,
      paddingTop: S.md,
      paddingBottom: 40,
    },
    bannerCard: {
      backgroundColor: C.ink,
      borderRadius: R.lg,
      padding: S.lg,
      alignItems: "center",
      marginBottom: S.md,
      borderWidth: 1,
      borderColor: C.borderDark,
    },
    bannerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(128, 128, 128, 0.25)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: S.xs,
    },
    bannerTitle: {
      fontSize: FS.titleSm,
      fontWeight: FW.semiBold,
      color: C.bg,
      textAlign: "center",
    },
    bannerSub: {
      fontSize: FS.bodySm,
      color: C.bg,
      opacity: 0.75,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 18,
    },
    sectionHeader: {
      ...TYPO.eyebrow,
      color: C.main,
      marginBottom: S.xs,
      marginTop: S.sm,
    },
    faqList: {
      gap: S.xs,
      marginBottom: S.md,
    },
    faqCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      paddingHorizontal: S.md,
      paddingVertical: S.sm + 2,
      borderWidth: 1,
      borderColor: C.border,
    },
    faqQuestionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    faqQuestion: {
      flex: 1,
      fontSize: FS.bodySm,
      fontWeight: FW.semiBold,
      color: C.ink,
      marginRight: S.xs,
    },
    faqAnswerBox: {
      marginTop: S.xs,
      paddingTop: S.xs,
      borderTopWidth: 1,
      borderTopColor: C.borderLight,
    },
    faqAnswer: {
      fontSize: FS.bodySm,
      color: C.body,
      lineHeight: 20,
    },
    ticketCard: {
      backgroundColor: C.surface,
      borderRadius: R.lg,
      padding: S.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    ticketCardSub: {
      fontSize: FS.bodySm,
      color: C.body,
      marginBottom: S.sm,
    },
    input: {
      backgroundColor: C.surface,
      borderRadius: R.md,
      paddingHorizontal: S.sm,
      height: 44,
      fontSize: FS.bodySm,
      color: C.ink,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: S.xs,
    },
    textArea: {
      height: 90,
      paddingVertical: S.xs,
    },
    sendBtn: {
      backgroundColor: C.main,
      paddingVertical: 12,
      borderRadius: R.md,
      alignItems: "center",
      marginTop: S.xs,
    },
    disabledBtn: {
      opacity: 0.5,
    },
    sendBtnText: {
      color: C.bg,
      fontSize: FS.bodySm,
      fontWeight: FW.medium,
    },
  });
}
