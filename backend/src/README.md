# Backend Source

This folder is now split by backend responsibility.

- `app.js` wires middleware, shared helpers, and route registration
- `server.js` starts the HTTP server
- `routes/` contains HTTP route registration modules by domain
- `services/` contains shared business helpers used across routes
- `middleware/` contains reusable request/auth middleware helpers
- `db/` contains Prisma client setup
- `app.test.js` contains the current backend test harness

The main remaining complexity lives inside the analytics and EA helper logic in `app.js`, but the route registration surface is now separated from the larger assembly file.
