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
  - `GET /api/players`
  - `GET /api/players/[slug]`
  - `GET|PATCH /api/player/profile`
  - `POST /api/uploads/sign`
  - `GET /api/landing/media`
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
