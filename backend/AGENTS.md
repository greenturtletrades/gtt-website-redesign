# Repository Guidelines

## Project Structure & Module Organization
- `src/server.js` starts the HTTP server and `src/app.js` builds the Express app.
- `src/routes/` holds route modules by domain, including account, admin, analytics, billing, integrations, platform, and public endpoints.
- `src/services/` holds shared business helpers such as email delivery and account-state builders.
- `src/middleware/` holds reusable request/auth helpers.
- `src/db/prisma.js` owns Prisma client setup.
- `prisma/schema.prisma` and `prisma/migrations/` define database structure.
- `scripts/` holds one-off operational helpers.

## Build, Test, and Development Commands
- `npm install`: install backend dependencies.
- `npm run dev`: start the server with nodemon.
- `npm start`: run the production-style server entrypoint.
- `npm test`: run the Node test file at `src/app.test.js`.
- `npx prisma migrate deploy`: apply committed migrations.

## Coding Style & Naming Conventions
- The backend uses CommonJS modules.
- Match existing style: 2-space indentation, semicolons, and descriptive lower-case filenames.
- Keep route registration in focused modules instead of growing `src/app.js` further unless the logic is truly cross-cutting.

## Testing Guidelines
- The current test entry is `src/app.test.js` using Node's built-in test runner.
- Keep new backend tests close to the code they validate or follow the existing `*.test.js` naming pattern.

## Commit & Pull Request Guidelines
- Keep commits focused by layer: backend API, Prisma schema, and operational scripts should be easy to review independently.
- PRs should call out schema changes, required env vars, and any API contract changes affecting `../frontend`.

## Security & Configuration Tips
- Never commit `.env` files or raw API keys.
- Database, JWT, Stripe, Resend, and Redis configuration should be loaded from environment variables.
- When changing auth, billing, or admin behavior, verify the matching frontend API helper still matches the response shape.
