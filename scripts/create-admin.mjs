import { randomUUID } from 'node:crypto';
import { database, closeDatabase } from '../lib/db.js';
import { hashPassword, text, assert } from '../lib/security.js';
const email=text(process.env.ADMIN_EMAIL,'ADMIN_EMAIL',255).toLowerCase();
const password=text(process.env.ADMIN_PASSWORD,'ADMIN_PASSWORD',128);
assert(password.length>=12,'Use an administrator password of at least 12 characters');
assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Invalid admin email');
try { await database().execute("INSERT INTO users(id,email,password_hash,first_name,last_name,role,profile) VALUES(?,?,?,'UniLink','Administrator','admin','{}')",[randomUUID(),email,await hashPassword(password)]);console.log('Administrator created. Remove ADMIN_PASSWORD from the environment.'); }
finally { await closeDatabase(); }
