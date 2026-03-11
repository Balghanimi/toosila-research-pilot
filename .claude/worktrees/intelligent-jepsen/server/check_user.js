const { query } = require('./config/db');
const fs = require('fs');

async function checkUser() {
    try {
        let output = '';

        // Check all tables in the database
        const tablesResult = await query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
        );

        output += '=== ALL TABLES ===\n';
        tablesResult.rows.forEach(t => output += `- ${t.table_name}\n`);

        // Check all columns with phone in name
        const phoneColumnsResult = await query(
            `SELECT table_name, column_name FROM information_schema.columns 
       WHERE column_name LIKE '%phone%' AND table_schema = 'public' ORDER BY table_name`
        );

        output += '\n=== ALL PHONE COLUMNS ===\n';
        if (phoneColumnsResult.rows.length > 0) {
            phoneColumnsResult.rows.forEach(t => output += `- ${t.table_name}.${t.column_name}\n`);
        } else {
            output += 'No phone columns found in any table!\n';
        }

        // Check total users count
        const countResult = await query(`SELECT COUNT(*) as total FROM users`);
        output += '\n=== TOTAL USERS ===\n';
        output += `Total users in database: ${countResult.rows[0].total}\n`;

        // Show last 10 users created
        const usersResult = await query(
            `SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10`
        );

        output += '\n=== LAST 10 USERS ===\n';
        usersResult.rows.forEach(u => {
            output += `- ${u.name} | ${u.email} | Created: ${u.created_at}\n`;
        });

        // Write to file
        fs.writeFileSync('db_check_results.txt', output);
        console.log('Results written to db_check_results.txt');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUser();
