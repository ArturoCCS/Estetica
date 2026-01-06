# Testing Guide

This guide provides step-by-step instructions for testing the appointment and payment system.

## Prerequisites

Before testing:
- [ ] App is running (`npm start`)
- [ ] Firebase Cloud Functions are deployed
- [ ] Firestore has initial settings document
- [ ] At least one service exists in Firestore
- [ ] Two test accounts: one admin, one regular user
- [ ] Mercado Pago configured (sandbox mode for testing)

## Test Environment Setup

### 1. Create Test Users

**Admin User:**
```
Email: admin@test.com
Password: TestAdmin123!
```
Add email to `EXPO_PUBLIC_ADMIN_EMAILS` in `.env`

**Regular User:**
```
Email: user@test.com
Password: TestUser123!
```

### 2. Create Test Service

In Firestore, create a document in `services` collection:
```json
{
  "name": "Test Haircut",
  "price": 200,
  "durationMin": 60,
  "active": true,
  "description": "Test service for appointments"
}
```

### 3. Configure Settings

In Firestore, ensure `settings/global` has:
```json
{
  "paymentsEnabled": true,
  "timezone": "America/Mexico_City",
  "businessHours": {
    "mon": { "enabled": true, "start": "09:00", "end": "19:00" }
    // ... other days
  }
}
```

## Test Cases

### Test 1: Basic Appointment Request Flow

**Objective**: Verify user can request an appointment and admin receives notification

**Steps**:
1. Login as regular user
2. Navigate to Services
3. Select "Test Haircut"
4. Tap "Book" or navigate to Book Service
5. Select tomorrow's date
6. Select 10:00 AM time slot
7. Add note: "Test appointment"
8. Tap "Confirmar reserva"

**Expected Results**:
- ✅ Success message appears: "Reserva creada"
- ✅ Appointment appears in "Mis Citas" with status "Pendiente aprobación"
- ✅ Admin receives push notification: "Nueva cita pendiente"
- ✅ In Firestore, appointment document has:
  - `status: "requested"`
  - `requestedStartAt: [tomorrow 10:00]`
  - `userId: [user's uid]`

### Test 2: Admin Approval with Payment Required

**Objective**: Verify admin can approve appointment and user receives payment request

**Steps**:
1. Logout and login as admin
2. Navigate to Admin Panel → "Citas pendientes"
3. Verify test appointment appears in "requested" filter
4. Tap "Aprobar" on the appointment
5. Confirm date matches tomorrow
6. Set start time: 10:00
7. Set end time: 11:30
8. Set deposit amount: 100
9. Tap "Aprobar y solicitar pago"

**Expected Results**:
- ✅ Success message: "Cita aprobada. El usuario recibirá notificación para pagar."
- ✅ Appointment status changes to "Esperando pago"
- ✅ User receives push notification about payment
- ✅ In Firestore, appointment has:
  - `status: "awaiting_payment"`
  - `finalStartAt: [tomorrow 10:00]`
  - `finalEndAt: [tomorrow 11:30]`
  - `depositAmount: 100`
  - `paymentDueAt: [24 hours from now]`

### Test 3: User Payment Flow

**Objective**: Verify user can pay via Mercado Pago and appointment gets confirmed

**Steps**:
1. Logout and login as regular user
2. Navigate to "Mis Citas"
3. Find the approved appointment with "Esperando pago" status
4. Verify deposit amount shows: "$100 MXN"
5. Verify payment deadline is displayed
6. Tap "Pagar depósito"
7. Browser/WebView opens with Mercado Pago checkout
8. Complete payment using test card (if sandbox):
   - Card: 5031 7557 3453 0604
   - Expiry: 11/25
   - CVV: 123
   - Name: APRO (for approved)
9. Complete the payment

**Expected Results**:
- ✅ Mercado Pago checkout page loads
- ✅ Payment is processed successfully
- ✅ User is redirected back to app (or can close browser)
- ✅ Within 30 seconds, appointment status changes to "Confirmada"
- ✅ User receives push notification: "Cita confirmada"
- ✅ In Firestore, appointment has:
  - `status: "confirmed"`
  - `mpStatus: "approved"`
  - `mpPaymentId: [payment ID]`

### Test 4: Confirm Without Payment (Feature Flag Disabled)

**Objective**: Verify appointments can be confirmed without payment when feature is disabled

**Steps**:
1. Login as admin
2. Navigate to Admin Panel → "Configurar agenda"
3. Toggle OFF "Habilitar pagos (Mercado Pago)"
4. Tap "Guardar"
5. Have user create another appointment request
6. As admin, approve the appointment
7. Tap "Confirmar sin pago"

**Expected Results**:
- ✅ Appointment immediately goes to "confirmed" status
- ✅ No `depositAmount` or `paymentDueAt` fields set
- ✅ User receives "Cita confirmada" notification
- ✅ No payment button appears for user

### Test 5: Appointment Expiration

**Objective**: Verify unpaid appointments expire after 24 hours

