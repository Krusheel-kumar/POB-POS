"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pgDatabase_js_1 = require("./pgDatabase.js");
async function runMigration() {
    console.log('[PostgreSQL] Running schema migration & seeding...');
    try {
        await pgDatabase_js_1.pgDatabase.initSchema();
        console.log('✅ [PostgreSQL] Schema migration & seeding completed successfully!');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ [PostgreSQL] Migration failed:', err.message);
        process.exit(1);
    }
}
runMigration();
