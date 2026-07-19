// One-off script: reset admin password
// Run with: node scripts/reset-admin-password.mjs
import { pool } from '../lib/db/src/index.ts';

// Hash generated beforehand with bcrypt cost 10
const HASH = '$2b$10$trzCFcqHhFtS.rwt5/u8M.wUphB/ozDsNGrJO5flCnU7Qhs8dIHYa';
const EMAIL = 'admin@daralmaghrib.com';

const { rows } = await pool.query(
  "UPDATE users SET password_hash = $1 WHERE email = $2 AND role = 'admin' RETURNING id, name, email, role",
  [HASH, EMAIL]
);
console.log('Updated rows:', rows);
await pool.end();
