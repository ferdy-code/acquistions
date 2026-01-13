# Quick Start Guide

Get the Acquisitions API running in 5 minutes or less!

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Git](https://git-scm.com/) installed

## Development Setup (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/ferdy-code/acquistions.git
cd acquistions
```

### Step 2: Start the Application

```bash
npm run docker:dev
```

That's it! This command will:
- Start a local Neon Postgres database
- Start the Express API server with hot reload
- Connect everything together

### Step 3: Run Database Migrations

In a new terminal window:

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Step 4: Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Sign Up:**
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "user"
  }'
```

**Sign In:**
```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

## Viewing Logs

```bash
# All logs
docker compose -f docker-compose.dev.yml logs -f

# App logs only
docker compose -f docker-compose.dev.yml logs -f app
```

## Making Code Changes

1. Edit any file in the `src/` directory
2. The server will automatically restart (hot reload enabled)
3. Your changes are immediately reflected

## Stopping the Application

```bash
# Stop containers
npm run docker:dev:down

# Stop and delete all data
docker compose -f docker-compose.dev.yml down -v
```

## Next Steps

- Read [README.md](README.md) for comprehensive documentation
- Read [DOCKER.md](DOCKER.md) for Docker-specific details
- Read [CLAUDE.md](CLAUDE.md) for architecture overview

## Common Commands

```bash
# Start development environment
npm run docker:dev

# Stop development environment
npm run docker:dev:down

# Rebuild containers
npm run docker:dev:build

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Run migrations
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open database studio
docker compose -f docker-compose.dev.yml exec app npm run db:studio

# Run linter
docker compose -f docker-compose.dev.yml exec app npm run lint

# Format code
docker compose -f docker-compose.dev.yml exec app npm run format
```

## Troubleshooting

### Port 3000 already in use

```bash
# Find what's using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change the port in .env.development
```

### Database connection issues

```bash
# Check if database is running
docker compose -f docker-compose.dev.yml ps

# Restart database
docker compose -f docker-compose.dev.yml restart neon-local
```

### Changes not reflecting

```bash
# Restart the app container
docker compose -f docker-compose.dev.yml restart app
```

## Need Help?

- Check [README.md](README.md) for full documentation
- Check [DOCKER.md](DOCKER.md) for Docker troubleshooting
- Open an issue on [GitHub](https://github.com/ferdy-code/acquistions/issues)

## Production Deployment

For production deployment instructions, see the [Production Deployment](README.md#production-deployment) section in README.md.
