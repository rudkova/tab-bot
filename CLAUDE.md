# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development mode with hot reloading using Node.js experimental transform types
- `npm run build` - Generate Prisma client and compile TypeScript
- `npm start` - Run the compiled bot in production
- `npm run watch` - Watch TypeScript files and auto-compile
- `npm test` - Run Jest tests (configured with ES modules support)
- `npm run lint` - Lint code with ESLint (includes unused imports checking)
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Database Commands

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio for database management

## Project Architecture

This is a Telegram bot for medication expiration reminders with the following key architectural patterns:

### Core Architecture

- **Entry Point**: `src/index.ts` - Bootstraps the bot and handles graceful shutdown
- **Bot Factory**: `src/bot/bot-factory.ts` - Creates and configures the bot instance
- **Router Service**: `src/bot/bot-router.service.ts` - Sets up command handlers and routing
- **Handler Pattern**: Individual command handlers in `src/bot/handlers/` implementing `BotCommandHandler` interface

### Handler Architecture

All bot command handlers follow a consistent pattern:

- Implement `BotCommandHandler<C extends BotContext>` interface
- Located in `src/bot/handlers/`
- Handle specific commands (start, help, add_medication, etc.)
- Use dependency injection pattern for services

### Feature-Based Organization

The codebase uses feature-based folder structure:

- `src/features/user/` - User management (repository, service, types)
- `src/features/medication/` - Medication CRUD operations with validation
- `src/features/notification/` - Notification scheduling and delivery

### Database Layer

- **ORM**: Prisma with PostgreSQL
- **Schema**: `prisma/schema.prisma` defines User, Medication, and Notification models
- **Repository Pattern**: Each feature has its own repository class
- **Connection**: Database connection handled in `src/shared/database/db.ts`

### Shared Services

- **Logger**: Winston-based logger in `src/shared/logger/logger.ts`
- **Conversation State**: In-memory state management for multi-step conversations
- **Date Utilities**: Date manipulation helpers in `src/shared/utils/`
- **Configuration**: Centralized config in `src/configs/config.ts`

### Cron Jobs

- **Notification Cron**: `src/jobs/notification-cron.ts` handles scheduled medication reminders
- **Health Check**: `src/jobs/health-check.ts` monitors bot health

## Testing

- Tests use Jest with ES module support
- Setup file: `src/jest.setup.ts`
- Test utilities: `src/__test-utils__/generator.ts`
- Pre-commit hooks run tests automatically via lint-staged

## Development Setup

Initial database setup requires:

```bash
psql postgres -c "CREATE DATABASE tabs_bot;"
npx prisma migrate dev --name init
```

## Code Style

- ESLint with TypeScript strict rules
- Unused imports automatically removed on lint fix
- Prettier for formatting
- Pre-commit hooks enforce code quality
- Use comments sparingly - only comment complex code
- Always use descriptive variable names
- use project code style for error handling and logging

## Database

- The database schema is defined in @prisma/schema.prisma file. Refer to this file anytime you need to understand structure of data stored in the database.
