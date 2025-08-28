# Usogui Fansite - Frontend

A comprehensive Next.js frontend for the Usogui fansite with React Admin integration for content management.

## Features

- **Public Pages**: Characters, Arcs, Guides, Media, Series, and Gamble information
- **User Authentication**: Login system integrated with backend
- **Admin Panel**: React Admin interface for moderators and admins
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Community Features**: User-generated guides and media submissions

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Admin Interface**: React Admin
- **State Management**: Zustand
- **Animations**: Motion
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager
- Running backend server on `http://localhost:3001`

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   The `.env.local` file should contain:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. Run the development server:
   ```bash
   yarn dev
   ```

5. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
client/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/          # Admin panel (React Admin)
│   │   ├── characters/     # Character pages
│   │   ├── arcs/           # Story arc pages
│   │   ├── guides/         # Community guides
│   │   ├── media/          # Fan media gallery
│   │   ├── series/         # Series information
│   │   ├── gambles/        # Gamble mechanics
│   │   ├── login/          # Authentication
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable components
│   │   └── admin/          # Admin interface components
│   ├── lib/                # Utility libraries
│   │   └── api/            # API integration
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── tailwind.config.js      # Tailwind configuration
├── next.config.ts          # Next.js configuration
└── package.json            # Dependencies and scripts
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## User Roles & Permissions

### Public Users
- View all content
- Create account and login
- Submit guides and media
- Like guides

### Moderators
- All user permissions
- Edit existing content (except users table)
- Approve/reject submissions

### Admins
- All moderator permissions
- Access to user management
- Full system administration

## API Integration

The frontend communicates with the NestJS backend through REST APIs:

- **Authentication**: `/auth/login`, `/auth/logout`, `/auth/refresh`
- **Characters**: `/characters`
- **Arcs**: `/arcs`
- **Guides**: `/guides`
- **Media**: `/media`
- **Series**: `/series`
- **Gambles**: `/gambles`
- **Users**: `/users` (admin only)

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Implement proper error handling
- Write meaningful component and function names

### State Management
- Use Zustand for global state
- Keep API calls in custom hooks
- Handle loading and error states

### Security
- Validate all user inputs
- Use HTTPS in production
- Implement proper authentication checks
- Sanitize user-generated content

## Deployment

1. Build the application:
   ```bash
   yarn build
   ```

2. Start the production server:
   ```bash
   yarn start
   ```

The application will be available on port 3000 by default (client), while the backend API runs on port 3001.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of the Usogui Fansite and follows the same license terms.
