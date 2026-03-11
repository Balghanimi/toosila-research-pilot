# 📋 سجل التغييرات - Changelog

> **للتراجع إلى commit معين:**
> ```bash
> git revert <commit-hash>  # للتراجع عن commit واحد
> git reset --hard <commit-hash>  # للتراجع كلياً (⚠️ حذر!)
> ```

---

## [2026-01-13] - v1.5.1

### 🔧 Changed
- تحسين UX: إخفاء الحقول بالتسلسل في صفحة نشر العرض
  - المدينة من/إلى تظهر أولاً
  - التاريخ والوقت يظهران بعد ملء المدينتين
  - المقاعد والسعر يظهران بعد ملء التاريخ والوقت
  - زر النشر يُفعّل فقط بعد ملء جميع الحقول
- إصلاح RTL: placeholder حقل السعر يظهر من اليمين

### 📁 Files
- `client/src/pages/offers/PostOfferModern.js` (MODIFIED)

---

## [2026-01-13] - v1.5.0

### ✨ Added
- نظام Audit Log لتتبع التغييرات
- ملف `server/middlewares/audit.js`
- Migration `022_create_audit_log.sql`

### 🔧 Changed
- `bookings.controller.js` - إضافة audit logging
- `offers.controller.js` - إضافة audit logging
- `auth.controller.js` - إضافة audit logging

### 📁 Files
- `server/middlewares/audit.js` (NEW)
- `server/database/migrations/022_create_audit_log.sql` (NEW)
- `server/controllers/bookings.controller.js` (MODIFIED)
- `server/controllers/offers.controller.js` (MODIFIED)
- `server/controllers/auth.controller.js` (MODIFIED)

---

## [2026-01-12] - v1.4.0

### ✨ Added
- إعادة تصميم الصفحة الرئيسية (Final Polish)
- تسلسل منطقي للحقول

### 🔧 Changed
- تصميم البطاقات بنمط عصري
- ألوان هادئة وحقول إدخال واضحة

---

## [2026-01-11] - v1.3.0

### ✨ Added
- نقل وضع الظلام إلى الإعدادات
- Header ثابت أثناء التمرير
- نموذج تسجيل متعدد الخطوات

### 🐛 Fixed
- مشاكل Syntax و Linting

---

## [2026-01-06] - v1.2.0

### 🐛 Fixed
- إصلاح حرج: معاينة الرسائل تظهر على المستخدم الخطأ
- `updateConversationListWithMessage` helper function
- Strict ID Matching بدلاً من التحديث الأعمى

### 🔧 Changed
- تحديث الخطوط لمظهر WhatsApp الأصلي

---

## [2026-01-02] - v1.1.0

### ✨ Added
- تحسينات Optimistic UI للرسائل
- Socket Listeners دعم `deleteForAll`
- `editMessage`: تحديث فوري مع rollback

---

## [2025-12-31] - v1.0.0

### ✨ Added
- إعادة هيكلة MessagesContext بالكامل
- Memory Leak Prevention
- Retry Logic مع Exponential Backoff
- Pagination Support مع Infinite Scroll

---

## 🔄 Git Commands

### تراجع آمن:
```bash
git revert <commit-hash>
```

### تراجع كامل (⚠️ حذر!):
```bash
git reset --hard <commit-hash>
git push --force
```

---

*آخر تحديث: 2026-01-13*
