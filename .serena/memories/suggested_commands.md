# Development Commands

## Frontend (Client)
```bash
cd client
yarn dev          # Start development server (with Turbopack)
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
```

## Backend (Server)
```bash
cd server
yarn start:dev    # Start development server
yarn build        # Build for production
yarn start:prod   # Start production server
yarn lint         # Run ESLint with fixes
yarn format       # Format code with Prettier
yarn test         # Run tests
yarn test:watch   # Run tests in watch mode
yarn test:cov     # Run tests with coverage

# Database commands
yarn db:generate  # Generate new migration
yarn db:migrate   # Run migrations
yarn db:revert    # Revert last migration
yarn db:seed      # Seed database
yarn db:reset     # Reset database (development only)
yarn db:check     # Check database consistency
```

## System Commands (macOS)
```bash
ls               # List files
find             # Find files
grep             # Search text (use rg/ripgrep when available)
cd               # Change directory
git              # Version control
curl             # HTTP requests
```

## Project Setup
1. Backend: Copy `.env.example` to `.env` and configure
2. Database: Set up PostgreSQL and run migrations/seeds
3. Frontend: Install dependencies with `yarn`
4. Both: Run development servers concurrently