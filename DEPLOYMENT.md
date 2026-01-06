# Deployment Guide

This guide covers deploying the Estetica app to production.

## Prerequisites

- Firebase project created and configured
- Mercado Pago developer account
- Apple Developer account (for iOS)
- Google Play Console account (for Android)
- EAS CLI installed: `npm install -g eas-cli`

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Firestore Database
4. Enable Authentication with Email/Password provider
5. Enable Cloud Functions (requires Blaze plan)

### 1.2 Configure Firestore

Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 1.3 Initialize Settings Document

Create `settings/global` document in Firestore with initial configuration:

```json
{
  "timezone": "America/Mexico_City",
  "adminPhone": "+521234567890",
  "adminEmail": "admin@example.com",
  "slotIntervalMinutes": 30,
  "bookingMinLeadMinutes": 60,
  "bookingMaxDays": 30,
  "paymentsEnabled": true,
  "businessHours": {
    "mon": { "enabled": true, "start": "09:00", "end": "19:00" },
    "tue": { "enabled": true, "start": "09:00", "end": "19:00" },
    "wed": { "enabled": true, "start": "09:00", "end": "19:00" },
    "thu": { "enabled": true, "start": "09:00", "end": "19:00" },
    "fri": { "enabled": true, "start": "09:00", "end": "19:00" },
    "sat": { "enabled": true, "start": "09:00", "end": "17:00" },
    "sun": { "enabled": false, "start": "09:00", "end": "17:00" }
  },
  "whatsApp": {
    "phone": "+521234567890",
    "defaultMessageTemplate": "Hola, me gustaría agendar una cita."
  }
}
```

## Step 2: Mercado Pago Configuration

### 2.1 Create Application

1. Go to [Mercado Pago Developers](https://www.mercadopago.com.mx/developers)
2. Create a new application
3. Get your Access Token (Production and Test)
4. Configure webhook URL

### 2.2 Test Mode

For testing, use sandbox credentials:
- Test Access Token
- Test card numbers from Mercado Pago docs

### 2.3 Production Mode

For production:
- Use production Access Token
- Complete Mercado Pago certification process
- Verify webhook is receiving real notifications

## Step 3: Deploy Cloud Functions

### 3.1 Configure Environment

Set Firebase environment variables:

```bash
firebase functions:config:set \
  mp.access_token="YOUR_MP_ACCESS_TOKEN" \
  mp.webhook_url="https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/mercadoPagoWebhook" \
  mp.success_url="exp://your-app-scheme/payment-success" \
  mp.failure_url="exp://your-app-scheme/payment-failure" \
  mp.pending_url="exp://your-app-scheme/payment-pending" \
  admin.emails="admin1@example.com,admin2@example.com"
```

Or use `.env` file with Firebase Functions v2 (recommended):

In `functions/.env`:
```env
MP_ACCESS_TOKEN=your_production_access_token
MP_WEBHOOK_URL=https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/mercadoPagoWebhook
# ... other vars
```

### 3.2 Deploy Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 3.3 Verify Deployment

Test each function:

1. **createPaymentPreference**: Test with curl or Postman
   ```bash
   curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/createPaymentPreference \
     -H "Content-Type: application/json" \
     -d '{"appointmentId": "test_id"}'
   ```

2. **mercadoPagoWebhook**: Check logs for incoming webhooks
   ```bash
   firebase functions:log
   ```

3. **expireUnpaidAppointments**: Verify it runs on schedule

## Step 4: Build Mobile App

### 4.1 Configure EAS

Initialize EAS if not already done:

```bash
eas build:configure
```

Update `eas.json` with production profiles.

### 4.2 Set Production Environment

Create `.env.production`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_production_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
EXPO_PUBLIC_CREATE_PAYMENT_URL=https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/createPaymentPreference
```

### 4.3 Build for iOS

```bash
eas build --platform ios --profile production
```

Submit to App Store:
```bash
eas submit --platform ios
```

### 4.4 Build for Android

```bash
eas build --platform android --profile production
```

Submit to Google Play:
```bash
eas submit --platform android
```

## Step 5: Post-Deployment Checklist

### 5.1 Verify Core Features

- [ ] User registration and login works
- [ ] Admin login works with configured emails
- [ ] Services display correctly
- [ ] Appointment booking creates `requested` appointment
- [ ] Admin can see pending appointments
- [ ] Admin can approve appointments
- [ ] Payment flow works (if enabled)
- [ ] Mercado Pago webhook updates appointment status
- [ ] Push notifications are delivered

### 5.2 Test Payment Flow End-to-End

1. Create test appointment as user
2. Approve as admin with deposit amount
3. User receives notification
4. User pays via Mercado Pago (use test card if in sandbox)
5. Webhook processes payment
6. Appointment status changes to confirmed
7. User receives confirmation notification

### 5.3 Test Expiration Flow

1. Create appointment and approve with payment required
2. Don't pay within 24 hours
3. Verify scheduled function expires the appointment
4. User receives expiration notification

### 5.4 Monitor Logs

Set up monitoring:

```bash
# View function logs
firebase functions:log --only expireUnpaidAppointments

# Set up log alerts
firebase functions:log --follow
```

## Step 6: Ongoing Maintenance

### Update Cloud Functions

```bash
cd functions
# Make changes
npm run build
cd ..
firebase deploy --only functions
```

### Update Mobile App

```bash
# Update version in app.json
# Build new version
eas build --platform all --profile production
# Submit updates
eas submit --platform all
```

### Monitor Usage

- Check Firebase console for function invocations
- Monitor Firestore usage
- Track Mercado Pago transaction volume
- Review crash reports in App Store Connect / Google Play Console

## Troubleshooting

### Functions Not Receiving Webhook

- Verify webhook URL in Mercado Pago dashboard
- Check function logs for incoming requests
- Test webhook with Mercado Pago test panel

### Payment Not Confirming Appointment

- Check function logs for errors
- Verify `external_reference` matches appointment ID
- Ensure appointment is in `awaiting_payment` status

### Push Notifications Not Delivered

- Verify users have granted notification permissions
- Check token is stored in Firestore user document
- Review function logs for push notification errors
- Verify Expo push notification service is operational

## Security Considerations

- Never commit `.env` files to version control
- Rotate Mercado Pago access tokens periodically
- Review Firestore security rules regularly
- Monitor for unusual activity in Firebase console
- Keep dependencies updated

## Backup and Recovery

### Firestore Backup

Set up automated Firestore exports:
```bash
gcloud firestore export gs://your-bucket/firestore-backups
```

### Cloud Functions Backup

Keep `functions/` directory in version control with proper branching strategy.

## Support Contacts

- Firebase Support: https://firebase.google.com/support
- Mercado Pago Support: https://www.mercadopago.com.mx/developers/support
- Expo Support: https://expo.dev/support
