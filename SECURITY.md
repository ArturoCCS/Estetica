# Security Policy

## Security Best Practices

This document outlines security considerations and best practices for the Estetica application.

## Environment Variables and Secrets

### Never Commit Secrets
- **NEVER** commit `.env` files to version control
- Use `.env.example` files as templates without real values
- Add all `.env` files to `.gitignore`

### App Secrets (Client-Side)
The following environment variables are embedded in the mobile app and should be considered **semi-public**:
- `EXPO_PUBLIC_FIREBASE_*` - Firebase configuration (safe to expose)
- `EXPO_PUBLIC_ADMIN_EMAILS` - Admin emails list
- `EXPO_PUBLIC_CREATE_PAYMENT_URL` - Cloud Function URL

⚠️ **Important**: These values are visible to anyone who inspects the app bundle. Do not include sensitive credentials here.

### Functions Secrets (Server-Side)
The following must ONLY be configured in Cloud Functions environment and NEVER in the client app:
- `MP_ACCESS_TOKEN` - Mercado Pago access token (CRITICAL - keep secret)
- `ADMIN_EMAILS` - Server-side admin validation
- Webhook secrets (if implemented)

## Firebase Security Rules

### Current Rules
The app uses Firestore security rules defined in `firestore.rules`:

- **Users**: Users can read all profiles but only write their own
- **Services**: Public read, admin write only
- **Appointments**: Users can read their own and create new; updates via functions only
- **Settings**: Public read, admin write only
- **Promotions/Gallery**: Public read, admin write only

### Admin Authorization
Admin access is controlled by:
1. Client-side: `EXPO_PUBLIC_ADMIN_EMAILS` environment variable
2. Server-side: `ADMIN_EMAILS` environment variable in Cloud Functions
3. Firestore: `role` field in user documents

⚠️ **Note**: Current admin authorization is based on email matching. For production, consider:
- Firebase Custom Claims for admin roles
- Dedicated admin authentication system
- Multi-factor authentication for admin accounts

## Payment Security

### Mercado Pago Integration
- Access tokens are stored only in Cloud Functions (server-side)
- Payment creation happens server-side via `createPaymentPreference` function
- Webhooks validate payments by fetching data directly from Mercado Pago API
- External references link payments to appointments securely

### Recommended Improvements for Production
1. **Webhook Signature Validation**: Implement signature verification for webhook requests
   - Use `x-signature` header validation
   - See: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks

2. **Rate Limiting**: Implement rate limiting on Cloud Functions
   - Prevent abuse of payment creation endpoint
   - Use Firebase App Check

3. **Payment Amount Validation**: Add server-side validation
   - Verify deposit amount matches expected value
   - Prevent amount tampering

## Data Privacy

### Personal Information
The app stores:
- User emails (for authentication)
- Push notification tokens
- Appointment details

### GDPR Considerations
For EU users, ensure:
- Privacy policy is accessible
- Users can request data deletion
- Cookie consent (if using web version)
- Data retention policies

## Common Vulnerabilities

### Prevented
✅ **SQL Injection**: Using Firestore (NoSQL) with proper queries
✅ **XSS**: React Native doesn't render HTML by default
✅ **Exposed Secrets**: Secrets in functions environment, not in app
✅ **CSRF**: Using Cloud Functions with proper CORS

### To Monitor
⚠️ **Injection via Notes**: User-provided notes fields should be sanitized
⚠️ **Denial of Service**: Implement rate limiting
⚠️ **Unauthorized Admin Access**: Strengthen admin authentication

## Incident Response

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Email the security team directly at: [security contact email]
3. Provide details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Checklist for Deployment

Before deploying to production:

- [ ] All secrets are configured in Cloud Functions environment
- [ ] `.env` files are not committed to repository
- [ ] Firestore security rules are deployed and tested
- [ ] Admin emails are correctly configured
- [ ] Mercado Pago is in production mode (not sandbox)
- [ ] Webhook URL is correctly configured in Mercado Pago
- [ ] Firebase App Check is enabled (optional but recommended)
- [ ] HTTPS is enforced for all Cloud Functions
- [ ] Push notification tokens are handled securely
- [ ] Regular security audits are scheduled

## Regular Maintenance

### Weekly
- Review Cloud Function logs for suspicious activity
- Check for unusual payment patterns
- Monitor failed authentication attempts

### Monthly
- Update dependencies (`npm audit`, `npm update`)
- Review Firestore security rules
- Rotate Mercado Pago access tokens (if applicable)
- Check for new security advisories

### Quarterly
- Complete security audit
- Review admin access list
- Update security documentation
- Test incident response procedures

## Resources

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Mercado Pago Security](https://www.mercadopago.com/developers/en/docs/security)
- [Expo Security](https://docs.expo.dev/guides/security/)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-top-10/)

## Version History

- **v1.0** (2025-01-06): Initial security policy
