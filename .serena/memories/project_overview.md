# Usogui Fansite Project Overview

## Purpose
This is a full-stack web application for the Usogui manga fansite. It includes features for:
- User authentication and profiles
- Content management (guides, media, quotes, gambles, events, characters, arcs)
- Admin dashboard for data management
- Reading progress tracking
- Community contributions

## Tech Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Passport.js with JWT
- **API Documentation**: Swagger/OpenAPI
- **Email**: Resend service
- **Security**: Helmet, rate limiting, bcrypt

### Frontend  
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) v6
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Authentication**: Custom auth provider
- **Admin Interface**: React Admin
- **Markdown**: react-markdown with remark-gfm
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)

## Project Structure
- `/server` - NestJS backend API
- `/client` - Next.js frontend application  
- `/docs` - Documentation and changelog
- `.serena/` - Serena AI assistant memory files

## Key Features
- User registration, login, email verification
- Reading progress tracking (539 chapters)
- Content management for manga-related data
- Markdown support for guides
- Admin dashboard for CRUD operations
- Responsive design with dark theme support