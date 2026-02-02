# Docker Setup Guide

This document provides detailed information about the Docker setup for the Acquisitions API.

## Architecture Overview

### Development Environment

```
┌─────────────────────────────────────────────────────────┐
│                  Docker Network (app-network)            │
│                                                          │
│  ┌──────────────────┐       ┌──────────────────┐       │
│  │   Neon Local     │       │   Express App    │       │
│  │   (Postgres)     │◄──────┤   (Development)  │       │
│  │   Port: 5432     │       │   Port: 3000     │       │
│  └──────────────────┘       └──────────────────┘       │
│         │                            │                   │
│         │                            │                   │
│    [Volume]                     [Volumes]                │
│   neon_data                  ./src → /app/src           │
│                              ./logs → /app/logs         │
└─────────────────────────────────────────────────────────┘
         │                            │
         ↓                            ↓
   localhost:5432              localhost:3000
```

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│              Docker Network (app-network)                │
│                                                          │
│                  ┌──────────────────┐                   │
│                  │   Express App    │                   │
│                  │   (Production)   │                   │
│                  │   Port: 3000     │                   │
│                  └────────┬─────────┘                   │
│                           │                              │
│                           │                              │
│                      [Volume]                            │
│                   ./logs → /app/logs                    │
└───────────────────────────┼──────────────────────────────┘
                            │
                            ↓
                      localhost:3000
                            │
                            ↓
                 ┌──────────────────────┐
                 │   Neon Cloud DB      │
                 │   (External)         │
                 │   *.neon.tech        │
                 └──────────────────────┘
```

## Docker Files Explained

### Dockerfile (Multi-stage Build)

The Dockerfile uses a multi-stage build approach:

1. **base**: Base Node.js 20 Alpine image
2. **deps**: Production dependencies only (`npm ci --omit=dev`)
3. **development**: All dependencies + source code with hot reload
4. **production**: Optimized image with production dependencies only

Benefits:

- Smaller production image size
- Faster builds (cached layers)
- Security (non-root user in production)
- Development and production parity

### docker-compose.dev.yml

Development configuration with:

- **Neon Local container**: Local Postgres database
- **App container**: Express app with hot reload
- **Volumes**: Source code and logs mounted for live updates
- **Network**: Bridge network for container communication
- **Health checks**: Ensures database is ready before app starts

### docker-compose.prod.yml

Production configuration with:

- **App container only**: No local database
- **External Neon Cloud**: Connects to production database
- **No source mounting**: Code baked into the image
- **Health checks**: HTTP health endpoint monitoring
- **Restart policy**: Auto-restart on failure

## Environment Configuration

### Development (.env.development)

```env
DATABASE_URL=postgres://neondb_owner:localpassword@neon-local:5432/acquistions_dev
```

Key points:

- Hostname is `neon-local` (Docker service name)
- Credentials are dev-only (safe to commit)
- No SSL required for local connection

### Production (.env.production)

```env
DATABASE_URL=postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
```

Key points:

- Hostname is Neon Cloud endpoint
- Strong generated secrets (never commit)
- SSL required (`sslmode=require`)
- Injected via secrets management in production

## Common Tasks

### Development

#### Start everything

```bash
npm run docker:dev
# or
docker compose -f docker-compose.dev.yml up
```

#### Start in background

```bash
docker compose -f docker-compose.dev.yml up -d
```

#### Rebuild containers

```bash
npm run docker:dev:build
# or
docker compose -f docker-compose.dev.yml up --build
```

#### View logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# App only
docker compose -f docker-compose.dev.yml logs -f app

# Database only
docker compose -f docker-compose.dev.yml logs -f neon-local
```

#### Execute commands in container

```bash
# Run migrations
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open shell
docker compose -f docker-compose.dev.yml exec app sh

# Run linter
docker compose -f docker-compose.dev.yml exec app npm run lint
```

#### Stop services

```bash
npm run docker:dev:down
# or
docker compose -f docker-compose.dev.yml down
```

#### Reset database (delete all data)

```bash
docker compose -f docker-compose.dev.yml down -v
```

### Production

#### Build production image

```bash
docker compose -f docker-compose.prod.yml build
```

#### Start production

```bash
npm run docker:prod
# or
docker compose -f docker-compose.prod.yml up -d
```

#### View production logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

#### Run migrations in production

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

#### Stop production

```bash
npm run docker:prod:down
# or
docker compose -f docker-compose.prod.yml down
```

## Volumes

### Development Volumes

| Host Path   | Container Path             | Purpose                |
| ----------- | -------------------------- | ---------------------- |
| `./src`     | `/app/src`                 | Source code hot reload |
| `./logs`    | `/app/logs`                | Application logs       |
| `neon_data` | `/var/lib/postgresql/data` | Database persistence   |

### Production Volumes

| Host Path | Container Path | Purpose          |
| --------- | -------------- | ---------------- |
| `./logs`  | `/app/logs`    | Application logs |

## Networking

### Development

- **Network name**: `app-network`
- **Type**: Bridge
- **Services**:
  - `neon-local`: Postgres database (internal port 5432)
  - `app`: Express application (internal port 3000)
- **External access**:
  - App: `localhost:3000`
  - Database: `localhost:5432`

### Production

- **Network name**: `app-network`
- **Type**: Bridge
- **Services**:
  - `app`: Express application (internal port 3000)
