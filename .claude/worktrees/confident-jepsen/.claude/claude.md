# Toosila Project Rules (توصيلة)

## Golden Rule
**DO NOT TOUCH WORKING CODE.** Before changing any file, ask: "Does this file NEED to change for THIS SPECIFIC task?" If no → don't touch it. If yes → make MINIMAL changes only.

## Before Any Change
1. Identify files that MUST change (not "might be nice")
2. List files that are WORKING → DO NOT TOUCH
3. Announce: "I will modify X.js. I will NOT touch Y.js"
4. Make ONE change at a time, test after each

## Never Do
- Modify files outside the task scope
- "Improve" or refactor working code
- Add features that weren't requested
- Add npm packages without asking
- Change database schema without asking

## Three-Way Thinking
Before any action, consider:
1. **User View**: Is it clear? Does Arabic/RTL look right?
2. **Developer View**: Is it correct? Secure? Handles errors?
3. **Outside Box**: Am I solving the right problem? What could break?

## Toosila-Specific
- **RTL/Arabic**: Always test with Arabic text, check RTL layout
- **Currency**: Format as "150,000 د.ع"
- **Phone**: Iraqi format (+964)
- **Mode Context**: 
  - `mode === 'driver'` → Show الطلبات (demands)
  - `mode === 'passenger'` → Show العروض (offers)

## When Fixing Bugs
1. REPRODUCE → See the bug
2. ISOLATE → Find the file
3. IDENTIFY → Root cause
4. FIX → Minimal fix, ONLY this file
5. VERIFY → Fixed? Nothing else broke?

## Project Structure
```
client/src/
├── pages/       # Route-level components
├── components/  # Reusable UI
├── context/     # Global state (AuthContext, ModeContext, etc.)
├── services/    # API calls
└── styles/      # CSS files

server/
├── routes/      # API routes
├── controllers/ # Request handlers
├── models/      # Database queries
└── middlewares/ # Auth, validation
```

## Quick Checklist
- [ ] Only changed files mentioned in task?
- [ ] Touched any working file? (If yes → REVERT!)
- [ ] Simplest solution?
- [ ] Found root cause?
- [ ] Tested it?

---

## 📝 Documentation Rules (قواعد التوثيق)

### When to Document:
| Change Type | What to Update |
|-------------|----------------|
| Bug Fix صغير | ❌ لا يحتاج |
| Feature جديدة | CHANGELOG + Report |
| تغيير Database | DATABASE_SCHEMA + Migration |
| API جديد | API_DOCS |

### Files Structure:
```
/docs
├── CHANGELOG.md        # سجل التغييرات
├── DATABASE_SCHEMA.md  # جداول قاعدة البيانات
└── API_DOCS.md         # توثيق الـ API (اختياري)
```

### CHANGELOG Format:
```markdown
## [YYYY-MM-DD] - vX.X.X
### ✨ Added
### 🔧 Changed
### 🐛 Fixed
### 📁 Files: file1.js, file2.js
```

### Quick Report (للتغييرات الكبيرة فقط):
```
✅ What was done: [وصف مختصر]
📁 Files changed: [قائمة الملفات]
🧪 How to test: [خطوات الاختبار]
```

### Version Numbering:
- Bug fix: v1.0.0 → v1.0.1
- New feature: v1.0.1 → v1.1.0
- Breaking change: v1.1.0 → v2.0.0

---
*Project: Toosila (توصيلة) - Iraqi Ride-Sharing App*
