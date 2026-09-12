# Aiven MySQL TLS setup

Use MySQL 8.0.13 or newer. Download the CA certificate from your Aiven service
and save it as `certs/ca.pem` in the project root. This is the public CA
certificate, not a client private key.

Add to `.env` (alongside your existing connection variables):

```dotenv
DB_SSL_CA_PATH=./certs/ca.pem
```

Relative certificate paths resolve from the project root. Providing the CA
enables TLS in development as well as production. Certificate and hostname
verification remain enabled. Missing certificate files cause an error; the
connection never falls back to unverified TLS.

Run:

```sh
npm install
npm run db:setup
```

Setup creates missing tables and indexes without seeding accounts. MySQL DDL
commits implicitly: if a step fails, earlier steps remain, and setup can be
rerun. Existing tables are not rebuilt or silently migrated.

## Vercel

Configure your existing `DATABASE_URL` (mysql://...) or `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD`, and `DB_NAME`, plus `NODE_ENV=production`.

Choose one CA method:

- Deploy `certs/ca.pem` with your source and set
  `DB_SSL_CA_PATH=./certs/ca.pem`. The current Vercel function build includes
  `certs/**/*.pem`.
- Set `DB_SSL_CA` to the complete PEM contents in Vercel environment settings
  and leave `DB_SSL_CA_PATH` unset. Actual newlines and literal `\n` are both
  supported. No certificate file is needed for this method.

Redeploy after changing environment variables. Do not configure both CA
variables. A successful setup validates the database layer; it does not imply
the existing JSON-backed application routes have been migrated to MySQL.
