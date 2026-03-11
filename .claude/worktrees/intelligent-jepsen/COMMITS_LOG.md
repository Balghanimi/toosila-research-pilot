# 📋 سجل الـ Commits - مرجع للتراجع

> **للتراجع إلى commit معين:**
> ```bash
> git revert <commit-hash>  # للتراجع عن commit واحد
> git reset --hard <commit-hash>  # للتراجع كلياً (⚠️ حذر!)
> ```

---

## آخر التحديثات (الأحدث أولاً)

### `PENDING` - 🎨 تحسينات واجهة المستخدم للإدارة (Admin UX)
**التاريخ:** 2026-01-23
**الملاحظات:**
- 📱 **تحسينات الموبايل (Mobile Responsiveness):**
  - تحويل جدول المستخدمين إلى بطاقات (Cards) على الموبايل
  - تكديس حقول البحث عمودياً لتناسب الشاشات الصغيرة
  - زر عائم (Floating Button) للوصول السريع للوحة الإدارة
- 🔗 **تحسين التنقل (Navigation):**
  - إضافة رابط "Admin" في الهيدر الرئيسي (يظهر للمدراء فقط)
  - إضافة رابط "Admin" في قائمة "المزيد" بلون مميز
- ✨ **تحسينات عامة:**
  - زيادة حجم الخط في حقول الإدخال إلى 16px (منع التكبير التلقائي في iOS)
  - زيادة مساحات اللمس للأزرار
- 📁 **الملفات المعدلة:**
  - `client/src/components/Navegation/Header.jsx` (Admin link added)
  - `client/src/components/BottomNav.js` (Floating button + More menu link)
  - `client/src/pages/admin/UserManagement.js` (Mobile layout + Search stack)

---

### `PENDING` - 🔒 إصلاحات أمنية إضافية (OTP Logging + JWT)
**التاريخ:** 2026-01-23
**الملاحظات:**
- 🔴 **إزالة تسجيل OTP في الـ logs:**
  - جميع console.log لرموز OTP مغلفة بـ `NODE_ENV === 'development'`
  - في production، لا يتم تسجيل أي رمز OTP أو رقم هاتف كامل
- 🔴 **تقليل مدة صلاحية JWT:**
  - تم تغيير `expiresIn` من `30d` إلى `7d` في جميع jwt.sign() calls
  - يقلل فترة الهجوم في حالة سرقة الـ token
- 📁 **الملفات المعدلة:**
  - `server/routes/otp.routes.js` (secured all OTP logs, reduced JWT to 7d)
  - `SECURITY_AUDIT_2026-01-22.md` (updated to reflect fixes)

---

### `PENDING` - 🔐 إدارة المستخدمين (Admin) + نسيت كلمة المرور (الهاتف)
**التاريخ:** 2026-01-23
**الملاحظات:**
- 🆕 **Admin User Management:**
  - بحث المستخدمين بالهاتف، الاسم، أو البريد الإلكتروني
  - عرض سجل طلبات OTP لأي رقم هاتف
  - إعادة تعيين كلمة المرور للمستخدم (إرسال OTP)
  - التحقق اليدوي من رقم الهاتف
- 🔐 **Forgot Password (Phone-based):**
  - صفحة نسيت كلمة المرور الجديدة (3 خطوات)
  - إدخال الهاتف ← OTP ← كلمة المرور الجديدة
  - تسجيل دخول تلقائي بعد التعيين
  - Rate limiting (3 محاولات/ساعة)
- 📁 **الملفات الجديدة:**
  - `server/controllers/admin.controller.js`
- 📁 **الملفات المعدلة:**
  - `server/routes/admin.routes.js` (endpoints جديدة)
  - `server/routes/otp.routes.js` (forgot-password, reset-password)
  - `client/src/services/api.js` (admin + otp methods)
  - `client/src/pages/ForgotPassword.jsx` (phone-based rewrite)
  - `client/src/pages/admin/UserManagement.js` (search, OTP modal, actions)
  - `client/src/pages/PhoneLogin.js` (رابط نسيت كلمة المرور)
  - `client/src/pages/PhoneLogin.css` (forgot-password-link styles)

---

### `PENDING` - 🔒 إصلاح ثغرات أمنية حرجة (CRITICAL-1 & CRITICAL-2)
**التاريخ:** 2026-01-22
**الملاحظات:**
- 🔴 **CRITICAL-1 (تم الإصلاح ✅):** OTP Code لم يعد يُسجَّل في production logs
  - الآن يُسجَّل فقط في بيئة التطوير مع prefix `[DEV]`
  - في production، يُسجَّل رقم الهاتف مخفياً جزئياً فقط
