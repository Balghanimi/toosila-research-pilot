---
name: toosila-dev
description: |
  Complete development skill for Toosila (توصيلة), an Iraqi intercity ride-sharing platform.
  Use when: building features, debugging issues, writing React/Node code, handling Arabic RTL,
  working with messaging system, managing PostgreSQL queries, implementing Iraqi-specific features
  (cities, currency, phone formats), fixing state management issues, or any Toosila development task.
  Covers: React 18 + Context API, Node.js/Express, PostgreSQL, JWT auth, real-time messaging,
  Arabic localization, ladies-only rides, and Iraqi payment integration patterns.
---

# Toosila Development Skill (توصيلة)

> Iraqi intercity ride-sharing platform connecting drivers and passengers.

## Quick Reference

### Tech Stack
- **Frontend:** React 18, Context API, CSS Modules, RTL Arabic
- **Backend:** Node.js/Express, JWT authentication
- **Database:** PostgreSQL (Railway/Neon)
- **APIs:** OTPIQ for OTP verification

### Project Structure
```
client/src/
├── contexts/       # AuthContext, MessagesContext, OffersContext...
├── pages/          # Route-level components
├── components/     # Reusable UI
├── services/       # API calls (axios)
└── utils/          # Helpers

server/
├── controllers/    # Request handlers
├── models/         # Database queries
├── routes/         # API endpoints
└── middlewares/    # Auth, validation
```

---

## Core Patterns

### 1. React Context Pattern
```javascript
// ✅ Correct pattern for Toosila contexts
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await api.getData();
    setData(response.data);
  } catch (err) {
    setError(err.message || 'حدث خطأ');
  } finally {
    setLoading(false);
  }
};
```

### 2. API Service Pattern
```javascript
// services/messages.api.js
import http from './http';

export const messagesAPI = {
  getConversation: (tripId, otherUserId) => 
    http.get(`/messages/conversation/${tripId}/${otherUserId}`),
  
  send: (data) => http.post('/messages', data),
  
  markAsRead: (messageIds) => 
    http.put('/messages/read', { messageIds }),
};
```

### 3. Optimistic Updates (Messages)
```javascript
// ✅ Correct optimistic update pattern
const sendMessage = async (content) => {
  const tempId = `temp-${Date.now()}`;
  const tempMessage = {
    id: tempId,
    content,
    sender_id: user.id,
    created_at: new Date().toISOString(),
    pending: true
  };
  
  // Add immediately (optimistic)
  setMessages(prev => [...prev, tempMessage]);
  
  try {
    const response = await messagesAPI.send({ content, ... });
    // Replace temp with real
    setMessages(prev => 
      prev.map(m => m.id === tempId ? response.data : m)
    );
  } catch (error) {
    // Remove temp on error
    setMessages(prev => prev.filter(m => m.id !== tempId));
    setError('فشل إرسال الرسالة');
  }
};
```

### 4. Polling Without Race Conditions
```javascript
// ✅ Safe polling pattern with optimistic message preservation
useEffect(() => {
  let isMounted = true;
  
  const poll = async () => {
    if (!isMounted) return;
    const response = await messagesAPI.getConversation(tripId);
    if (isMounted) {
      setMessages(prev => mergeMessagesWithOptimistic(prev, response.data));
    }
  };
  
  const interval = setInterval(poll, 3000);
  poll(); // Initial fetch
  
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}, [tripId]);

// 🔥 CRITICAL: Merge helper - preserves optimistic messages during polling
const mergeMessagesWithOptimistic = (existingMessages, serverMessages) => {
  // 1. Identify optimistic/pending messages
  const optimisticMessages = existingMessages.filter(
    (msg) => msg.isOptimistic || msg.isSending || msg.tempId
  );

  // 2. Check which optimistic messages have been confirmed by server
  const pendingOptimistic = optimisticMessages.filter((optMsg) => {
    const matchInServer = serverMessages.find(
      (serverMsg) =>
        serverMsg.content === optMsg.content &&
        String(serverMsg.sender_id) === String(optMsg.sender_id) &&
        Math.abs(
          new Date(serverMsg.created_at).getTime() -
          new Date(optMsg.created_at).getTime()
        ) < 30000
    );
    return !matchInServer; // Keep only messages NOT yet on server
  });

  // 3. Merge and sort
  return [...serverMessages, ...pendingOptimistic].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
};
```

