# Acquisitions API

A modern Express.js REST API with authentication, built with Node.js, Neon Postgres, and Drizzle ORM.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
  - [Option 1: Docker (Recommended)](#option-1-docker-recommended)
  - [Option 2: Local Development](#option-2-local-development)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database Migrations](#database-migrations)
- [Environment Variables](#environment-variables)

## Features

- User authentication (signup, signin, signout)
- JWT token-based session management
- Secure password hashing with bcrypt
- HTTP-only cookie storage
- Request validation with Zod
- Comprehensive logging with Winston
- Security middleware (Helmet, CORS)
- Type-safe database queries with Drizzle ORM

## Tech Stack

- **Runtime**: Node.js 20 (ES Modules)
- **Framework**: Express 5.x
- **Database**: Neon Postgres (Serverless)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: JWT + bcrypt
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS

## Prerequisites

### For Docker Development (Recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### For Local Development
- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/) (v10+)
- Access to a [Neon Database](https://neon.tech/) project

## Development Setup

### Option 1: Docker (Recommended)

This setup uses **Neon Local** via Docker for a fully local development environment.

#### 1. Clone the repository

```bash
git clone https://github.com/ferdy-code/acquistions.git
cd acquistions
```

#### 2. Configure environment variables

The `.env.development` file is already configured for Docker development:

```bash
# Review the file (already configured for Neon Local)
cat .env.development
```

#### 3. Start the development environment

```bash
# Start both the app and Neon Local database
docker compose -f docker-compose.dev.yml up

# Or run in detached mode
docker compose -f docker-compose.dev.yml up -d
```

This command will:
- Start a Neon Local PostgreSQL container on port 5432
- Start the Express app on port 3000
- Enable hot reload (changes to `src/` will auto-restart the server)
- Mount logs to `./logs` directory

#### 4. Run database migrations

```bash
# Run migrations inside the running container
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Or generate new migrations after schema changes
docker compose -f docker-compose.dev.yml exec app npm run db:generate
```

#### 5. Access the application

- **API**: http://localhost:3000
- **Database**: `localhost:5432` (credentials in `.env.development`)
- **Drizzle Studio**: Run `docker compose -f docker-compose.dev.yml exec app npm run db:studio`

#### 6. View logs

```bash
# View all logs
docker compose -f docker-compose.dev.yml logs -f

# View app logs only
docker compose -f docker-compose.dev.yml logs -f app

# View database logs only
docker compose -f docker-compose.dev.yml logs -f neon-local
```

#### 7. Stop the environment

```bash
# Stop and remove containers
docker compose -f docker-compose.dev.yml down

# Stop and remove containers + volumes (deletes database data)
docker compose -f docker-compose.dev.yml down -v
```

### Option 2: Local Development

If you prefer running without Docker:

#### 1. Install dependencies

```bash
npm install
```

#### 2. Set up environment variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Neon Cloud DATABASE_URL
# Get your connection string from https://console.neon.tech
```

#### 3. Run database migrations

```bash
npm run db:migrate
```

#### 4. Start the development server

```bash
npm run dev
```

The server will start with hot reload enabled on http://localhost:3000.

## Production Deployment

### Prerequisites

1. **Neon Cloud Database**: Create a production database at [neon.tech](https://neon.tech)
2. **Secrets**: Generate strong secrets for JWT and cookies

### Option 1: Docker Production Deployment

#### 1. Configure production environment

```bash
# Edit .env.production with your actual values
cp .env.production .env.production.local

# Generate strong secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For COOKIE_SECRET
```

Update `.env.production.local`:
```env
DATABASE_URL=postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your-generated-secret-here
COOKIE_SECRET=your-generated-cookie-secret-here
ALLOWED_ORIGINS=https://yourdomain.com
```

#### 2. Build and run production container

```bash
# Build the production image
docker compose -f docker-compose.prod.yml build

# Start the production container
docker compose -f docker-compose.prod.yml up -d
```

#### 3. Run database migrations

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Option 2: Cloud Platform Deployment

For platforms like **Railway**, **Render**, **Fly.io**, or **AWS ECS**:

#### 1. Set environment variables in your platform

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://...neon.tech/...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=1d
COOKIE_SECRET=your-cookie-secret
LOG_LEVEL=info
```

#### 2. Use the Dockerfile

Most platforms auto-detect the `Dockerfile` and build the production stage.

#### 3. Run migrations

Add a release command or run manually:
```bash
npm run db:migrate
```

### Environment Differences

| Feature | Development (Neon Local) | Production (Neon Cloud) |
|---------|-------------------------|------------------------|
| Database | Local Docker container | Neon Cloud (serverless) |
| Connection | `neon-local:5432` | `*.neon.tech` |
| Hot Reload | ✅ Enabled | ❌ Disabled |
| Logs | Console + Files | Files only |
| Secrets | Dev placeholders | Strong generated secrets |
| SSL Mode | Not required | Required (`sslmode=require`) |

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/sign-up`

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "User registered",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST `/api/auth/sign-in`

Login an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "User signed in successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

Sets an HTTP-only cookie with JWT token.

#### POST `/api/auth/sign-out`

Logout the current user.

**Response (200):**
```json
{
  "message": "User signed out successfully"
}
```

Clears the authentication cookie.

## Project Structure

```
acquistions/
├── src/
│   ├── config/           # Configuration (database, logger)
│   ├── controllers/      # Request handlers
│   ├── models/           # Drizzle ORM schemas
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Shared utilities
│   ├── validations/      # Zod schemas
│   ├── app.js            # Express app setup
│   ├── server.js         # Server initialization
│   └── index.js          # Entry point
├── drizzle/              # Database migrations
├── logs/                 # Application logs
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.dev.yml    # Development with Neon Local
├── docker-compose.prod.yml   # Production configuration
├── .env.development      # Dev environment variables
├── .env.production       # Production template
└── package.json          # Dependencies and scripts
```

## Database Migrations

### Generate new migration

After modifying schema in `src/models/*.js`:

```bash
# Local
npm run db:generate

# Docker
docker compose -f docker-compose.dev.yml exec app npm run db:generate
```

### Apply migrations

```bash
# Local
npm run db:migrate

# Docker (Development)
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Docker (Production)
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### Open Drizzle Studio

Visual database browser:

```bash
# Local
npm run db:studio

# Docker
docker compose -f docker-compose.dev.yml exec app npm run db:studio
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `DATABASE_URL` | Neon database connection string | `postgres://...` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-secret-key` |
| `LOG_LEVEL` | Winston log level | `debug`, `info`, `error` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration | `1d` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `COOKIE_SECRET` | Cookie encryption secret | - |

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Database operations
npm run db:generate    # Generate migrations
npm run db:migrate     # Apply migrations
npm run db:studio      # Open Drizzle Studio
```

## Docker Commands Cheat Sheet

### Development

```bash
# Start services
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Restart app after dependency changes
docker compose -f docker-compose.dev.yml restart app

# Access app container shell
docker compose -f docker-compose.dev.yml exec app sh

# Stop services
docker compose -f docker-compose.dev.yml down

# Remove all data (volumes)
docker compose -f docker-compose.dev.yml down -v
```

### Production

```bash
# Build production image
docker compose -f docker-compose.prod.yml build

# Start production service
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop production service
docker compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Database connection issues (Docker)

```bash
# Check if Neon Local is running
docker compose -f docker-compose.dev.yml ps

# Check database logs
docker compose -f docker-compose.dev.yml logs neon-local

# Restart database
docker compose -f docker-compose.dev.yml restart neon-local
```

### Hot reload not working (Docker)

Ensure volumes are mounted correctly in `docker-compose.dev.yml`:
```yaml
volumes:
  - ./src:/app/src
  - /app/node_modules  # Don't overwrite node_modules
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in .env file
PORT=3001
```

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
