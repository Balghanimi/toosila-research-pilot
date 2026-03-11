# 🔌 API Documentation - Toosila

## Base URL
```
Production: https://your-domain.railway.app/api
Development: http://localhost:5001/api
```

---

## 🔐 Authentication

### Register
```http
POST /auth/register
```
| Field | Type | Required |
|-------|------|----------|
| name | string | ✅ |
| email | string | ✅ |
| password | string | ✅ |
| isDriver | boolean | ❌ |
| phone | string | ❌ |
| gender | string | ❌ |

### Login
```http
POST /auth/login
```
| Field | Type | Required |
|-------|------|----------|
| email | string | ✅ |
| password | string | ✅ |

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "jwt_token"
  }
}
```

---

## 🚗 Offers

### Get Offers
```http
GET /offers?page=1&limit=10&fromCity=بغداد&ladies_only=false
```

### Create Offer
```http
POST /offers
Authorization: Bearer <token>
```
| Field | Type | Required |
|-------|------|----------|
| fromCity | string | ✅ |
| toCity | string | ✅ |
| departureTime | datetime | ✅ |
| seats | number | ✅ |
| price | number | ✅ |
| isLadiesOnly | boolean | ❌ |

---

## 📋 Demands

### Get Demands
```http
GET /demands?page=1&limit=10&ladies_only=false
```

### Create Demand
```http
POST /demands
Authorization: Bearer <token>
```
| Field | Type | Required |
|-------|------|----------|
| fromCity | string | ✅ |
| toCity | string | ✅ |
| earliestTime | datetime | ✅ |
| latestTime | datetime | ✅ |
| seats | number | ✅ |
| budgetMax | number | ❌ |
| isLadiesOnly | boolean | ❌ |

---

## 📅 Bookings

### Create Booking
```http
POST /bookings
Authorization: Bearer <token>
```
| Field | Type | Required |
|-------|------|----------|
| offerId | number | ✅ |
| seats | number | ❌ (default: 1) |
| message | string | ❌ |

### Update Status
```http
PUT /bookings/:id/status
Authorization: Bearer <token>
```
| Field | Type | Values |
|-------|------|--------|
| status | string | accepted, cancelled |

---

## 💬 Messages

### Get Conversations
```http
GET /messages/conversations
Authorization: Bearer <token>
```

### Send Message
```http
POST /messages
Authorization: Bearer <token>
```
| Field | Type | Required |
|-------|------|----------|
| receiverId | number | ✅ |
| rideId | number | ❌ |
| rideType | string | ❌ |
| content | string | ✅ |

---

## 📊 Response Format

### Success
```json
{
  "success": true,
  "message": "...",
  "data": {...}
}
```

### Error
```json
{
  "success": false,
  "error": "Error message"
}
```

---

*آخر تحديث: 2026-01-13*
