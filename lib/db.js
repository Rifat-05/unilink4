import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export function sslConfig(env = process.env) {
  const caPath = env.DB_SSL_CA_PATH?.trim();
  const inlineCA = env.DB_SSL_CA?.trim();
  if (caPath && inlineCA) throw new Error('Set only one of DB_SSL_CA_PATH or DB_SSL_CA');
  let ca;
  if (caPath) {
    try { ca = readFileSync(resolve(projectRoot, caPath), 'utf8'); }
    catch { throw new Error('Cannot read DB_SSL_CA_PATH. Use a project-relative path and include the certificate in the deployment.'); }
  } else if (inlineCA) ca = inlineCA.replace(/\\n/g, '\n');
  if (ca && !ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('The database CA must be a PEM certificate');
  if (ca || env.NODE_ENV === 'production' || env.VERCEL || env.DB_SSL === 'true') {
    return { ...(ca ? { ca } : {}), rejectUnauthorized: true, verifyIdentity: true };
  }
  return undefined;
}
let pool;
function config(){if(process.env.DATABASE_URL)return {uri:process.env.DATABASE_URL};const required=['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME'];if(required.some(n=>process.env[n]===undefined))throw Object.assign(new Error('DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD and DB_NAME are required'),{status:503});return {host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME};}
export function database(){if(!pool){const o=config();pool=mysql.createPool({...o,waitForConnections:true,connectionLimit:5,queueLimit:0,ssl:sslConfig()});}return pool;}
export async function transaction(work){const c=await database().getConnection();try{await c.beginTransaction();const r=await work(c);await c.commit();return r;}catch(e){await c.rollback();throw e;}finally{c.release();}}
export async function closeDatabase(){if(pool){await pool.end();pool=undefined;}}
