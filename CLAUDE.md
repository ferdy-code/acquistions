# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Express.js REST API built with a modern Node.js stack, focusing on authentication and user management. The project uses Neon Postgres as the database with Drizzle ORM for type-safe database operations.

## Development Commands

- `npm run dev` - Start development server with Node.js watch mode
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without modifying files

## Database Commands

- `npm run db:generate` - Generate Drizzle migration files from schema changes in `src/models/*.js`
- `npm run db:migrate` - Apply pending migrations to the database
- `npm run db:studio` - Open Drizzle Studio (visual database browser) in browser

## Architecture

### Import Aliases

The project uses Node.js subpath imports (package.json `imports` field) for clean, absolute imports:

- `#config/*` → `./src/config/*`
- `#controllers/*` → `./src/controllers/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#services/*` → `./src/services/*`
- `#utils/*` → `./src/utils/*`
- `#validations/*` → `./src/validations/*`

Always use these aliases instead of relative imports (e.g., `import logger from '#config/logger.js'`).

### Application Flow

1. **Entry Point**: `src/index.js` loads environment variables and starts `src/server.js`
2. **Server Setup**: `src/server.js` initializes the Express app from `src/app.js` and starts listening
3. **App Configuration**: `src/app.js` configures middleware (helmet, cors, morgan, cookie-parser) and routes

### Layer Architecture

The codebase follows a clean MVC-style architecture with service layer:

**Routes** (`src/routes/*.routes.js`) → **Controllers** (`src/controllers/*.controller.js`) → **Services** (`src/services/*.service.js`) → **Models** (`src/models/*.model.js`)

- **Routes**: Define API endpoints and map them to controllers
- **Controllers**: Handle HTTP request/response, validate input with Zod schemas, call services
- **Services**: Contain business logic, interact with database through Drizzle ORM
- **Models**: Define Drizzle schema using `drizzle-orm/pg-core` table definitions
- **Validations**: Zod schemas in `src/validations/*.validation.js` for request validation
- **Utils**: Shared utilities (JWT, cookies, formatting)

### Database (Drizzle ORM + Neon Postgres)

- Database client configured in `src/config/database.js` using `@neondatabase/serverless`
- Drizzle instance exported as `db` from `#config/database.js`
- Schema models defined in `src/models/*.model.js` using Drizzle's pgTable
- Migrations generated in `drizzle/` directory
- Configuration in `drizzle.config.js` points to schema files and database URL

**Example query pattern**:
```javascript
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
```

### Logging

Winston logger configured in `src/config/logger.js`:
- Logs to `logs/error.log` (errors only) and `logs/combined.log` (all logs)
- Console output in non-production environments
- Morgan HTTP request logging integrated with Winston
- Use `logger.info()`, `logger.error()`, etc. throughout the codebase

### Authentication Pattern

- JWT tokens generated with `jwttoken.sign()` from `#utils/jwt.js`
- Tokens stored in HTTP-only cookies via `cookies.set()` from `#utils/cookies.js`
- Passwords hashed with bcrypt (10 rounds) in `src/services/auth.service.js`
- Token expiration: 1 day (configurable via JWT_EXPIRES_IN)

### Code Style

ESLint configuration enforces:
- 2-space indentation
- Single quotes
- Semicolons required
- Unix line endings
- Prefer const over let, no var
- Arrow functions preferred
- Unused vars prefixed with underscore (`_`) are allowed
