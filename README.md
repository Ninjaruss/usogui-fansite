# L-file (Usogui Fansite)

A comprehensive fansite dedicated to the **Usogui** manga series by Toshio Sako. Explore characters, story arcs, gambles, and community-contributed content with built-in spoiler protection based on your reading progress.

## Features

### Content Database
- **Characters** - Detailed profiles with aliases, affiliations, backstories, and timeline appearances
- **Arcs & Volumes** - Complete story structure with all 49 volumes and 539 chapters indexed
- **Gambles** - Central theme of the manga with participants, factions, rules, outcomes, and strategic explanations
- **Events** - Key story moments linked to characters and chapters
- **Organizations** - Groups and affiliations within the Usogui universe, with character membership timelines
- **Quotes** - Memorable lines from the series
- **Character Relationships** - Mapped interactions between characters (allies, rivals, family, etc.)

### Community Features
- **Guides** - Community-written articles with markdown support and entity embeds
- **Media Gallery** - Fan-submitted artwork and screenshots
- **Annotations** - User-submitted analysis and commentary on characters, gambles, and arcs
- **Badges & Achievements** - Recognition system with Ko-fi supporter integration
- **User Profiles** - Customizable with character profile pictures and favorites

### Spoiler Protection
- **Reading Progress Tracking** - Set your current chapter to filter spoilers
- **Smart Content Hiding** - Events, deaths, and reveals hidden until you've read past them
- **Per-Page Spoiler Controls** - Reveal individual spoilers without changing your progress

### User Authentication
- **Fluxer OAuth2** - Primary sign-in via Fluxer account
- **Email/Password** - Standard account creation with email verification and password reset
- **Role-Based Access** - Public viewing, User submissions, Moderator approval, Admin management

### Technical Highlights
- Server-side rendering for SEO and fast initial loads
- Dark theme with responsive design
- Admin dashboard for content management and moderation workflows
- Full-text search across all content types
- Edit log and audit trail for content changes
- Rate limiting and security headers

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Mantine UI |
| Backend | NestJS, TypeORM, PostgreSQL, JWT Authentication |
| Auth | Fluxer OAuth2, Email/Password |
| Storage | Backblaze B2 |
| Email | Resend |
| Admin | React Admin |

## Project Structure

```
l-file/
├── client/          # Next.js frontend application
├── server/          # NestJS backend API
└── docs/            # Documentation and diagrams
```

## Getting Started

### Prerequisites
- Node.js 18+
- Yarn (not npm)
- PostgreSQL

### Installation

```bash
# Clone the repository
git clone https://github.com/ninjaruss/l-file.git
cd l-file

# Install dependencies
cd client && yarn install
cd ../server && yarn install
```

### Development

```bash
# Terminal 1 - Start the backend (port 3001)
cd server
yarn start:dev

# Terminal 2 - Start the frontend (port 3000)
cd client
yarn dev
```

### Database Setup

```bash
cd server

# Run migrations
yarn db:migrate

# Seed initial data
yarn db:seed
```

## Commands Reference

### Server (`/server`)
| Command | Description |
|---------|-------------|
| `yarn start:dev` | Start with hot reload |
| `yarn start` | Start production server |
| `yarn build` | Build for production |
| `yarn lint` | Run ESLint |
| `yarn db:migrate` | Run database migrations |
| `yarn db:seed` | Seed database with initial data |
| `yarn db:reset` | Full database reset (dev only) |
| `yarn db:backup` | Backup database |

### Client (`/client`)
| Command | Description |
|---------|-------------|
| `yarn dev` | Start dev server with Turbopack |
| `yarn build` | Build for production |
| `yarn lint` | Run ESLint |
| `yarn start` | Start production server |

## API Documentation

When the server is running, Swagger documentation is available at:
```
http://localhost:3001/api-docs
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This is a fan-made project and is not affiliated with or endorsed by Toshio Sako or any official Usogui publishers. All manga content, characters, and related materials are the property of their respective owners.

## Acknowledgments

- [Usogui Wiki](https://usogui.fandom.com/) for reference data
- The Usogui community for inspiration and support
