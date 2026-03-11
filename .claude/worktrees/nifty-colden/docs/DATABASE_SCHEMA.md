# 🗄️ Database Schema - Toosila

## Quick Reference

| Table | Purpose |
|-------|---------|
| `users` | المستخدمين |
| `offers` | عروض الرحلات (السائقين) |
| `demands` | طلبات الرحلات (الركاب) |
| `bookings` | الحجوزات |
| `messages` | الرسائل |
| `notifications` | الإشعارات |
| `ratings` | التقييمات |
| `audit_log` | سجل التدقيق |

---

## 📋 Table: audit_log

### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | - | Primary Key |
| table_name | VARCHAR(100) | NO | - | الجدول المُعدَّل |
| record_id | INTEGER | YES | - | ID السجل |
| action | VARCHAR(50) | NO | - | create/update/delete |
| old_data | JSONB | YES | - | البيانات القديمة |
| new_data | JSONB | YES | - | البيانات الجديدة |
| user_id | INTEGER | YES | - | المستخدم المُنفِّذ |
| ip_address | VARCHAR(45) | YES | - | عنوان IP |
| created_at | TIMESTAMP | NO | NOW() | وقت التنفيذ |

### Indexes
| Index | Columns | Type |
|-------|---------|------|
| idx_audit_log_table_name | table_name | BTREE |
| idx_audit_log_record_id | record_id | BTREE |
| idx_audit_log_user_id | user_id | BTREE |
| idx_audit_log_action | action | BTREE |
| idx_audit_log_created_at | created_at DESC | BTREE |

### Migration
- Number: 022
- File: `022_create_audit_log.sql`
- Date: 2026-01-13

---

## 📋 Table: offers

### Key Columns
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| driver_id | INTEGER | FK → users |
| from_city | VARCHAR | مدينة الانطلاق |
| to_city | VARCHAR | مدينة الوصول |
| departure_time | TIMESTAMP | وقت المغادرة |
| seats | INTEGER | المقاعد المتاحة |
| price | DECIMAL | السعر |
| is_ladies_only | BOOLEAN | للنساء فقط |
| is_active | BOOLEAN | نشط/غير نشط |

---

## 📋 Table: demands

### Key Columns
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| passenger_id | INTEGER | FK → users |
| from_city | VARCHAR | مدينة الانطلاق |
| to_city | VARCHAR | مدينة الوصول |
| earliest_time | TIMESTAMP | أقرب وقت |
| latest_time | TIMESTAMP | أبعد وقت |
| seats | INTEGER | المقاعد المطلوبة |
| budget_max | DECIMAL | الحد الأقصى للميزانية |
| is_ladies_only | BOOLEAN | للنساء فقط |

---

## 📋 Table: bookings

### Key Columns
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| offer_id | INTEGER | FK → offers |
| passenger_id | INTEGER | FK → users |
| seats | INTEGER | المقاعد المحجوزة |
| status | VARCHAR | pending/accepted/cancelled |
| total_price | DECIMAL | السعر الإجمالي |

---

## 🔄 Migrations History

| # | File | Description | Date |
|---|------|-------------|------|
| 021 | add_ladies_only_to_offers_demands.sql | إضافة حقل is_ladies_only | 2026-01-12 |
| 022 | create_audit_log.sql | إنشاء جدول audit_log | 2026-01-13 |

---

*آخر تحديث: 2026-01-13*
