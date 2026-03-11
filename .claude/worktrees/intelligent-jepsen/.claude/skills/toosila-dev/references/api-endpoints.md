# Toosila API Endpoints Reference

## Base URL
- **Development:** `http://localhost:5001/api`
- **Production:** `https://api.toosila.app/api`

---

## Authentication `/api/auth`

### POST /register
Register new user
```javascript
// Request
{
  "phone": "+9647701234567",
  "name": "علي محمد",
  "role": "passenger" | "driver"
}

// Response
{
  "success": true,
  "message": "OTP sent",
  "userId": "uuid"
}
```

### POST /verify-otp
Verify OTP and get token
```javascript
// Request
{ "phone": "+9647701234567", "otp": "123456" }

// Response
{
  "success": true,
  "token": "jwt-token",
  "user": { "id", "name", "phone", "role" }
}
```

### POST /login
Login existing user
```javascript
// Request
{ "phone": "+9647701234567" }

// Response
{ "success": true, "message": "OTP sent" }
```

### GET /me
Get current user (requires auth)
```javascript
// Headers: Authorization: Bearer <token>

// Response
{
  "id": "uuid",
  "name": "علي محمد",
  "phone": "+9647701234567",
  "role": "passenger",
  "rating_avg": 4.5,
  "rating_count": 12
}
```

---

## Offers `/api/offers`

### GET /
List offers with filters
```javascript
// Query params
?from_city=بغداد
&to_city=البصرة
&date=2024-01-15
&seats=2
&ladies_only=true
&page=1
&limit=10

// Response
{
  "success": true,
  "data": [...offers],
  "pagination": { "page": 1, "total": 50, "pages": 5 }
}
```

### POST /
Create offer (driver only)
```javascript
// Request
{
  "from_city": "بغداد",
  "to_city": "البصرة",
  "departure_time": "2024-01-15T08:00:00Z",
  "seats": 3,
  "price": 25000,
  "ladies_only": false,
  "notes": "سيارة مكيفة"
}
```

### GET /:id
Get single offer

### PUT /:id
Update offer (owner only)

### DELETE /:id
Soft delete offer (owner only)

---

## Demands `/api/demands`

### GET /
List demands with filters

### POST /
Create demand (passenger)
```javascript
{
  "from_city": "كربلاء",
  "to_city": "النجف",
  "earliest_time": "2024-01-15T06:00:00Z",
  "latest_time": "2024-01-15T10:00:00Z",
  "seats": 1,
  "budget_max": 15000,
  "ladies_only": true
}
```

---

## Bookings `/api/bookings`

### POST /
Create booking request
```javascript
{
  "offer_id": "uuid",
  "seats": 2,
  "message": "هل يمكن التوقف في محطة الوقود؟"
}
```

### GET /sent
My bookings as passenger

### GET /received
Bookings on my offers (driver)

### PUT /:id/accept
Accept booking (driver)

### PUT /:id/reject
Reject booking (driver)

### PUT /:id/cancel
Cancel booking

### PUT /:id/complete
Mark ride complete

---

## Messages `/api/messages`

### GET /conversation/:tripId/:otherUserId
Get conversation messages
```javascript
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "مرحبا، هل الرحلة متاحة؟",
      "sender_id": "uuid",
      "created_at": "2024-01-15T08:30:00Z",
      "read_at": null
    }
  ]
}
```

### POST /
Send message
```javascript
{
  "trip_id": "uuid",
  "trip_type": "offer" | "booking",
  "receiver_id": "uuid",
  "content": "نعم متاحة، أهلاً بك"
}
```

### PUT /read
Mark messages as read
```javascript
{ "message_ids": ["uuid1", "uuid2"] }
```

### GET /conversations
List all conversations

### GET /unread-count
Get unread message count

---

## Ratings `/api/ratings`

### POST /
Submit rating
```javascript
{
  "booking_id": "uuid",
  "to_user_id": "uuid",
  "rating": 5,
  "comment": "سائق ممتاز والسيارة نظيفة"
}
```

### GET /user/:userId
Get user's ratings

---

## Error Responses

All errors follow this format:
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "رقم الهاتف غير صحيح",
    "details": { ... }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Not allowed to access resource
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `DUPLICATE_ENTRY` - Already exists
- `RATE_LIMIT` - Too many requests
