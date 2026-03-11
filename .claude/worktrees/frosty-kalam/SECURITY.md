# 🔐 Security Policy - Toosila (توصيلة)

## Overview

Toosila is an Iraqi ride-sharing application that handles sensitive user data including personal information, phone numbers, and location data. Security is a top priority.

## Security Measures Implemented

### Authentication
- **Password Hashing:** bcrypt with 12 salt rounds
- **JWT Tokens:** Signed with strong secrets (32+ characters required in production)
- **Token Expiration:** Access tokens expire in 7 days
- **OTP Verification:** Phone-based authentication via WhatsApp/SMS
- **Account Lockout:** 5 failed attempts = 30-minute lockout

### Authorization
- Role-based access control (user, driver, admin)
- Resource ownership verification on all protected endpoints
- Admin-only endpoints secured with `requireAdmin` middleware

### Input Validation
- All inputs validated using express-validator
- Phone number format validation (Iraqi format +964...)
- Email normalization and validation
- Length limits on all text fields
- UUID validation for database IDs

### Rate Limiting
| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Login | 5 attempts | 15 minutes |
| Registration | 3 attempts | 1 hour |
| Password Reset | 3 attempts | 1 hour |
| OTP Send | 5 requests | 1 hour |
| General API | 500 requests | 15 minutes |

### API Security
- Helmet.js with Content Security Policy
- CORS configured with specific allowed origins
- HTTPS enforced in production
- Request body size limits (10MB)
- Compression for responses

### Database Security
- PostgreSQL with SSL in production
- All queries use parameterized statements
- Connection pooling with limits
- Credentials stored in environment variables

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [security@toosila.iq] (placeholder)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to understand and address the issue.

## Security Checklist for Developers

Before deploying, ensure:

- [ ] `.env` files are NOT committed to git
- [ ] All secrets are cryptographically random (32+ chars)
- [ ] No `console.log` statements with sensitive data
- [ ] npm audit shows no critical vulnerabilities
- [ ] Rate limiting is enabled on all endpoints
- [ ] HTTPS is enforced
- [ ] CORS origins are explicitly configured

## Known Security Considerations

### Token Storage
JWT tokens are stored in localStorage. While this is vulnerable to XSS, we mitigate this with:
- Content Security Policy headers
- Input sanitization
- No inline JavaScript evaluation

### Ladies-Only Rides
The ladies-only feature uses gender verification at registration. This is enforced at:
- Offer creation (only female drivers)
- Booking (only female passengers for ladies-only offers)

## Dependencies

We regularly audit dependencies using:
```bash
npm audit
npm outdated
```

Last security audit: 2026-01-22

## Incident Response

In case of a security incident:
1. Immediately rotate all secrets (JWT_SECRET, API keys)
2. Invalidate all active sessions
3. Review audit logs
4. Notify affected users if data was exposed
5. Document and learn from the incident

---

**Last Updated:** 2026-01-22
**Version:** 1.1.0