- 🔴 **CRITICAL-2 (تم الإصلاح ✅):** `/otp/login-existing` الآن يتطلب رمز OTP
  - لا يمكن تسجيل الدخول برقم الهاتف فقط
  - يتم التحقق من OTP ثم حذفه لمنع إعادة الاستخدام
  - تحديث حالة `phone_verified` تلقائياً
- 📁 **الملفات المعدلة:**
  - `server/routes/otp.routes.js` (lines 158, 208, 254, 528-630)
- 🔒 **مرجع:** راجع `SECURITY_AUDIT_2026-01-22.md` للتفاصيل الكاملة

---

### `PENDING` - 🔒 مراجعة أمنية شاملة قبل إطلاق Beta
**التاريخ:** 2026-01-22
**الملاحظات:**
- 🔍 **المراجعة:** تدقيق أمني شامل للـ Authentication, Authorization, Input Validation, API Security
- 🔴 **CRITICAL (2):**
  - تسجيل كود OTP في production logs - **يجب إصلاحه**
  - endpoint `/otp/login-existing` يسمح بالدخول بالرقم فقط - **خطير جداً**
- 🟠 **HIGH (5):**
  - JWT token صالح لـ 30 يوم (طويل جداً)
  - OTP لا يُحذف بعد التحقق
  - تغيير كلمة المرور لا يُبطل التوكنات القديمة
  - ثغرات في dependencies (15 server, 19 client)
- 🟡 **MEDIUM (6):** Debug endpoint, email verification معطل، console logs
- ✅ **نقاط قوة:** bcrypt 12 rounds، rate limiting ممتاز، Helmet.js، CORS صحيح
- 📁 **ملفات جديدة:**
  - `SECURITY_AUDIT_2026-01-22.md` - تقرير التدقيق الكامل
  - `SECURITY.md` - وثائق الأمان
  - `.claude/skills/toosila-dev/references/security-checklist.md`

---

### `PENDING` - 🐛 إصلاح حرج: مطابقة المحادثات تفشل (undefined → "undefined")
**التاريخ:** 2026-01-21
**الملاحظات:**
- 🐛 **المشكلة:** فتح الدردشة من صفحة العروض يظهر "No matching conversation found" رغم وجود المحادثة
- 🔍 **السبب الجذري:** `String(undefined)` كان يعود `"undefined"` بدلاً من قيمة فارغة، مما يؤدي لمطابقات خاطئة
- ✅ **الحل:**
  - إضافة `safeStringify` helper function تعيد `null` للقيم الفارغة بدلاً من `"undefined"`
  - تحسين شروط المطابقة للتأكد من أن كلا الـ ID صالحين قبل المقارنة
  - إضافة debug logging شامل لتتبع مشاكل المطابقة
- 📁 **الملفات المعدلة:**
  - `client/src/context/MessagesContext.js` (lines 174-240)
- 🚀 **للاختبار:**
  1. افتح صفحة العروض
  2. اضغط "مراسلة السائق" على عرض سبق أن راسلته
  3. يجب أن تظهر الرسائل السابقة ولا تظهر رسالة "No matching conversation"

---

### `PENDING` - 🐛 إصلاح حرج: حذف المحادثة يظهر نجاح لكنها تبقى في القائمة
**التاريخ:** 2026-01-21
**الملاحظات:**
- 🐛 **المشكلة:** عند حذف محادثة، تظهر رسالة نجاح لكن المحادثة لا تختفي من القائمة
- 🔍 **السبب الجذري:** `deleteConversation` لم يكن يحدث الـ `conversations` state مباشرة، بل يعتمد على `fetchConversations` غير المنتظر
- ✅ **الحل:**
  - إضافة optimistic removal فوري من `conversations` array قبل API call
  - إضافة rollback للـ conversations list عند فشل الحذف
  - استدعاء `fetchUnreadCount` لتحديث العداد
- 📁 **الملفات المعدلة:**
  - `client/src/context/MessagesContext.js` (function `deleteConversation`)
- 🚀 **للاختبار:**
  1. افتح صفحة الرسائل
  2. افتح محادثة واضغط حذف
  3. يجب أن تختفي المحادثة من القائمة فوراً ✅
  4. عند تحديث الصفحة، يجب أن تبقى محذوفة ✅

---

### `PENDING` - 🔧 إصلاح مشكلة اختفاء الرسائل + مطابقة المحادثات 🐛 حرج
**التاريخ:** 2026-01-18 / 2026-01-20
**الملاحظات:**

