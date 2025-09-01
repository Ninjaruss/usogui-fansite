# Task Completion Workflow

## When Task is Completed

### 1. Code Quality Checks
```bash
# Frontend
cd client
yarn lint         # Check and fix linting issues
yarn build        # Ensure build succeeds

# Backend  
cd server
yarn lint         # Check and fix linting issues
yarn format       # Format code with Prettier
yarn build        # Ensure build succeeds
yarn test         # Run tests if available
```

### 2. Database Consistency (if applicable)
```bash
cd server
yarn db:check     # Check database consistency
yarn db:migrate   # Run any pending migrations
```

### 3. Manual Testing
- Test the implemented feature in development mode
- Verify all related functionality still works
- Check responsive design on different screen sizes
- Test edge cases and error scenarios

### 4. Git Workflow
- Stage relevant changes only
- Write descriptive commit messages
- Do NOT commit unless explicitly requested by user
- Follow conventional commit format when appropriate

## Quality Standards
- No TypeScript errors or warnings
- All lint rules passing
- Build succeeds without errors
- Code follows project conventions
- Responsive design maintained
- Accessibility considerations met
- Error handling implemented