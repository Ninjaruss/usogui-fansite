# Code Conventions & Style Guide

## General Principles
- TypeScript for all code
- Functional components with hooks in React
- Consistent naming conventions across frontend/backend
- ESLint and Prettier for code formatting

## Frontend (Next.js/React)
- **File Structure**: App router with page.tsx files
- **Components**: Functional components with TypeScript interfaces
- **State**: Zustand for global state, useState/useEffect for local
- **Styling**: Material-UI components with Tailwind CSS utilities
- **API Calls**: Custom api utility with SWR for data fetching
- **Routing**: Next.js app router with dynamic routes
- **Authentication**: Custom AuthProvider context

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Files: kebab-case for pages, PascalCase for components
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase with descriptive names

## Backend (NestJS)
- **Architecture**: Modular structure with controllers/services/entities
- **Database**: TypeORM with entities and migrations
- **DTOs**: Validation with class-validator decorators
- **Authentication**: JWT strategy with role-based guards
- **API**: RESTful endpoints with Swagger documentation

### Naming Conventions
- Classes: PascalCase (e.g., `UserService`)
- Files: kebab-case (e.g., `user.service.ts`)
- Database tables: snake_case
- API endpoints: kebab-case
- Environment variables: UPPER_SNAKE_CASE

## Documentation
- JSDoc comments for complex functions
- README files for setup instructions
- Swagger/OpenAPI for API documentation
- Changelog for tracking changes

## Error Handling
- Frontend: Try-catch with user-friendly error messages
- Backend: Global exception filters with proper HTTP status codes
- Validation: Class-validator decorators with meaningful messages