import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
export const digest = token => createHash('sha256').update(token).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${Buffer.from(await scrypt(password, salt, 64)).toString('hex')}`;
}
export async function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export const userView = row => ({ ...row.profile, id:row.id, email:row.email, firstName:row.first_name, lastName:row.last_name, role:row.role, status:row.status });
export function cookie(token, clear = false) { return `unilink_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 604800}${process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : ''}`; }
export function assert(condition, message, status = 422) { if (!condition) throw Object.assign(new Error(message), {status}); }
export function text(value, name, max = 200, required = true) { assert(typeof value === 'string' && (!required || value.trim()) && value.length <= max, `Invalid ${name}`); return value.trim(); }
export function uuid(value) { assert(typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value), 'Invalid ID',400); return value; }