**إصلاح 1 (2026-01-18) - اختفاء الرسائل:**
- 🐛 **المشكلة:** الرسائل تظهر ثم تختفي، خاصة الرسالة الأولى
- ✅ **الحل:**
  - إزالة `clearCurrentConversation()` من useEffect في `ChatInterface.js`
  - إضافة `mergeMessagesWithOptimistic()` في `MessagesContext.js`

**إصلاح 2 (2026-01-20) - المحادثات غير موجودة:**
- 🐛 **المشكلة:** فتح الدردشة من صفحة العروض يظهر "No matching conversation"
- 🔍 **السبب:** `otherUserId` لم يكن يُستخرج من `location.state` في `Messages.js`
- ✅ **الحل:**
  - إضافة `otherUserId` إلى destructuring في `Messages.js`
  - إزالة `currentConversationKey` من polling useEffect لمنع إعادة التشغيل المتكررة

**إصلاح 3 (2026-01-20) - Polling متكرر:**
- 🐛 **المشكلة:** "Starting/Stopping message polling" يتكرر باستمرار
- ✅ **الحل:** إزالة `currentConversationKey` من dependencies في `ChatInterface.js`

- 📁 **الملفات المعدلة:**
  - `client/src/pages/Messages.js`
  - `client/src/components/Chat/ChatInterface.js`
  - `client/src/context/MessagesContext.js`
- 🚀 **النتيجة:** `npm run build` نجح ✅

---

### `PENDING` - 📱 إصلاح header المحادثة على الموبايل
**التاريخ:** 2026-01-20
**الملاحظات:**
- 🐛 **المشكلة:** header المحادثة (اسم المستخدم + زر الحذف) غير ظاهر على الموبايل
- 🔍 **السبب:** الـ chat interface لم يكن يغطي الشاشة بالكامل
- ✅ **الحل:**
  - استخدام `position: fixed` للـ chat interface wrapper
  - جعله يغطي كامل الشاشة (`top: 0, left: 0, right: 0, bottom: 0`)
  - إضافة `z-index: 100` ليكون فوق باقي العناصر
- 📁 **الملفات المعدلة:**
  - `client/src/pages/Messages.js`
- 🚀 **النتيجة:** `npm run build` نجح ✅

---

### `COMPLETE` - 👩 توثيق ميزة رحلات النساء فقط (Ladies-Only)
**التاريخ:** 2026-01-18
**الملاحظات:**
- ✅ **الميزة مطبقة بالكامل** في Backend و Frontend
- 📋 **Backend:**
  - التحقق من جنس السائق عند إنشاء رحلة للنساء (`offers.controller.js`)
  - منع الذكور من حجز رحلات النساء (`booking.service.js`)
  - فلتر `ladies_only` في البحث
- 📱 **Frontend:**
  - اختيار الجنس عند التسجيل (`Register.js`)
  - Toggle للسائقات فقط (`Home.js`)
  - Badge "👩 للنساء فقط" على البطاقات (`OfferCard.jsx`)
  - فلتر البحث (`CollapsibleSearchForm.jsx`)
- 📚 **تحديث Skill:** تم إضافة توثيق كامل للميزة في `toosila-dev` skill

---

### `8d70438` - 🔧 إصلاح أخطاء Prettier في ViewDemands.js ✅
**التاريخ:** 2026-01-15
**الملاحظات:**
- 🐛 **إصلاح Build:** حل مشكلة فشل البناء على Railway بسبب أخطاء Prettier
- ✅ **الإصلاحات المطبقة:**
  - إزالة المسافة الزائدة في arrow function: `() => { }` → `() => {}`
  - إزالة السطر الفارغ الزائد في نهاية الملف
- 🚀 **النتيجة:** البناء على Railway يعمل بنجاح الآن
- 📁 **الملفات المعدلة:** `client/src/pages/demands/ViewDemands.js`

---

### `PENDING` - 📅 إعادة تصميم منتقي التاريخ والوقت (Emerald Theme) ✨
**التاريخ:** 2026-01-13
**الملاحظات:**
- 🎨 **تصميم عصري:** إعادة تصميم كامل لمكون `DateTimeSelector` بنمط "Minimalist Green".
- 🟩 **Emerald Theme:** استخدام تدرجات اللون الأخضر الزمردي ليتناسب مع الهوية البصرية.
- 📱 **واجهة مستخدم محسنة:**
  - أزرار "كروت" أنيقة لاختيار (اليوم / غداً / تاريخ آخر).
  - حقول إدخال مع أيقونات وتأثيرات تركيز ناعمة.
  - قسم "أوقات مقترحة" يسهل الاختيار السريع.
  - ملخص أنيق للتاريخ والوقت المختار.