- **External access**:
  - App: `localhost:3000`
- **External connections**:
  - Neon Cloud database (via internet)

## Database Connection Strings

### Development (Inside Docker Network)

```
postgres://neondb_owner:localpassword@neon-local:5432/acquistions_dev
         └─────┬──────┘ └─────┬─────┘  └────┬────┘ └──┬──┘ └──────┬──────┘
              user         password     service name  port     database
```

### Development (From Host Machine)

```
postgres://neondb_owner:localpassword@localhost:5432/acquistions_dev
```

### Production

```
postgres://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
         └──┬──┘ └──┬──┘  └─────────────────┬─────────────────────┘ └──┬─┘  └──────┬──────┘
           user  password        Neon Cloud hostname                database  SSL mode
```

## Troubleshooting

### Issue: Database connection refused

**Symptoms:**

```
Error: connect ECONNREFUSED neon-local:5432
```

**Solution:**

```bash
# Check if database is running
docker compose -f docker-compose.dev.yml ps

# Check database logs
docker compose -f docker-compose.dev.yml logs neon-local

# Restart database
docker compose -f docker-compose.dev.yml restart neon-local
```

### Issue: Port already in use

**Symptoms:**

```
Error: bind: address already in use
```

**Solution:**

```bash
# Find what's using the port (macOS/Linux)
lsof -i :3000

# Find what's using the port (Windows)
netstat -ano | findstr :3000

# Change port in .env.development
PORT=3001
```

### Issue: Changes not reflecting (hot reload not working)

**Symptoms:** Code changes don't trigger server restart

**Solution:**

```bash
# Ensure volumes are mounted correctly
docker compose -f docker-compose.dev.yml config

# Restart the app container
docker compose -f docker-compose.dev.yml restart app

# Check if nodemon/watch is running
docker compose -f docker-compose.dev.yml logs app
```

### Issue: Permission denied (production)

**Symptoms:**

```
Error: EACCES: permission denied
```

**Solution:**
The production Dockerfile runs as non-root user `nodejs`. Ensure directories are created with correct permissions:

```dockerfile
RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app
```

### Issue: Database data persists after down

**Symptoms:** Old data appears after `docker compose down && up`

**Explanation:** Docker volumes persist data by default.

**Solution:**

```bash
# Remove volumes to reset database
docker compose -f docker-compose.dev.yml down -v
```

### Issue: npm ci fails during build

**Symptoms:**

```
npm ERR! code ENOLOCK
```

**Solution:**
Ensure `package-lock.json` exists and is up to date:

```bash
npm install
git add package-lock.json
```

## Best Practices

### Development

1. **Always use volumes for source code** - Enables hot reload
2. **Don't commit .env.local files** - Contains local overrides
3. **Use `down -v` sparingly** - It deletes all database data
4. **Check logs regularly** - Use `logs -f` to debug issues
5. **Run migrations after schema changes** - Keep database in sync

### Production

1. **Never use default secrets** - Generate strong random secrets
2. **Use environment variables** - Don't hardcode configuration
3. **Enable health checks** - Monitor container health
4. **Use non-root user** - Improves security
5. **Mount logs directory** - Persist logs for debugging
6. **Set restart policies** - Ensure high availability
7. **Test locally first** - Use `docker-compose.prod.yml` before deployment

## Security Considerations

### Development

- Default credentials are safe to commit
- Local database is isolated in Docker network
- No SSL required for local connections

### Production

- **Secrets management**: Use AWS Secrets Manager, HashiCorp Vault, or similar
- **Environment variables**: Inject via platform (Railway, Render, etc.)
- **Network security**: Use VPC/private networks when possible
- **SSL/TLS**: Always use `sslmode=require` for Neon connections
- **Image scanning**: Scan for vulnerabilities before deployment
- **Least privilege**: Run as non-root user (already configured)

## Platform-Specific Deployment

### Railway

1. Add `Dockerfile` to repository
2. Set environment variables in Railway dashboard
3. Railway auto-detects and builds the Dockerfile
4. Set `PORT` env var (Railway provides dynamically)

### Render

1. Create new Web Service
2. Select "Docker" as environment
3. Set environment variables in Render dashboard
4. Deploy from GitHub

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Set secrets
fly secrets set DATABASE_URL=postgres://...
fly secrets set JWT_SECRET=...

# Deploy
fly deploy
```

### AWS ECS

1. Push image to ECR
2. Create Task Definition with Dockerfile
3. Create ECS Service
4. Use AWS Systems Manager Parameter Store for secrets
5. Configure Application Load Balancer

## Performance Optimization

### Development

- Use `npm ci` instead of `npm install` (faster, deterministic)
- Layer caching: Dependencies before source code
- Multi-stage builds: Separate dev and prod dependencies

### Production

- Use Alpine base image (smaller size)
- Run as non-root user (security)
- Only include production dependencies
- Implement health checks (monitoring)
- Use reverse proxy (nginx) for static files

## Monitoring

### Container Health

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View resource usage
docker stats

# Check health endpoint
curl http://localhost:3000/health
```

### Application Logs

```bash
# Real-time logs
docker compose -f docker-compose.prod.yml logs -f app

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 app

# Save logs to file
docker compose -f docker-compose.prod.yml logs app > app.log
```

## Additional Resources

- [Neon Local Documentation](https://neon.tech/docs/local/neon-local)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