**Steps**:
1. Enable payments again
2. Create and approve an appointment with payment required
3. **DO NOT PAY**
4. In Firestore, manually set `paymentDueAt` to 1 hour ago:
   ```javascript
   // In Firebase Console
   paymentDueAt: new Date(Date.now() - 3600000).toISOString()
   ```
5. Wait for scheduled function to run (max 1 hour) OR manually trigger:
   ```bash
   firebase functions:shell
   expireUnpaidAppointments()
   ```

**Expected Results**:
- ✅ Appointment status changes to "expired"
- ✅ User receives notification: "Cita expirada"
- ✅ Time slot becomes available for new bookings
- ✅ Function logs show: "Expired X appointments"

### Test 6: Overlap Prevention

**Objective**: Verify users cannot book overlapping time slots

**Steps**:
1. Create and approve an appointment for tomorrow 2:00 PM - 3:30 PM (confirmed)
2. As another user (or same user), try to book:
   - Tomorrow 2:30 PM (should fail - overlaps)
   - Tomorrow 1:00 PM with 90-min service (should fail - overlaps)
   - Tomorrow 3:30 PM (should succeed - no overlap)

**Expected Results**:
- ❌ Overlapping bookings show: "Horario no disponible"
- ✅ Non-overlapping booking succeeds

### Test 7: Admin Cancellation

**Objective**: Verify admin can cancel appointments at any stage

**Steps**:
1. Create appointments in various states:
   - One requested
   - One awaiting_payment
   - One confirmed
2. As admin, go to "Citas pendientes"
3. Filter by each status and cancel one appointment
4. Tap "Cancelar" → "Sí"

**Expected Results**:
- ✅ All appointments can be cancelled regardless of status
- ✅ Users receive "Cita cancelada" notifications
- ✅ Cancelled appointments appear in "cancelled" filter
- ✅ Time slots become available again

### Test 8: Notification Delivery

**Objective**: Verify all push notifications work correctly

**Checklist**:
- [ ] Admin receives notification on new appointment request
- [ ] User receives notification when appointment approved (awaiting payment)
- [ ] User receives notification when appointment confirmed
- [ ] User receives notification when appointment cancelled
- [ ] User receives notification when appointment expired

**Note**: Notifications only work on physical devices or proper simulators with Expo Go app.

### Test 9: Business Hours Validation

**Objective**: Verify bookings respect business hours

**Steps**:
1. As admin, set Monday hours: 09:00 - 17:00
2. Disable Sunday in business hours
3. As user, try to book:
   - Monday 8:30 AM (should not appear as option)
   - Monday 4:30 PM with 60-min service (should fail - exceeds closing)
   - Sunday (should show "no slots available")

**Expected Results**:
- ✅ Only slots within business hours are shown
- ✅ Services that extend beyond closing time are rejected
- ✅ Disabled days show no available slots

### Test 10: Settings Management

**Objective**: Verify admin can manage all settings

**Steps**:
1. Login as admin
2. Navigate to Admin Panel → "Configurar agenda"
3. Modify:
   - Business hours for each day
   - Payment toggle
   - Slot interval
   - Timezone
4. Save settings

**Expected Results**:
- ✅ All changes are saved successfully
- ✅ Changes reflect immediately in booking flow
- ✅ Success message appears: "Configuración guardada"

## Test Data Cleanup

After testing:
```bash
# Delete test appointments
firebase firestore:delete "appointments/[test-appointment-id]"

# Or use Firebase Console to manually delete test data
```

## Known Limitations

- Push notifications require physical device or proper simulator setup
- Mercado Pago sandbox may have rate limits
- Scheduled function runs every hour (not immediately)
- Deep linking back from MP requires proper app scheme configuration

## Troubleshooting

### Appointment not confirming after payment
- Check Cloud Function logs: `firebase functions:log`
- Verify webhook is configured in Mercado Pago
- Check appointment has correct `mpPreferenceId`

### Push notifications not received
- Verify user has `expoPushToken` in Firestore
- Check user granted notification permissions
- Review Cloud Function logs for push errors

### Payment page not loading
- Verify `EXPO_PUBLIC_CREATE_PAYMENT_URL` is set
- Check Cloud Function is deployed
- Review function logs for errors

## Success Criteria

All tests passed when:
- [ ] Users can create appointment requests
- [ ] Admin receives notifications for new requests
- [ ] Admin can approve with custom time ranges
- [ ] Payment flow works end-to-end (if enabled)
- [ ] Appointments confirm after successful payment
- [ ] Appointments can be confirmed without payment (if disabled)
- [ ] Unpaid appointments expire after 24 hours
- [ ] Overlapping bookings are prevented
- [ ] All push notifications are delivered
- [ ] Business hours are respected
- [ ] Settings can be updated by admin

## Reporting Issues

If any test fails:
1. Document the steps to reproduce
2. Include screenshots or screen recordings
3. Check browser/function/Firestore logs
4. Note any error messages
5. Report to development team with all details