---

## Iraqi-Specific Features

### Cities List
See `references/iraqi-data.md` for complete list with coordinates.

### Currency Formatting
```javascript
const formatIraqiPrice = (amount) => {
  return new Intl.NumberFormat('ar-IQ').format(amount) + ' د.ع';
};
// Output: "150,000 د.ع"
```

### Phone Formatting
```javascript
const formatIraqiPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('964')) {
    return `+${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,9)} ${digits.slice(9)}`;
  }
  return phone;
};
```

### RTL Layout
```css
[dir="rtl"] { text-align: right; }
[dir="rtl"] .arrow-icon { transform: scaleX(-1); }
[dir="rtl"] .card { margin-left: 0; margin-right: 1rem; }
```

---

## Ladies-Only Rides (رحلات للنساء فقط) ✅

### Overview
Female drivers can create rides exclusively for female passengers.

### Implementation Status: **COMPLETE**

| Component | Location | Status |
|-----------|----------|--------|
| Driver validation | `offers.controller.js:12-14` | ✅ |
| Booking validation | `booking.service.js:47-54` | ✅ |
| Filter in search | `offers.controller.js:77-78` | ✅ |
| Gender in registration | `Register.js` | ✅ |
| Toggle for drivers | `Home.js:602` | ✅ |
| Badge on cards | `OfferCard.jsx:39-44` | ✅ |
| Search filter | `CollapsibleSearchForm.jsx` | ✅ |
| DB migration | `021_add_ladies_only` | ✅ |

### Key Code Patterns

**Backend - Create Offer Validation:**
```javascript
// offers.controller.js
if (isLadiesOnly && req.user.gender !== 'female') {
  throw new AppError('فقط السائقات الإناث يمكنهن إنشاء رحلات للنساء فقط', 403);
}
```

**Backend - Booking Validation:**
```javascript
// booking.service.js
if (offer.isLadiesOnly) {
  const userResult = await query('SELECT gender FROM users WHERE id = $1', [userId]);
  if (userResult.rows[0]?.gender !== 'female') {
    throw new ForbiddenError('هذه الرحلة مخصصة للنساء فقط');
  }
}
```

**Frontend - Show Toggle Only for Females:**
```jsx
{mode === 'offer' && currentUser?.gender === 'female' && (
  <LadiesOnlyToggle ... />
)}
```

**Frontend - Badge Style:**
```css
.ladiesOnlyBadge {
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  color: white;
  border-radius: 9999px;
}
```


---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Messages appear then disappear | Polling overwrites optimistic | Use merge function |
| First message doesn't show | Empty state handling | Initialize with `[]` |
| Infinite re-renders | Wrong useEffect deps | Use `useCallback` |
| Arabic text broken | Missing font | Add Cairo font |
| JWT expired | No refresh logic | Check & redirect |

See `references/common-bugs.md` for detailed solutions.

---

## Testing Checklist

- [ ] Test as driver (create offer, accept booking)
- [ ] Test as passenger (search, book, message)
- [ ] Test Arabic text and RTL layout
- [ ] Test on mobile viewport
- [ ] Test error states
- [ ] Check console for errors
- [ ] **Ladies-Only:** Female driver can create ladies-only ride
- [ ] **Ladies-Only:** Male driver cannot see ladies-only toggle
- [ ] **Ladies-Only:** Female passenger can book ladies-only ride
- [ ] **Ladies-Only:** Male passenger cannot book ladies-only ride


---

## File References

- `references/api-endpoints.md` - All API routes
- `references/database-schema.md` - Full DB schema
- `references/common-bugs.md` - Known issues & fixes
- `references/iraqi-data.md` - Cities, provinces, formats