- ♿ **تحسينات إضافية:** دعم أفضل للعربية وتحسين تجربة المستخدم على الموبايل.

---

### `PENDING` - 🏠 إعادة تصميم الصفحة الرئيسية (Final Polish)
**التاريخ:** 2026-01-12
**الملاحظات:**
- 🎨 **تصميم البطاقات:** إعادة تصميم قسم الوقت والتاريخ بتصميم "Card" عصري وأزرار كبيرة.
- 🚦 **تسلسل منطقي صارم:**
  1. اختيار الموقعين (من/إلى).
  2. ظهور قسم الوقت والتاريخ.
  3. بعد تحديد الوقت: تظهر المقاعد والسعر.
  4. أخيراً: يظهر زر النشر.
- ✨ **تحسينات:** استخدام ألوان هادئة وحقول إدخال واضحة.

---

### `PENDING` - ⚙️ نقل وضع الظلام إلى الإعدادات + إصلاحات
**التاريخ:** 2026-01-11
**الملاحظات:**
- 🔧 **إصلاحات:** نقل زر الوضع المظلم من الهيدر إلى صفحة الإعدادات لتحسين تجربة المستخدم.
- ✨ **ميزة جديدة:** إضافة رابط "الإعدادات" في القائمة العلوية والقائمة الجانبية.
- 🐛 **إصلاح تقني:** حل مشاكل Syntax و Linting (Prettier) في `Settings.js` و `header.jsx`.
- ✅ **تحسين:** تنظيم واجهة المستخدم واختصار عناصر الهيدر.

---

### `PENDING` - 🚀 إصلاح Header ثابت + تسجيل متعدد الخطوات ✨
**التاريخ:** 2026-01-11
**الملاحظات:**
- 🐛 **إصلاح الواجهة:** جعل الـ Header ثابتاً (Fixed) أثناء التمرير لتحسين التنقل.
- ✨ **ميزة جديدة:** نموذج تسجيل دخول متعدد الخطوات (Wizard) لدعم متطلبات السوق العراقي.
- ✅ **تحسينات:** إضافة حقول جديدة (الجنس، المدينة، معلومات المركبة) مع التحقق من صحتها.
- 🔧 **إصلاح تقني:** حل مشاكل Linting و Build في الـ Frontend.

---

### `PENDING` - 🔥 إصلاح حرج: معاينة الرسائل تظهر على المستخدم الخطأ 🐛 خطير
**التاريخ:** 2026-01-06  
**الملاحظات:**
- ✅ إضافة `updateConversationListWithMessage` helper function
- ✅ تطبيق **Strict ID Matching** بدلاً من التحديث الأعمى
- ✅ تعديل `sendMessage` لتحديث البطاقة الصحيحة فوراً
- ✅ تعديل `handleNewMessage` (Socket) للمطابقة الدقيقة
- ✅ المحادثة المُحدَّثة تنتقل لأعلى القائمة تلقائياً
- 🎯 **الحل:** لن تظهر معاينة الرسالة على بطاقة مستخدم خطأ مرة أخرى

---

### `PENDING` - تحديث الخطوط لمظهر WhatsApp الأصلي 🎨
**التاريخ:** 2026-01-06  
**الملاحظات:**
- ✅ استبدال خطوط Cairo/Tajawal بـ System Font Stack
- ✅ استخدام `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto...`
- ✅ إضافة دعم Apple Color Emoji و Segoe UI Emoji
- ✅ تحسين وضوح الخط مع `webkit-font-smoothing: antialiased`
- 🎯 **الهدف:** مظهر أصلي مثل تطبيق WhatsApp

---

### `f6f08d6` - تحسينات Optimistic UI للرسائل ⚡
**التاريخ:** 2026-01-02  
**الملاحظات:**
- ✅ تحديث Socket Listeners لدعم `deleteForAll` flag
- ✅ `editMessage`: تحديث فوري للواجهة قبل API مع rollback عند الفشل
- ✅ `deleteMessage`: حذف/إخفاء فوري حسب `deleteForAll` مع rollback
- ✅ `deleteConversation`: مسح المحادثة فوراً قبل API مع rollback
- ✅ إصلاح تنسيق Prettier للـ ternary operators

---

