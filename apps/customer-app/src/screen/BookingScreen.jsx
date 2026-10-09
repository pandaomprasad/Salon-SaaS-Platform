import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, StatusBar, Image } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';
import SlotPicker from '../components/SlotPicker';
import ErrorCardModal from '../components/ErrorCardModal';
import ConflictModal from '../components/ConflictModal';
import { browseService } from '../services/browseService';
import { appointmentService } from '../services/appointmentService';
import { paiseToINR, toLocalDateStr } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VerifyEmailModal from '../components/VerifyEmailModal';

export default function BookingScreen({ salon, branch, service, selectedServices, goBack, navigate }) {
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 12 : Math.max(insets.bottom, 16) + 8;
  const todayObj = new Date();
  const todayStr = toLocalDateStr(todayObj);

  const allServices = selectedServices && selectedServices.length > 0 ? selectedServices : (service ? [service] : []);
  const rawTotalPrice = allServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDurationMinutes = allServices.reduce((sum, s) => sum + (s.durationMinutes || s.duration || 30), 0);

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => {
    if (!branch) return;
    let cancelled = false;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setErrorMessage(null);
      try {
        const branchId = branch._id || branch.id || branch;
        const sId = service ? (service._id || service.id) : undefined;
        const res = await browseService.getBranchSlots(branchId, selectedDate, undefined, sId);
        if (cancelled) return;
        const raw = res.data?.availability || res.data?.slots || (Array.isArray(res.data) ? res.data : []);
        const slotMap = new Map();
        if (Array.isArray(raw)) {
          raw.forEach((item) => {
            if (item.slots && Array.isArray(item.slots)) {
              item.slots.forEach((s) => {
                const timeKey = s.startTime;
                if (!timeKey) return;
                const newSlot = { _id: s.slotId, startTime: s.startTime, endTime: s.endTime, staffName: item.staffName, status: s.status || 'AVAILABLE' };
                if (!slotMap.has(timeKey)) { slotMap.set(timeKey, newSlot); } else {
                  const existing = slotMap.get(timeKey);
                  const existingAvailable = (existing.status || '').toUpperCase() === 'AVAILABLE';
                  const newAvailable = (newSlot.status || '').toUpperCase() === 'AVAILABLE';
                  if (!existingAvailable && newAvailable) { slotMap.set(timeKey, newSlot); }
                }
              });
            } else {
              const timeKey = item.startTime || item.time;
              if (timeKey && !slotMap.has(timeKey)) { slotMap.set(timeKey, item); }
            }
          });
        }
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const isToday = selectedDate === todayStr;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const filteredSlots = Array.from(slotMap.values()).filter((slot) => {
          if (!isToday) return true;
          const [h, m] = (slot.startTime || '').split(':').map(Number);
          if (isNaN(h)) return true;
          return (h * 60 + (m || 0)) > currentMinutes;
        });
        setSlots(filteredSlots);
      } catch (err) {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, [branch, selectedDate]);

  const handleConfirmBooking = async () => {
    setErrorMessage(null);
    if (!isAuthenticated) {
      if (navigate) {
        navigate('Login', { redirectTo: 'Booking', redirectData: { salon, branch, service, selectedServices: allServices } });
      }
      return;
    }
    const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);
    if (user && !isVerified) {
      setShowVerifyModal(true);
      return;
    }
    setSubmitting(true);
    try {
      const slotId = selectedSlot._id || selectedSlot.id;
      const serviceId = service ? (service._id || service.id) : (allServices[0]?._id || allServices[0]?.id);
      const serviceIds = allServices.map((s) => s._id || s.id).filter(Boolean);

      await appointmentService.bookAppointment({
        slotId, serviceId, serviceIds, customerNotes: '', guests: 1,
      });
      setBookingSuccess(true);
    } catch (err) {
      if (err.conflictAppointment || (err.message && err.message.toLowerCase().includes('already have an appointment'))) {
        setConflictData(err.conflictAppointment || { salonName: salon?.name, serviceName: service?.name, date: selectedDate, startTime: selectedSlot?.startTime });
        setConflictModalVisible(true);
      } else {
        setErrorMessage(err.message || err.toString() || 'Failed to book appointment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = getStyles();



  const primarySvc = allServices[0] || {};
  const branchName = branch?.name || salon?.name || "Royal Cut Luxury Salon & Spa";
  const branchAddress = branch?.address?.city || branch?.address?.street || "Brahmapur Main Road";
  const rawRating =
    typeof salon?.rating === "number" || typeof salon?.rating === "string"
      ? salon.rating
      : salon?.rating?.avgScore ||
        salon?.avgRating ||
        salon?.ratingAverage ||
        salon?.reviewAvg ||
        branch?.rating ||
        branch?.avgRating ||
        5.0;

  const numericRating =
    typeof rawRating === "number"
      ? rawRating
      : parseFloat(rawRating) || 5.0;

  const ratingStr = numericRating.toFixed(1);

  const reviewCount =
    typeof salon?.reviewCount === "number" && salon.reviewCount > 0
      ? salon.reviewCount
      : typeof salon?.totalReviews === "number" && salon.totalReviews > 0
      ? salon.totalReviews
      : typeof salon?.reviewsCount === "number" && salon.reviewsCount > 0
      ? salon.reviewsCount
      : typeof salon?.rating?.totalReviews === "number" && salon.rating.totalReviews > 0
      ? salon.rating.totalReviews
      : Array.isArray(salon?.reviews) && salon.reviews.length > 0
      ? salon.reviews.length
      : typeof branch?.reviewCount === "number" && branch.reviewCount > 0
      ? branch.reviewCount
      : 0;

  const formattedReviews =
    reviewCount >= 1000
      ? (reviewCount / 1000).toFixed(1).replace(/\.0$/, "") + "k"
      : reviewCount;

  const rating = ratingStr;
  const distance = branch?.distance ? ` • ${branch.distance} km` : salon?.distance ? ` • ${salon.distance} km` : " • 1.2 km";

  const formattedDate = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const handleShareBooking = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #6F2A3B; margin: 0; font-size: 28px; }
              .header p { color: #6B7280; font-size: 16px; margin-top: 8px; }
              .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; background: #F9FAFB; }
              .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
              .row:last-child { border-bottom: none; }
              .label { color: #6B7280; font-weight: 600; font-size: 14px; }
              .value { font-weight: 700; font-size: 14px; text-align: right; }
              .value-sub { color: #6B7280; font-size: 12px; font-weight: normal; margin-top: 4px; }
              .footer { text-align: center; margin-top: 40px; color: #6B7280; font-size: 14px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Your appointment is secured.</p>
            </div>
            <div class="card">
              <div class="row">
                <div class="label">Service</div>
                <div class="value">
                  ${primarySvc.name || "Haircut & Styling"}
                  <div class="value-sub">${totalDurationMinutes} mins • ${paiseToINR(rawTotalPrice)}</div>
                </div>
              </div>
              <div class="row">
                <div class="label">Date & Time</div>
                <div class="value">${formattedDate} • ${selectedSlot?.startTime || '10:30 AM'}</div>
              </div>
              <div class="row">
                <div class="label">Location</div>
                <div class="value">
                  ${branchName}
                  <div class="value-sub">${branchAddress}</div>
                </div>
              </div>
              <div class="row">
                <div class="label">Stylist</div>
                <div class="value">Any Available</div>
              </div>
            </div>
            <div class="footer">
              Thank you for choosing us! Self care is a step towards a happier you.
            </div>
          </body>
        </html>
      `;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setErrorMessage("Sharing is not available on this device.");
        return;
      }
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Booking Receipt' });
    } catch (error) {
      console.error("Share error:", error);
      setErrorMessage(error.message || "Could not generate or share PDF");
    }
  };

  if (bookingSuccess) {
    return (
      <ScrollView contentContainerStyle={[styles.successScreenWrapper, { paddingTop: topInset + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.successHeader}>
          <View style={styles.successCheckRing}>
            <Ionicons name="checkmark" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Booking Successful!</Text>
          <Text style={styles.successSub}>
            Your appointment has been confirmed.{"\n"}We look forward to seeing you!
          </Text>
        </View>

        <View style={styles.successDetailsCard}>
          <View style={styles.successServiceRow}>
            <Image source={{ uri: primarySvc.image || salon?.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500' }} style={styles.successServiceImg} />
            <View style={styles.successServiceInfo}>
              <Text style={styles.successServiceName}>{primarySvc.name || "Haircut & Styling"}</Text>
              <Text style={styles.successServiceDesc}>Professional haircut with styling</Text>
              <View style={styles.successServiceMeta}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.successServiceMetaText}>{totalDurationMinutes} mins</Text>
                <Ionicons name="pricetag-outline" size={14} color="#6B7280" style={{ marginLeft: 12 }} />
                <Text style={styles.successServiceMetaText}>{paiseToINR(rawTotalPrice)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: '#FDF9FA' }]}>
              <Ionicons name="person-outline" size={18} color="#6F2A3B" />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Stylist</Text>
              <Text style={styles.successDetailValue}>Any Available</Text>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: '#FDF9FA' }]}>
              <Ionicons name="calendar-outline" size={18} color="#6F2A3B" />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Date & Time</Text>
              <Text style={styles.successDetailValue}>{formattedDate} • {selectedSlot?.startTime || '10:30 AM'}</Text>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: '#FDF9FA' }]}>
              <Ionicons name="location-outline" size={18} color="#6F2A3B" />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Location</Text>
              <Text style={styles.successDetailValue}>{branchName}</Text>
              <Text style={styles.successDetailSubValue}>{branchAddress}</Text>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: '#FDF9FA' }]}>
              <Ionicons name="document-text-outline" size={18} color="#6F2A3B" />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Booking ID</Text>
              <Text style={styles.successDetailValue}>#BG{Math.floor(100000 + Math.random() * 900000)}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.viewBookingsBtn} onPress={() => navigate && navigate('Bookings')} activeOpacity={0.88}>
          <Text style={styles.viewBookingsText}>View My Bookings</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareBooking} activeOpacity={0.75}>
          <Ionicons name="share-outline" size={18} color="#6F2A3B" style={{ marginRight: 8 }} />
          <Text style={styles.shareBtnText}>Share Booking</Text>
        </TouchableOpacity>

        <View style={styles.successFooter}>
          <View style={styles.leafCircle}>
            <Ionicons name="leaf" size={16} color="#6F2A3B" />
          </View>
          <Text style={styles.footerQuote}>Self care is a step{"\n"}towards a happier you!</Text>
          <View style={styles.heartRow}>
            <View style={styles.heartLine} />
            <Ionicons name="heart-outline" size={16} color="#6F2A3B" style={{ marginHorizontal: 8 }} />
            <View style={styles.heartLine} />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ErrorCardModal visible={!!errorMessage} title="Booking Notice" message={errorMessage} onClose={() => setErrorMessage(null)} />
      <ConflictModal visible={conflictModalVisible} conflictData={conflictData} onClose={() => setConflictModalVisible(false)} onViewAppointments={() => { setConflictModalVisible(false); if (navigate) navigate('Bookings'); }} />
      <VerifyEmailModal visible={showVerifyModal} email={user?.email} onClose={() => setShowVerifyModal(false)} onVerified={() => setShowVerifyModal(false)} />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A24" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{step === 1 ? "Select Date & Time" : "Booking Summary"}</Text>
        <Text style={styles.pageSubTitle}>
          {step === 1 ? "Choose your preferred date and time for the appointment" : "Review your booking details before confirming"}
        </Text>

        <View style={styles.salonCard}>
          <Image source={{ uri: salon?.coverImage || salon?.images?.[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500' }} style={styles.salonImg} />
          <View style={styles.salonInfo}>
            <Text style={styles.salonName} numberOfLines={1}>{branchName}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.ratingTxt}>{rating} ({formattedReviews} reviews)</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#8A8A9E" />
              <Text style={styles.locationTxt} numberOfLines={1}>{branchAddress}{distance}</Text>
            </View>
          </View>
        </View>

        {step === 1 ? (
          <>
            <View style={styles.serviceCard}>
              <View style={styles.svcIconWrap}><Ionicons name="cut-outline" size={20} color="#6F2A3B" /></View>
              <View style={styles.svcInfo}>
                <Text style={styles.svcName} numberOfLines={1}>{primarySvc.name || "Haircut - Classic"}</Text>
                <Text style={styles.svcSub}>{totalDurationMinutes} mins · Stylist: Any</Text>
              </View>
              <Text style={styles.svcPrice}>{paiseToINR(rawTotalPrice)}</Text>
            </View>

            {loadingSlots ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#6F2A3B" />
                <Text style={styles.loadingText}>Fetching available time slots…</Text>
              </View>
            ) : (
              <SlotPicker slots={slots} selectedSlot={selectedSlot} serviceDurationMinutes={totalDurationMinutes} onSelectSlot={setSelectedSlot} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            )}
          </>
        ) : (
          <>
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Ionicons name="albums-outline" size={16} color="#6F2A3B" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Service</Text>
                  <View style={styles.summaryValWrap}>
                    <Text style={styles.summaryVal}>{primarySvc.name || "Haircut - Classic"}</Text>
                    <Text style={styles.summaryValSub}>{totalDurationMinutes} mins</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6F2A3B" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryVal}>{formattedDate}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="time-outline" size={16} color="#6F2A3B" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryVal}>{selectedSlot?.startTime || '10:00 AM'} - {selectedSlot?.endTime || '10:30 AM'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="person-outline" size={16} color="#6F2A3B" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Stylist</Text>
                  <Text style={styles.summaryVal}>Any Available</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="location-outline" size={16} color="#6F2A3B" style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Salon Address</Text>
                  <View style={styles.summaryValWrap}>
                    <Text style={styles.summaryVal}>{branchName}</Text>
                    <Text style={styles.summaryValSub}>{branchAddress}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Price Details</Text>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
                  <Text style={styles.priceLabel}>Service Price</Text>
                  <Text style={styles.priceVal}>{paiseToINR(rawTotalPrice)}</Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 1, borderBottomColor: "#F4F5F8", paddingBottom: 12, paddingTop: 4 }]}>
                  <Text style={styles.priceLabel}>Platform Fee <Ionicons name="information-circle-outline" size={12} color="#8A8A9E" /></Text>
                  <Text style={styles.priceVal}>₹0</Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingTop: 12 }]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalVal}>{paiseToINR(rawTotalPrice)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cancellationBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <View style={styles.cancelTextWrap}>
                <Text style={styles.cancelTitle}>Free Cancellation</Text>
                <Text style={styles.cancelSub}>Cancel up to 2 hours before your appointment</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#059669" />
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset }]}>
        {step === 1 ? (
          <TouchableOpacity 
            style={[styles.mainBtn, (!selectedSlot || loadingSlots) && styles.btnDisabled]} 
            disabled={!selectedSlot || loadingSlots} 
            onPress={() => setStep(2)}
          >
            <Text style={styles.mainBtnText}>Continue →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.mainBtn, submitting && styles.btnDisabled]} 
            disabled={submitting} 
            onPress={handleConfirmBooking}
          >
            {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.mainBtnText}>Proceed to Payment →</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAF9F6" },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10, backgroundColor: "#FAF9F6" },
    backBtn: { width: 36, height: 36, justifyContent: "center" },
    contentContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 140 },
    pageTitle: { fontSize: 26, fontWeight: "800", color: "#1A1A24", marginBottom: 4 },
    pageSubTitle: { fontSize: 13, color: "#8A8A9E", marginBottom: 24, lineHeight: 18 },
    salonCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#F0EFEA" },
    salonImg: { width: 60, height: 60, borderRadius: 12, marginRight: 12 },
    salonInfo: { flex: 1, justifyContent: "center" },
    salonName: { fontSize: 15, fontWeight: "700", color: "#1A1A24", marginBottom: 4 },
    ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
    ratingTxt: { fontSize: 12, color: "#666", marginLeft: 4, fontWeight: "500" },
    locationRow: { flexDirection: "row", alignItems: "center" },
    locationTxt: { fontSize: 12, color: "#8A8A9E", marginLeft: 4 },
    serviceCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FDF9FA", borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#F6EEF0" },
    svcIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#F3E6E8", alignItems: "center", justifyContent: "center", marginRight: 12 },
    svcInfo: { flex: 1, flexShrink: 1, paddingRight: 8 },
    svcName: { fontSize: 15, fontWeight: "600", color: "#1A1A24", marginBottom: 2 },
    svcSub: { fontSize: 12, color: "#8A8A9E" },
    svcPrice: { fontSize: 15, fontWeight: "700", color: "#1A1A24", flexShrink: 0 },
    summarySection: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A24", marginBottom: 12 },
    summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F0EFEA" },
    summaryRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F9F9F9" },
    summaryIcon: { width: 24, marginTop: 2 },
    summaryLabel: { flex: 1, fontSize: 14, color: "#8A8A9E", marginTop: 1 },
    summaryValWrap: { flex: 2, alignItems: "flex-end" },
    summaryVal: { fontSize: 14, fontWeight: "600", color: "#1A1A24", textAlign: "right" },
    summaryValSub: { fontSize: 12, color: "#8A8A9E", marginTop: 2, textAlign: "right" },
    priceLabel: { flex: 1, fontSize: 14, color: "#8A8A9E" },
    priceVal: { fontSize: 15, fontWeight: "600", color: "#1A1A24" },
    totalLabel: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1A1A24" },
    totalVal: { fontSize: 18, fontWeight: "800", color: "#1A1A24" },
    cancellationBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#D1FAE5", marginBottom: 20 },
    cancelTextWrap: { flex: 1, marginLeft: 10 },
    cancelTitle: { fontSize: 13, fontWeight: "700", color: "#065F46", marginBottom: 2 },
    cancelSub: { fontSize: 11, color: "#047857" },
    bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#FAF9F6", paddingHorizontal: 20, paddingTop: 16 },
    mainBtn: { backgroundColor: "#6F2A3B", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    btnDisabled: { opacity: 0.5 },
    mainBtnText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
    loadingBox: { padding: 40, alignItems: "center" },
    loadingText: { marginTop: 12, color: "#8A8A9E", fontSize: 14 },
    successScreenWrapper: { flexGrow: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 30, paddingBottom: 30, alignItems: "center" },
    successHeader: { alignItems: "center", marginBottom: 24, marginTop: 10 },
    successCheckRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#6F2A3B", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 6, borderColor: "#F3E6E8" },
    successTitle: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 6 },
    successSub: { fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 20 },
    successDetailsCard: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: "#F3F4F6" },
    successServiceRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    successServiceImg: { width: 50, height: 50, borderRadius: 10, marginRight: 12 },
    successServiceInfo: { flex: 1 },
    successServiceName: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 2 },
    successServiceDesc: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
    successServiceMeta: { flexDirection: "row", alignItems: "center" },
    successServiceMetaText: { fontSize: 12, color: "#4B5563", marginLeft: 4, fontWeight: "500" },
    successDivider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },
    successDetailRow: { flexDirection: "row", alignItems: "center" },
    successIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
    successDetailTextWrap: { flex: 1 },
    successDetailLabel: { fontSize: 12, fontWeight: "600", color: "#111827", marginBottom: 2 },
    successDetailValue: { fontSize: 13, color: "#4B5563" },
    successDetailSubValue: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
    copyBtn: { backgroundColor: "#FDF9FA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    copyBtnText: { color: "#6F2A3B", fontSize: 11, fontWeight: "600" },
    viewBookingsBtn: { width: "100%", height: 52, borderRadius: 26, backgroundColor: "#6F2A3B", flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12 },
    viewBookingsText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
    shareBtn: { width: "100%", height: 52, borderRadius: 26, backgroundColor: "#FDF9FA", flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 30 },
    shareBtnText: { fontSize: 15, fontWeight: "700", color: "#6F2A3B" },
    successFooter: { alignItems: "center", marginTop: "auto" },
    leafCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FDF9FA", alignItems: "center", justifyContent: "center", marginBottom: 8 },
    footerQuote: { fontSize: 12, color: "#6F2A3B", textAlign: "center", fontWeight: "500", lineHeight: 16, marginBottom: 10 },
    heartRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: 0.5 },
    heartLine: { width: 24, height: 1, backgroundColor: "#6F2A3B" }
  });
}

