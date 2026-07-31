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
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";



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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#1A1714" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIcon}>
            <Ionicons name="headset" size={28} color="#FFFFFF" />
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
                    size={18}
                    color="#8E8880"
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

        {/* Contact Ticket Form */}
        <Text style={styles.sectionHeader}>CONTACT SUPPORT</Text>
        <View style={styles.ticketCard}>
          <Text style={styles.ticketCardSub}>
            Can't find what you need? Send a direct message to our support team.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Subject (e.g. Booking issue, Refund request)"
            placeholderTextColor="#9CA3AF"
            value={ticketSubject}
            onChangeText={setTicketSubject}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your question or issue in detail..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={ticketMessage}
            onChangeText={setTicketMessage}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!ticketMessage.trim() || sending) && styles.disabledBtn]}
            onPress={handleSendTicket}
            disabled={!ticketMessage.trim() || sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.lg,
    paddingTop: 54,
    paddingBottom: S.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1714",
  },
  content: {
    padding: S.lg,
  },
  bannerCard: {
    backgroundColor: "#1A1714",
    borderRadius: 24,
    padding: S.lg,
    alignItems: "center",
    marginBottom: S.lg,
  },
  bannerIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.sm,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  bannerSub: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: C.gold,
    letterSpacing: 1.1,
    marginBottom: S.sm,
    marginTop: S.sm,
  },
  faqList: {
    gap: 8,
    marginBottom: S.lg,
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1714",
    marginRight: 10,
  },
  faqAnswerBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.04)",
  },
  faqAnswer: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: S.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  ticketCardSub: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: S.md,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1714",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: S.sm,
  },
  textArea: {
    height: 100,
  },
  sendBtn: {
    backgroundColor: "#1A1714",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
