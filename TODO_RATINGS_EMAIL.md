# TODO: Ratings & Reviews Flow + Email Service Implementation

## 1. Backend (`salon-api`)

### Ratings & Reviews
- [ ] Create `submitAppointmentReview` controller in `src/controllers/appointment.controller.js`
  - Verify appointment exists and belongs to authenticated customer
  - Verify appointment status is `COMPLETED`
  - Prevent duplicate reviews (`appointment.rating.score` must be null)
  - Save `score`, `review` (comment), and `ratedAt` timestamp
  - Recalculate and update average ratings & rating counts on `Salon`, `Branch`, and `Staff` models
  - Invalidate public review cache in Redis (`salon:reviews:${salonId}`, `branch:reviews:${branchId}`)
- [ ] Add `POST /api/v1/appointments/:appointmentId/review` route in `src/routes/appointment.routes.js`

### Email Service
- [ ] Add `nodemailer` package dependency to `salon-api`
- [ ] Create `src/services/email.service.js`
  - Transport setup with SMTP environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`)
  - Console fallback logging mode if SMTP parameters are omitted in local dev
  - `sendBookingConfirmationEmail()` template & function
  - `sendAppointmentStatusEmail()` template & function (CONFIRMED, COMPLETED, CANCELLED)
  - `sendRescheduleConfirmationEmail()` template & function
- [ ] Wire email service into `src/controllers/appointment.controller.js`
  - Trigger confirmation email on booking creation
  - Trigger status update email on status transition
  - Trigger reschedule email on appointment reschedule

---

## 2. Customer Mobile App (`apps/customer-app`)

### API Service
- [ ] Add `submitReview(appointmentId, { score, review })` API call in `src/services/api.js`

### UI Components & Screens
- [ ] Create `ReviewModal.jsx` component in `src/components/ReviewModal.jsx`
  - Interactive 5-Star rating selector (1-5 stars with visual highlight & text indicator)
  - Multiline text area for written review feedback
  - Submit button with loading spinner
  - Error alert / success feedback
- [ ] Update `BookingsScreen.jsx` in `src/screen/BookingsScreen.jsx`
  - Display "★ Rate & Review" button on `COMPLETED` appointment cards if unrated
  - Display "★ Rated X/5" badge if already reviewed
  - Open `ReviewModal` on button press
  - Refresh bookings list / local item state upon review submission

---

## 3. Verification & Testing
- [ ] Verify POST review API returns 200 for completed appointments and 400 for non-completed or duplicate requests
- [ ] Verify GET public branch/salon reviews API reflects the new review
- [ ] Test mobile app star rating selection and review modal submission flow
- [ ] Test email notification triggers on booking, status update, and rescheduling
