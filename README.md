# ECB Lightforce Academy

Vercel-first full-stack football/futsal platform for Bangladesh player discovery and exposure.

## Stack
- Next.js (App Router, TypeScript)
- MongoDB Atlas + Mongoose
- NextAuth (credentials auth)
- Cloudinary (direct image uploads)
- Tailwind CSS + Framer Motion

## Implemented (Phase 1)
- Modern landing page for ECB Lightforce brand story
- Player registration flow (`/register`)
- Login flow (`/login`) with role-ready session
- `ECB Hub` listing with filters:
  - available now
  - age range
  - position/search
- Public player profile page (`/players/[slug]`)
- Player dashboard profile editor (`/dashboard`) with photo management
- Expanded football/futsal landing page with:
  - autoplay hero media
  - live highlights + fixtures feed
  - embedded video zone
- Core APIs:
  - `POST /api/register/player`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `GET /api/players`
  - `GET /api/players/[slug]`
  - `GET|PATCH /api/player/profile`
  - `POST /api/uploads/sign`
  - `GET /api/landing/media`
  - `POST /api/admin/user-update-mail`
  - `GET|POST /api/auth/[...nextauth]`

## Local Setup
1. Install dependencies
```bash
npm install
```

2. Create env file
```bash
cp .env.example .env.local
```

3. Fill `.env.local`
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
NEXTAUTH_SECRET=<any-long-random-secret>
NEXTAUTH_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=<brevo-smtp-user>
BREVO_PASS=<brevo-smtp-pass>
EMAIL_SENDER_EMAIL=<verified-sender@example.com>
EMAIL_SENDER_NAME=ECB Lightforce
```

Note: `NEXTAUTH_URL` must match your actual dev port (`http://localhost:3000`, `http://localhost:3100`, etc.).  
If you change port, update this value and restart `npm run dev`.

## Upload Architecture (Vercel-Friendly)
- Browser uploads images directly to Cloudinary.
- Backend only returns short-lived signed parameters (`/api/uploads/sign`).
- MongoDB stores only `secure_url` values in player profile `photos`.
- This avoids file buffering on Vercel functions and scales better.

## MongoDB DNS Note
- If Node.js fails with `querySrv ECONNREFUSED` but Compass connects, keep `mongodb+srv` URI and set:
  - `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1`
- The app will auto-retry Mongo connection using those DNS servers.

4. Run dev server
```bash
npm run dev
```

## Seeder Scripts
Create initial admin and player accounts from terminal.

Seed admin:
```bash
npm run seed:admin -- --email=admin@ecb.com --password=Admin@123456 --name="ECB Admin"
```

Seed player:
```bash
npm run seed:user -- --email=player1@ecb.com --password=Player@123456 --name="Player One" --positions=CM,RW --age=22
```

After seeding:
- Login page: `/login`
- Admin media manager (admin role): `/admin/media`
- Player hub: `/ecb-hub`

## HTML Seed Pages
You can also seed from browser forms:
- Admin seeder page: `/seed/admin`
- User seeder page: `/seed/user`

Security:
- Set `SEEDER_KEY` in env to protect these endpoints.
- In non-development environments, seeding requires `SEEDER_KEY`.

## Deploy with Vercel (No VPS)
1. Push this repo to GitHub.
2. Import repo in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel domain URL after first deploy)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Deploy.

## MongoDB Collections
- `users`
- `playerprofiles`

## Next Milestones (Phase 2)
- Availability calendar + off-days editor
- Achievement and timeline CRUD
- Org role onboarding and shortlist system
- Admin moderation panel

## User Update Mail (Admin)
Send a friendly product update email to existing users.

Endpoint:
`POST /api/admin/user-update-mail`

Payload examples:

Preview only (no send):
```json
{ "preview": true, "limit": 20 }
```

Send to players (default role):
```json
{ "limit": 50 }
```

Send one test email first:
```json
{ "testEmail": "you@example.com" }
```
