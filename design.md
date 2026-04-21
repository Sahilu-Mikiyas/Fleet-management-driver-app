# Fleet Driver App - Mobile Interface Design

## Design Principles

This driver app prioritizes **lean, task-focused UX** for drivers on-the-go. All screens assume **portrait orientation (9:16)** and **one-handed usage**. The design follows **Apple Human Interface Guidelines** to feel like a first-party iOS app.

---

## Screen List & Layout

### 1. **Authentication Screens**

#### Login Screen
- **Content**: Email input, password input, "Sign In" button
- **Functionality**: Supabase email/password login; persist session on-device
- **Flow**: User enters credentials → API validates → Redirects to approval check or dashboard

#### Approval Pending Screen
- **Content**: "Your account is pending approval" message, company name, support contact info
- **Functionality**: Show when `operators.is_approved = false`; auto-refresh to check approval status
- **Flow**: User waits for admin approval → Auto-redirect to dashboard when approved

---

### 2. **Home / Dashboard Screen**

**Primary Content:**
- **Header**: Driver name, "Today's Assignments" title
- **Quick Stats**: Total trips today, completed/pending counts (optional)
- **Assignments List**: Scrollable list of today's routes with:
  - Route name/ID
  - Scheduled departure & arrival window (e.g., "9:00 AM - 10:30 AM")
  - Passenger count badge
  - Status badge ("Assigned", "En Route", "Completed")
  - Quick action buttons: "Start Trip", "View Map", "Complete Trip"

**Functionality:**
- Pull-to-refresh to fetch latest assignments
- Tap assignment card to navigate to Trip Detail
- Status badges update in real-time (Supabase Realtime or polling)

**Key User Flow:**
1. User opens app → Dashboard loads with today's assignments
2. User taps "Start Trip" → Status changes to "En Route"
3. User taps "View Map" → Map screen opens
4. User completes delivery → Taps "Complete Trip" → Status changes to "Completed"

---

### 3. **Trip Detail Screen**

**Primary Content:**
- **Trip Header**: Route name, status badge, scheduled time window
- **Vehicle Info Card**:
  - License plate
  - Vehicle type/model
  - Passenger capacity
- **Manifest Section**:
  - Passenger list (name, reserved seat)
  - Read-only; shows who's assigned to this trip
- **Driver Notes / Special Instructions**:
  - Any notes from dispatcher (e.g., "Early pickup requested")
- **Action Buttons**:
  - "Start Navigation" (deep-link to Google Maps/Apple Maps)
  - "Toggle On Duty / Off Duty" (updates driver availability)
  - "Complete Trip" (marks assignment as done)
- **Support Info**: Dispatcher contact (name, phone, email)

**Functionality:**
- All data is read-only except for availability toggle
- "Start Navigation" opens native maps app with origin/destination
- "Complete Trip" shows confirmation dialog before marking done

---

### 4. **Map & Navigation Screen**

**Primary Content:**
- **Full-screen map** (react-native-maps or MapLibre)
  - Pins for origin & destination
  - Polyline showing intended route
  - Live location indicator (blue dot)
- **Bottom Sheet / Card**:
  - Current ETA
  - Distance remaining
  - Passenger check-in checkpoints (if applicable)
  - "Open in Maps" button (deep-link to native navigation)

**Functionality:**
- GPS updates live location in real-time
- Tap "Open in Maps" → Deep-link to Google Maps/Apple Maps for turn-by-turn
- Optional: Show passenger check-in status along the route

---

### 5. **Notifications / Updates Screen**

**Primary Content:**
- **Notification List**:
  - New assignment notifications
  - Approval status changes
  - Admin messages
  - Timestamp for each notification
- **Notification Types**:
  - "New Assignment: Route A assigned to you"
  - "Approval Status: Your account is now approved"
  - "Message from Admin: Check your vehicle before departure"

**Functionality:**
- In-app notifications displayed as a dedicated screen
- Tap notification to navigate to relevant detail (e.g., Trip Detail)
- Mark as read / clear notifications

---

### 6. **Profile & Settings Screen**

**Primary Content:**
- **Driver Profile Section**:
  - Driver name
  - License number
  - Company name
  - Profile photo (optional)
- **Availability Toggle**:
  - "Accept Assignments" / "Off Duty" switch
  - Updates driver availability metadata in Supabase
- **Settings Options**:
  - Notification preferences (toggle on/off)
  - Dark mode toggle
- **Support & Legal**:
  - "Contact Support" link
  - "Terms of Service" link
  - "Privacy Policy" link
- **Logout Button**:
  - Clears Supabase session and returns to login

**Functionality:**
- Availability toggle persists to Supabase
- Logout clears local session and secure storage

---

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| **Primary** | `#0a7ea4` (Teal Blue) | Buttons, active states, accents |
| **Background** | `#ffffff` (Light) / `#151718` (Dark) | Screen background |
| **Surface** | `#f5f5f5` (Light) / `#1e2022` (Dark) | Cards, elevated surfaces |
| **Foreground** | `#11181C` (Light) / `#ECEDEE` (Dark) | Primary text |
| **Muted** | `#687076` (Light) / `#9BA1A6` (Dark) | Secondary text |
| **Border** | `#E5E7EB` (Light) / `#334155` (Dark) | Dividers, borders |
| **Success** | `#22C55E` | Completed trips, success states |
| **Warning** | `#F59E0B` | Pending approval, alerts |
| **Error** | `#EF4444` | Errors, cancellations |

---

## Key User Flows

### Flow 1: Start a Trip
1. Dashboard → User taps "Start Trip" on an assignment
2. Status changes to "En Route"
3. User can now view map and navigate

### Flow 2: Complete a Trip
1. Trip Detail → User taps "Complete Trip"
2. Confirmation dialog appears
3. Status changes to "Completed"
4. Dashboard updates to reflect completion

### Flow 3: Navigate to Destination
1. Trip Detail → User taps "Start Navigation"
2. Native maps app opens (Google Maps or Apple Maps)
3. Turn-by-turn directions guide the driver
4. User returns to app when done

### Flow 4: Check Approval Status
1. Login → User enters credentials
2. If not approved, "Approval Pending" screen shows
3. Auto-refresh checks status periodically
4. When approved, user is redirected to Dashboard

### Flow 5: Update Availability
1. Profile & Settings → User toggles "Accept Assignments"
2. Availability status updates in Supabase
3. Dispatcher can see real-time availability

---

## Interaction Patterns

- **Press Feedback**: Buttons scale slightly (0.97) on press with light haptic feedback
- **Loading States**: Spinners appear during API calls
- **Error Handling**: Toast notifications for errors (e.g., "Failed to start trip")
- **Confirmation Dialogs**: Critical actions (e.g., "Complete Trip") show confirmation before proceeding
- **Pull-to-Refresh**: Dashboard supports refresh gesture to fetch latest assignments

---

## Technical Notes

- **Navigation**: Expo Router (tabs + stack navigation)
- **State Management**: React Context + AsyncStorage for local persistence
- **API**: Supabase JS client for auth/data
- **Maps**: react-native-maps with deep-linking to native navigation apps
- **Real-time Updates**: Supabase Realtime or polling for assignment/notification updates
- **Session Persistence**: Secure storage (expo-secure-store) for auth tokens
