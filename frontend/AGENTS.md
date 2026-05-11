# Repository Guidelines

## Project Structure & Module Organization
- Frontend entry is `index.html` and the app bootstraps from `src/main.tsx`.
- Core UI lives in `src/App.tsx`; shared components are in `src/components/`.
- Frontend assets and styles are in `src/assets/`, `src/styles/`, and `src/index.css`.
- `src/api/` holds frontend API helpers.
- Repository-level frontend notes live in `../docs/frontend/`.
- The backend is a sibling folder at `../backend/` with its own `package.json`, `src/`, and `prisma/`.

## Build, Test, and Development Commands
- `npm install`: install frontend dependencies.
- `npm run dev`: start the Vite dev server on the frontend.
- `npm run build`: create the production build in `dist/`.
- `cd ../backend && npm install`: install backend dependencies.
- `cd ../backend && npm run dev`: start the backend with nodemon.
- `cd ../backend && npm start`: run the backend server without reloads.

## Coding Style & Naming Conventions
- Frontend uses TypeScript + React (TSX) and ES module imports.
- Match existing formatting: 2-space indent, semicolons, double quotes.
- React components use PascalCase filenames (e.g., `src/components/Hero.tsx`).
- Keep CSS in `src/index.css` or `src/styles/` and prefer class-based styles.
- Backend is CommonJS; keep filenames lowerCamel or lower_snake (e.g., `email.js`).

## Testing Guidelines
- No automated test runner is configured in the frontend or backend.
- If you add tests, add a script like `npm test` and document the runner.

## Commit & Pull Request Guidelines
- Git history is minimal, so no established commit convention exists.
- Suggested format: `type(scope): summary` (e.g., `feat(hero): refine CTA`).
- PRs should include a concise description, linked issues, and UI screenshots.

## Configuration & Environment
- Vite config is in `vite.config.ts`.
- Frontend environment variables must use the `VITE_` prefix.
- Backend uses dotenv; see `../backend/.env.example` for required keys.
