# Estetica App - Salon Management & Appointments

A React Native Expo app for beauty salon management with appointment scheduling and Mercado Pago payment integration.

## Features

- **User Features**
  - Browse services and book appointments
  - View appointment status (requested, awaiting payment, confirmed, etc.)
  - Pay deposits via Mercado Pago checkout
  - Receive push notifications for appointment updates
  - Participate in promotional roulette games

- **Admin Features**
  - Manage services, promotions, and gallery
  - Review and approve appointment requests
  - Set custom time ranges and deposit amounts
  - Toggle payment requirement (feature flag)
  - Configure business hours and settings
  - Receive notifications for new appointment requests

- **Payment Integration**
  - Mercado Pago web checkout for deposits
  - Automatic appointment confirmation on successful payment
  - 24-hour payment deadline with automatic expiration
  - Feature flag to disable payments when needed

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Firestore
- Mercado Pago account (for payments)
- iOS/Android development environment (optional, for native builds)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin Emails (comma-separated)
EXPO_PUBLIC_ADMIN_EMAILS=admin@example.com,other-admin@example.com

# Cloud Functions URL (set after deploying functions)
EXPO_PUBLIC_CREATE_PAYMENT_URL=https://your-region-your-project.cloudfunctions.net/createPaymentPreference
```

### 3. Setup Firebase Cloud Functions

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
```

Create a `.env` file in the `functions/` directory:

```env
# Mercado Pago Configuration
MP_ACCESS_TOKEN=your_mercado_pago_access_token
MP_WEBHOOK_URL=https://your-region-your-project.cloudfunctions.net/mercadoPagoWebhook
MP_SUCCESS_URL=exp://your-app-scheme/payment-success
MP_FAILURE_URL=exp://your-app-scheme/payment-failure
MP_PENDING_URL=exp://your-app-scheme/payment-pending

# Admin emails for notifications
ADMIN_EMAILS=admin@example.com,other-admin@example.com
```

### 4. Deploy Cloud Functions

First, build the TypeScript functions:

```bash
cd functions
npm run build
```

Deploy to Firebase:

```bash
# Login to Firebase (if not already)
firebase login

# Deploy all functions
firebase deploy --only functions
```

After deployment, copy the function URLs and update your `.env` file in the root with the `createPaymentPreference` function URL.

### 5. Configure Mercado Pago Webhook

1. Go to your Mercado Pago developer dashboard
2. Navigate to your application's webhook settings
3. Add the webhook URL: `https://your-region-your-project.cloudfunctions.net/mercadoPagoWebhook`
4. Enable notifications for payment events

### 6. Initialize Firestore

The app requires a specific Firestore structure. Create the following collections:

- **settings/global** - Global app settings including business hours and payment flag
  ```json
  {
    "timezone": "America/Mexico_City",
    "adminPhone": "+52...",
    "paymentsEnabled": true,
    "businessHours": {
      "mon": { "enabled": true, "start": "09:00", "end": "19:00" },
      "tue": { "enabled": true, "start": "09:00", "end": "19:00" },
      // ... other days
    }
  }
  ```

Deploy Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### Important: Firestore Composite Indexes

The app requires specific composite indexes for efficient queries. These are defined in `firestore.indexes.json` and include:

1. **User appointments query**: `userId` (ASC) + `requestedStartAt` (DESC)
   - Used in: BookingsScreen, MyAppointmentsScreen, CalendarScreen
   - Allows users to view their appointments sorted by date

2. **Admin appointments query**: `status` (ASC) + `requestedStartAt` (ASC/DESC)
   - Used in: AdminAppointmentsScreen
   - Allows admins to filter appointments by status and sort by date

3. **Day lookup query**: `dayKey` (ASC) + `status` (ASC)
   - Used for calendar day views and status filtering

If you encounter "The query requires an index" errors:
- Check that `firestore.indexes.json` is deployed
- Verify query field order matches the index definition
- Use Firebase Console to create indexes from error messages

## Running the App

### Development

Start the Expo development server:

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

### Production Build

Build for iOS:
```bash
eas build --platform ios
```

Build for Android:
```bash
eas build --platform android
```

## Project Structure

```
.
├── src/
│   ├── screens/          # App screens
│   │   ├── admin/        # Admin-only screens
│   │   └── ...           # User screens
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation configuration
│   ├── lib/             # Utility libraries
│   ├── providers/       # React context providers
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
├── functions/           # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts    # Function definitions
│   ├── package.json
│   └── tsconfig.json
├── assets/             # Images, fonts, etc.
└── ...
```

## Key Workflows

### Appointment Booking Flow

1. **User requests appointment**
   - Selects service, date, and time
   - Appointment created with status `requested`
   - Admin receives push notification

2. **Admin reviews request**
   - Views appointment in Admin Appointments screen
   - Sets final time range (may differ from requested)
   - Sets deposit amount
   - Approves appointment

3. **Payment required** (if `paymentsEnabled = true`)
   - Appointment status changes to `awaiting_payment`
   - User receives notification with 24-hour deadline
   - User taps "Pay Deposit" button
   - Mercado Pago checkout opens in browser
   - On successful payment, status changes to `confirmed`

4. **Confirmation** (if `paymentsEnabled = false`)
   - Admin approves and appointment immediately becomes `confirmed`
   - No payment required

5. **Automatic expiration**
   - Scheduled function runs every hour
   - Expires appointments past payment deadline
   - Status changes to `expired`
   - Time slot becomes available again

## Environment Variables Reference

### App (Root `.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_FIREBASE_*` | Firebase configuration | Yes |
| `EXPO_PUBLIC_ADMIN_EMAILS` | Comma-separated admin emails | Yes |
| `EXPO_PUBLIC_CREATE_PAYMENT_URL` | Cloud Function URL for payment | Yes (if payments enabled) |

### Functions (`functions/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MP_ACCESS_TOKEN` | Mercado Pago access token | Yes (if payments enabled) |
| `MP_WEBHOOK_URL` | Webhook URL for MP notifications | Yes (if payments enabled) |
| `MP_SUCCESS_URL` | Deep link for successful payment | No |
| `MP_FAILURE_URL` | Deep link for failed payment | No |
| `MP_PENDING_URL` | Deep link for pending payment | No |
| `ADMIN_EMAILS` | Admin emails for notifications | Yes |

## Troubleshooting

### Push Notifications Not Working

- Ensure you're testing on a physical device or proper simulator
- Check that user has granted notification permissions
- Verify `expoPushToken` is stored in user document in Firestore
- Check Cloud Function logs for errors

### Payments Not Working

- Verify `MP_ACCESS_TOKEN` is correctly configured
- Check Mercado Pago webhook is receiving events
- Review Cloud Function logs for errors
- Ensure `EXPO_PUBLIC_CREATE_PAYMENT_URL` points to the correct function

### Appointments Not Expiring

- Verify the scheduled function is deployed
- Check Cloud Function logs for the `expireUnpaidAppointments` function
- Ensure Firebase project has billing enabled (required for scheduled functions)

## License

Private - All rights reserved

## Support

For issues or questions, contact the development team.