### `PENDING` - إعادة هيكلة MessagesContext بالكامل 🔄 شامل
**التاريخ:** 2025-12-31  
**الملاحظات:**
- ✅ إصلاح Missing Dependency في Socket useEffect
- ✅ Memory Leak Prevention مع cleanup صحيح
- ✅ تحسين منطق كشف الرسائل المكررة
- ✅ Retry Logic مع Exponential Backoff (3 محاولات)
- ✅ Debouncing للأحداث السريعة
- ✅ PropTypes للـ Component
- ✅ Loading States منفصلة لكل عملية
- ✅ Pagination Support مع Infinite Scroll
- ✅ تحسين التعامل مع الأخطاء
- ✅ Backward Compatibility محفوظ

---

### `PENDING` - إصلاح اختفاء الرسائل عند الدخول للمحادثة 🐛 مهم
**التاريخ:** 2025-12-30  
**الملاحظات:**
- تحديث `ChatInterface.js` للتعامل مع `otherUserId` المفقود
- استخراج `otherUserId` من `location.state` كخيار بديل
- يحل مشكلة ظهور المحادثة فارغة بعد التحديث

---

### `PENDING` - إصلاح الرسائل الفورية (Real-time) 🔔 جديد
**التاريخ:** 2025-12-30  
**الملاحظات:**
- إضافة Socket.io listener في `MessagesContext.js`
- الرسائل الجديدة تظهر مباشرة بدون refresh
- يتم تحديث قائمة المحادثات تلقائياً

---

### `ad7265e` - إصلاح Prettier نهائي 🔧 ✅
**التاريخ:** 2025-12-30  
**الملاحظات:**
- تشغيل `npx prettier --write` على `MessagesContext.js`
- إصلاح جميع مشاكل indentation
- البناء على Railway يجب أن ينجح الآن

---

### `9c9a153` - إصلاح تنسيق Prettier (جزئي)
**التاريخ:** 2025-12-30  
**الملاحظات:**
- محاولة إصلاح indentation يدوياً (لم تكتمل)

---

### `2ebc7e2` - إضافة عداد الرسائل غير المقروءة 🔔
**التاريخ:** 2025-12-30  
**الملاحظات:**
- إضافة `unread_count` إلى استعلام `getConversationList`
- حساب الرسائل غير المقروءة لكل محادثة
- الواجهة الأمامية تدعم عرض المؤشرات بالفعل
- يظهر رقم أحمر على المحادثات التي بها رسائل غير مقروءة

---

### `5722500` - إصلاح تسرب الرسائل ومشاكل البناء ⭐ مهم
**التاريخ:** 2025-12-30  
**الملاحظات:**
- إصلاح Socket.io لإرسال الإشعارات للمستلم المحدد فقط (منع تسرب الرسائل)
- تحديث `messages.controller.js` لاستخدام `recipientId`
- إضافة migration لأعمدة `deleted_at`, `deleted_for_everyone`, `is_edited`, `receiver_id`
- **⚠️ يتطلب:** تشغيل migration على قاعدة البيانات

---

### `dc3cb19` - إصلاح اختفاء الرسائل
**التاريخ:** 2025-12-30  
**الملاحظات:**
- إضافة فلاتر لاستبعاد الرسائل المحذوفة من الاستعلامات
- إصلاح `getConversationList`, `getByRideStrict`, `getByRide`

---

### `e3f66da` - إصلاح خطأ SQL syntax
**التاريخ:** 2025-12-30  
**الملاحظات:**
- إصلاح فاصلة مفقودة في CTE

---

### `23a23d6` - تحسينات نظام الرسائل
**التاريخ:** 2025-12-28  
**الملاحظات:**
- تحسينات عامة على نظام المراسلة

---

### `253112c` - مزامنة Profile badge مع ModeContext
**التاريخ:** 2025-12-20  
**الملاحظات:**
- إصلاح عرض الشارة في الملف الشخصي عند تبديل الوضع

---

## 🔄 كيفية التراجع

### تراجع آمن (يحافظ على التاريخ):
```bash
git revert 5722500
```

### تراجع كامل (⚠️ يحذف التغييرات نهائياً):
```bash
git reset --hard dc3cb19
git push --force
```

### معاينة التغييرات قبل التراجع:
```bash
git show 5722500
git diff dc3cb19..5722500
```

---

## 📝 ملاحظات إضافية

- **Commit آمن للرجوع إليه:** `23a23d6` (قبل إصلاحات الرسائل الأخيرة)
- **آخر إصدار مستقر معروف:** `253112c` (20 ديسمبر)

---

*آخر تحديث: 2026-01-21*
