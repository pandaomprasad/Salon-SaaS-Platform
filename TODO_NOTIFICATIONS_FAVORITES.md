# TODO: In-App Notification Center & Favorites / Saved Salons

## 1. Backend (`salon-api`)

### User Model
- [ ] Add `favoriteSalons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salon' }]` in `src/models/user.model.js`

### Customer Routes & Controllers
- [ ] Add `GET /api/v1/customers/me/favorites` in `src/routes/customer.routes.js`
- [ ] Add `POST /api/v1/customers/me/favorites/:salonId` in `src/routes/customer.routes.js`
- [ ] Add `DELETE /api/v1/customers/me/favorites/:salonId` in `src/routes/customer.routes.js`
- [ ] Implement favorite controller handlers in `src/controllers/customer.controller.js` (or `user.controller.js`)

### Persistent Notifications
- [ ] Wire `notifyUser()` into `bookAppointment`, `updateAppointmentStatus`, and `rescheduleAppointment` in `src/controllers/appointment.controller.js`

---

## 2. Customer Mobile App (`apps/customer-app`)

### API Service
- [ ] Create `src/services/customerService.js` with methods:
  - `getFavoriteSalons()`
  - `addFavoriteSalon(salonId)`
  - `removeFavoriteSalon(salonId)`
  - `getNotifications()`
  - `getUnreadNotificationCount()`
  - `markNotificationRead(id)`
  - `markAllNotificationsRead()`

### UI Components & Screens
- [ ] Add Heart Icon toggle button to `src/components/SalonCard.jsx`
- [ ] Add Heart Icon toggle button to `src/screen/SalonDetailScreen.jsx`
- [ ] Create `src/screen/NotificationCenterScreen.jsx`
  - Notification items with title, body, timestamp, unread dot
  - Tap to mark read / navigate
  - "Mark All as Read" button
- [ ] Create `src/screen/SavedSalonsScreen.jsx`
  - List of bookmarked salons with 1-tap quick booking
- [ ] Wire Notification Bell icon badge into Header & Register screens in Navigation
