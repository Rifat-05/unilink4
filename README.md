# UNILINK Bangladesh

UNILINK is now a full-stack Node.js application. The Node server hosts the existing pages, injects the shared professional theme and language switch, and exposes a persistent authenticated REST API.

## Run locally

```bash
npm start
```

Open `http://localhost:3000`. Do not open the HTML files directly: authentication, shared styling, language persistence, and API requests are provided by the server.

For development with automatic server restarts:

```bash
npm run dev
```

No package installation or external database is required. Data is stored in `data/unilink.json`, which is created automatically and excluded from Git. Set `PORT` to change the default port (`3000`) and set `NODE_ENV=production` when serving behind HTTPS.

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Passwords are salted and hashed with Node's `scrypt`. Sessions use random, HTTP-only, SameSite cookies and expire after seven days. The supported account roles are `student`, `club`, `recruiter`, and `university`.

### Administrator login

- Email: `admin@unilink.bd`
- Password: `UniLinkAdmin#2026`
- Select **University** on the login screen.

Change the default credentials before the first production launch with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

## Product APIs

Each collection supports authenticated `GET`, `POST`, `GET /:id`, `PATCH /:id`, `PUT /:id`, and `DELETE /:id` operations. Records are scoped to their owner or members; university/admin accounts can manage administrative collections.

| Area | API collections |
| --- | --- |
| Accounts | `profiles`, `notifications` |
| Study partner | `partnerRequests`, `studyGroups`, `studySessions`, `conversations`, `messages` |
| Clubs | `clubs`, `clubMembers`, `clubEvents`, `clubTransactions`, `clubNotices` |
| Recruiting and bidding | `recruiterSearches`, `savedCandidates`, `bids`, `bounties`, `candidateAccessBids` |
| Administration | `partnerships`, `announcements`, `reports` |

Example:

```js
const group = await UNILINK_API.post('/studyGroups', {
  name: 'Algorithms Study Circle',
  subject: 'Algorithms'
});
```

API errors use a consistent shape: `{ "error": { "message": "..." } }`.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | development | Use `production` to add the Secure flag to cookies |
| `ADMIN_EMAIL` | `admin@unilink.bd` | Initial administrator email |
| `ADMIN_PASSWORD` | `UniLinkAdmin#2026` | Initial administrator password |
