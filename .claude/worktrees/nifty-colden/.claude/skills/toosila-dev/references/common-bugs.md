# Toosila Common Bugs & Fixes

## 🔴 Critical Issues

### 1. Messages Appear Then Disappear

**Symptoms:**
- Send a message, it shows briefly, then vanishes
- Need to refresh page to see message
- First message in conversation never shows

**Root Causes:**
1. `clearCurrentConversation()` being called in ChatInterface useEffect on every re-render
2. Polling fetches old data and replaces the optimistic message

**Fix 1 - Remove premature clear (ChatInterface.js):**
```javascript
// BAD ❌ - Clears optimistic messages on re-render
useEffect(() => {
  if (clearCurrentConversation) {
    clearCurrentConversation(); // This wipes the optimistic message!
  }
  fetchRideConversation(rideType, tripId, otherUserId);
}, [tripId, rideType, ...]);

// GOOD ✅ - Let fetchRideConversation handle clearing when key changes
useEffect(() => {
  // NOTE: clearCurrentConversation is handled inside fetchRideConversation
  // when the conversation key actually changes (prevKey !== conversationKey)
  fetchRideConversation(rideType, tripId, otherUserId);
}, [tripId, rideType, ...]);
```

**Fix 2 - Merge with pending messages (MessagesContext.js):**
```javascript
// Add this utility function
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

// In fetchRideConversation, use merge instead of replace:
// BAD ❌
setCurrentConversation(normalizedMessages);

// GOOD ✅
setCurrentConversation((prev) =>
  mergeMessagesWithOptimistic(prev, normalizedMessages)
);
```

**Files Modified:**
- `client/src/components/Chat/ChatInterface.js` - Remove clearCurrentConversation from useEffect
- `client/src/context/MessagesContext.js` - Add mergeMessagesWithOptimistic function

---

### 2. Infinite Re-renders

**Symptoms:**
- Page freezes
- Console shows thousands of renders
- "Maximum update depth exceeded" error

**Root Cause:**
Functions in useEffect dependencies without useCallback.

**Fix:**
```javascript
// BAD ❌
const fetchData = async () => { ... };

useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData recreated every render!

// GOOD ✅
const fetchData = useCallback(async () => {
  ...
}, [dependency1, dependency2]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

### 3. JWT Token Issues

**Symptoms:**
- Suddenly logged out
- API calls return 401
- "Invalid token" errors

**Fix - Add token refresh check:**
```javascript
// In http.js (axios interceptor)
import { jwtDecode } from 'jwt-decode';

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Check if token is expired
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();
    
    if (isExpired) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject('Token expired');
    }
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
```

---

## 🟡 UI Issues

### 4. Arabic Text Not Displaying Correctly

**Symptoms:**
- Arabic shows as boxes or ???
- Text alignment wrong
- Numbers not in Arabic format

**Fix:**
```html
<!-- In index.html -->
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
</head>
```

```css
/* In global.css */
body {
  font-family: 'Cairo', sans-serif;
  direction: rtl;
  text-align: right;
}

/* For numbers to stay LTR */
.number, .price, .phone {
  direction: ltr;
  unicode-bidi: embed;
}
```

---

### 5. RTL Layout Broken

**Symptoms:**
- Icons pointing wrong direction
- Margins/padding on wrong side
- Flex items in wrong order

**Fix:**
```css
/* Flip horizontal icons */
[dir="rtl"] .icon-arrow,
[dir="rtl"] .icon-chevron {
  transform: scaleX(-1);
}

/* Reverse flex direction where needed */
[dir="rtl"] .breadcrumb {
  flex-direction: row-reverse;
}

/* Swap margins */
[dir="rtl"] .avatar {
  margin-left: 0;
  margin-right: 0.5rem;
}

/* Use logical properties (modern approach) */
.card {
  margin-inline-start: 1rem; /* Works for both RTL and LTR */
  padding-inline-end: 0.5rem;
}
```

---

### 6. Mobile Keyboard Covers Input

**Symptoms:**
- Can't see what you're typing
- Input hidden behind keyboard
- Chat input not visible

**Fix:**
```css
/* For chat input */
.chat-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Scroll into view when focused */
.chat-input:focus {
  scroll-margin-bottom: 100px;
}
```

```javascript
// In component
const inputRef = useRef();

const handleFocus = () => {
  setTimeout(() => {
    inputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 300); // Wait for keyboard
};
```

---

## 🟢 Performance Issues

### 7. Slow Message Loading

**Symptoms:**
- Messages take 2-3 seconds to load
- UI feels sluggish
- Typing feels laggy

**Fix - Debounce polling:**
```javascript
// Don't poll while typing
const [isTyping, setIsTyping] = useState(false);

useEffect(() => {
  if (isTyping) return; // Skip poll while typing
  
  const interval = setInterval(pollMessages, 3000);
  return () => clearInterval(interval);
}, [isTyping, tripId]);

// Debounce typing detection
const handleInputChange = useMemo(
  () => debounce(() => setIsTyping(false), 1000),
  []
);
```

---

### 8. Memory Leak in useEffect

**Symptoms:**
- Warning: "Can't perform state update on unmounted component"
- App gets slower over time

**Fix:**
```javascript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const response = await api.getData();
    if (isMounted) {
      setData(response.data);
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

---

## 🔍 Debugging Commands

```bash
# Check for console errors
# Open DevTools → Console

# Monitor network requests
# Open DevTools → Network → Filter: XHR

# Check component re-renders
# Add to component:
useEffect(() => {
  console.log('Component rendered', { props, state });
});

# Check state changes
# In Context:
useEffect(() => {
  console.log('Messages changed:', messages.length, messages);
}, [messages]);

# Database query check
psql $DATABASE_URL -c "SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;"
```

---

## Quick Checklist

When debugging any issue:

1. [ ] Check browser console for errors
2. [ ] Check Network tab for failed requests
3. [ ] Check API response format matches expectation
4. [ ] Check state is updating correctly (console.log)
5. [ ] Check useEffect dependencies
6. [ ] Check for race conditions in async code
7. [ ] Test in both Arabic and English
8. [ ] Test on mobile viewport
