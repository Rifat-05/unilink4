import test from 'node:test';
import assert from 'node:assert/strict';
import { sslConfig } from '../lib/db.js';

test('production and Vercel require certificate and hostname verification', () => {
  for (const env of [{NODE_ENV:'production'}, {VERCEL:'1'}, {DB_SSL:'true'}]) {
    assert.deepEqual(sslConfig(env), {rejectUnauthorized:true, verifyIdentity:true});
  }
});
test('a CA enables TLS in local development; escaped PEM newlines are supported', () => {
  const pem = '-----BEGIN CERTIFICATE-----\\nexample\\n-----END CERTIFICATE-----';
  const config = sslConfig({NODE_ENV:'development', DB_SSL_CA:pem});
  assert.equal(config.rejectUnauthorized, true);
  assert.equal(config.verifyIdentity, true);
  assert.ok(config.ca.includes('\nexample\n'));
});
test('missing files and conflicting CA sources fail closed', () => {
  assert.throws(() => sslConfig({DB_SSL_CA_PATH:'./certs/nonexistent.pem'}), /Cannot read/);
  assert.throws(() => sslConfig({DB_SSL_CA_PATH:'a', DB_SSL_CA:'b'}), /only one/);
  assert.throws(() => sslConfig({DB_SSL_CA:'invalid'}), /PEM/);
});
