# GTT website redesign

This folder holds every document for the October 2026 website redesign. The code is in the rest of this folder,
which is a full copy of the website repo on branch `feat/website-redesign-frontend`.

| Document | What it's for |
| --- | --- |
| [01-design-plan.md](01-design-plan.md) | The design plan (13 Oct 2026): pages, sections, form fields, visual design, build phases and open questions |
| [02-backend-build-guide.md](02-backend-build-guide.md) | How to build the backend: API contracts, database, file storage, emails, admin endpoints, tests and rollout |
| [03-frontend-build-notes.md](03-frontend-build-notes.md) | What has been built on the frontend, where each part lives, and what's left |

## How to run it

There are three levels. Start with the first; each later one needs more setup.

### 1. Look at the new pages (no backend needed)

```bash
cd frontend
npm install
VITE_FORMS_DEMO=true npm run dev
```

Open the address Vite prints (usually http://localhost:3000) and visit `/`, `/traders`, `/traders/apply`,
`/professional-investors`, `/professional-investors/enquire` and `/faqs`. In this demo mode, both forms skip the
backend and go straight to their confirmation screens.

### 2. Run the backend tests (no database needed)

```bash
cd backend
npm install
npx prisma generate
npm test
```

You should see `tests 48`, `pass 48`, `fail 0`. The tests use a fake database, fake email and fake file storage, so
they check the API logic without any setup.

### 3. Run the whole site on your machine

The backend needs a Postgres database and an S3-compatible file bucket. The easiest way to get both locally is
Docker Desktop. Open it first, then run:

```bash
# Postgres on port 5432
docker run -d --name gtt-postgres -e POSTGRES_PASSWORD=gtt -e POSTGRES_DB=gtt -p 5432:5432 postgres:16

# MinIO (a local stand-in for the Railway bucket): API on 9000, web console on 9001
docker run -d --name gtt-minio -e MINIO_ROOT_USER=gttlocal -e MINIO_ROOT_PASSWORD=gttlocal123 \
  -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
```

Open http://localhost:9001, log in with `gttlocal` / `gttlocal123`, and create a bucket called `gtt-applications`.

Create `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres:gtt@localhost:5432/gtt
JWT_SECRET=any-long-random-string
APP_URL=http://localhost:3000

# New for the redesign
TRADER_APPLICATIONS_OPEN=true
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=gtt-applications
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=gttlocal
S3_SECRET_ACCESS_KEY=gttlocal123
S3_FORCE_PATH_STYLE=true

# Optional: real emails. Without RESEND_API_KEY, emails are skipped and logged.
# RESEND_API_KEY=...
# EMAIL_FROM=...
# EMAIL_NOTIFY_TO=you@example.com

# Optional: an admin login for /admin
# ADMIN_EMAIL=you@example.com
# ADMIN_PASSWORD=choose-a-password
```

Then start the backend and frontend in two terminals:

```bash
# Terminal 1
cd backend
npx prisma migrate deploy   # creates all tables, including the new ones
npm run dev                 # API on http://localhost:3001

# Terminal 2
cd frontend
npm run dev                 # site on http://localhost:3000 (no VITE_FORMS_DEMO this time)
```

Submit the trader application at http://localhost:3000/traders/apply. The files appear in the MinIO console under
`gtt-applications/trader-applications/`.

#### Without Docker

Two small Node.js programs can stand in for Postgres and the bucket. Nothing is installed system-wide. Run each in
its own terminal from any empty folder, for example `~/gtt-local`:

```bash
# Terminal A: database (Postgres compiled to run inside Node), saved in ./pgdata
npx -y @electric-sql/pglite-socket@0.2.12 --db=./pgdata --port=54329 --max-connections=10

# Terminal B: file bucket stand-in, saved in ./s3data
mkdir -p s3data && npx -y s3rver@3.7.1 -d ./s3data -p 4569 --no-vhost-buckets --configure-bucket gtt-applications
```

The command for terminal A is `pglite-server`, provided by the `@electric-sql/pglite-socket` package. If `npx`
complains that it can't find it, run `npm install @electric-sql/pglite-socket@0.2.12` in that folder, then
`npx pglite-server --db=./pgdata --port=54329 --max-connections=10`.

Then use this `backend/.env` instead of the Docker one, and start the backend and frontend as above:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/postgres?sslmode=disable
JWT_SECRET=any-long-random-string
APP_URL=http://localhost:3000
COOKIE_SECURE=false
TRADER_APPLICATIONS_OPEN=true
S3_ENDPOINT=http://localhost:4569
S3_BUCKET=gtt-applications
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=S3RVER
S3_SECRET_ACCESS_KEY=S3RVER
S3_FORCE_PATH_STYLE=true
FORM_RATE_LIMIT_MAX=100
ENABLE_ENV_ADMIN_LOGIN=true
ADMIN_EMAIL=admin@gtt.local
ADMIN_PASSWORD=LocalPreview123!
```

This setup was run end to end on 20 Oct 2026: application and enquiry submitted, admin login, list, detail, and a
file downloaded through its signed link.

Notes:

- Use port 3000 for the frontend (the default). The backend only accepts browser requests from localhost:3000 and
  localhost:5173.
- Turtle Analytics and billing need more variables (Stripe, the Python service). The new pages and forms don't.
- To stop the containers later: `docker stop gtt-postgres gtt-minio`.
- The Docker version of level 3 hasn't been run yet; the no-Docker version has.

## Status (20 Oct 2026)

| Phase | Status |
| --- | --- |
| 1 Navigation and homepage | Built. Waiting on homepage copy approval. |
| 2 Traders page and application | Frontend and backend built and tested. Bucket not created yet. Admin dashboard screens not built. |
| 3 Investors page and enquiry | Frontend and backend built. Page behind `VITE_INVESTOR_PAGE_LIVE` until host sign-off. |
| 4 Checks and finishing | FAQs page and SEO metadata done. Manual form testing and deploy still to do. |
