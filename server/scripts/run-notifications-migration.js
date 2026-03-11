/**
 * Script to run notifications migration
 * تشغيل migration جدول الإشعارات
 */

const fs = require('fs');
const path = require('path');
const { query, pool } = require('../config/db');

async function runNotificationsMigration() {
  try {
    console.log('🚀 بدء تشغيل migration الإشعارات...\n');

    // قراءة ملف migration
    const migrationPath = path.join(__dirname, '../migrations/005_create_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 تنفيذ migration 005_create_notifications.sql...\n');

    // تنفيذ migration
    await query(migrationSQL);

    // التحقق من إنشاء الجدول
    const tableCheck = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'notifications'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ تم إنشاء جدول notifications بنجاح!\n');
    }

    // عرض أعمدة الجدول
    const columnsResult = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);

    console.log('✅ أعمدة جدول notifications:');
    columnsResult.rows.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // عرض الفهارس
    const indexesResult = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'notifications'
    `);

    console.log('✅ الفهارس (Indexes):');
    indexesResult.rows.forEach((idx) => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log('');

    // عرض constraints
    const constraintsResult = await query(`
      SELECT con.conname, con.contype
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'notifications'
    `);

    console.log('✅ القيود (Constraints):');
    constraintsResult.rows.forEach((con) => {
      const type =
        con.contype === 'p'
          ? 'PRIMARY KEY'
          : con.contype === 'f'
            ? 'FOREIGN KEY'
            : con.contype === 'c'
              ? 'CHECK'
              : con.contype === 'u'
                ? 'UNIQUE'
                : con.contype;
      console.log(`   - ${con.conname} (${type})`);
    });
    console.log('');

    console.log('✅ Migration مكتمل بنجاح! 🎉\n');

    // إغلاق pool
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في تنفيذ migration:', error);
    await pool.end();
    process.exit(1);
  }
}

// تشغيل migration
runNotificationsMigration();
